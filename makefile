RPC_URL=http://anvil:8545

build:
	forge build

test:
	forge test

block:
	cast block-number --rpc-url $(RPC_URL)

accounts:
	cast accounts --rpc-url $(RPC_URL)

deploy:
	forge script script/DonationVault.s.sol:DonationVaultScript \
		--rpc-url $(RPC_URL) \
		--broadcast

clean:
	forge clean

snapshot:
	forge snapshot