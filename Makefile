# zkpoll dev tasks. Foundry installs to ~/.foundry/bin; we call it explicitly so this
# works even before a new shell picks up PATH.
FORGE := $(HOME)/.foundry/bin/forge
CAST  := $(HOME)/.foundry/bin/cast

# Local Moonbeam dev node = the local Moonriver-equivalent EVM (same Frontier EVM + bn254 precompiles).
NODE_IMAGE := moonbeamfoundation/moonbeam:v0.50.5
RPC        := http://localhost:9944
# Well-known PUBLIC Moonbeam dev account "Gerald" (pre-funded). LOCAL DEV ONLY — never use on mainnet.
# Address: 0x6Be02d1d3665660d22FF9624b7BE0551ee1Ac91b
DEV_KEY    := 0x99b3c12287537e38c90a9219d4cb074a89a16e9cdb20bf85728ebd97c343e342

.PHONY: test build fmt node-up node-down node-logs deploy-local deploy-sepolia backend backend-sepolia frontend

build:
	$(FORGE) build

test:
	$(FORGE) test -vv

fmt:
	$(FORGE) fmt

# Start the local dev node (Mac-friendly: port-mapped, RPC exposed). Seals a block every 1s.
# --platform linux/amd64 runs under emulation on Apple Silicon (the image is amd64-only).
node-up:
	docker run --rm -d --name zkpoll-node --platform linux/amd64 -p 9944:9944 $(NODE_IMAGE) \
		--dev --sealing 1000 --rpc-external --rpc-cors all
	@echo "Node RPC at $(RPC)  (chainId 1281). Tail logs: make node-logs"

node-logs:
	docker logs -f zkpoll-node

node-down:
	-docker stop zkpoll-node

# Deploy NLPoll + mock verifier to the running local node, open today's poll, and
# write deployments.local.json (consumed by the backend/frontend).
deploy-local:
	$(FORGE) script script/DeployLocal.s.sol:DeployLocal \
		--rpc-url $(RPC) --private-key $(DEV_KEY) --broadcast

# Deploy NLPollZK (real zkPassport verifier) to Sepolia and open the poll. Reads .env.
deploy-sepolia:
	set -a; . ./.env; set +a; \
	$(FORGE) script script/DeploySepolia.s.sol:DeploySepolia \
		--rpc-url $$SEPOLIA_RPC_URL --private-key $$RELAYER_KEY --broadcast

# The relayer + read API (independent backend, port 8787).
# Local mock node:
backend:
	cd backend && npm install && npm start
# Real Sepolia (relays real zkPassport proofs; reads RELAYER_KEY/SEPOLIA_RPC_URL from .env):
backend-sepolia:
	cd backend && npm install && NETWORK=sepolia npm start

# The voting UI (independent frontend, port 5173; proxies /api -> backend on :8787).
# Same UI for both modes — it adapts based on what the backend reports.
frontend:
	cd frontend && npm install && npm run dev
