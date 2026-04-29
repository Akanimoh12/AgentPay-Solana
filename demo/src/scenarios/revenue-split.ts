import chalk from "chalk";
import { Keypair } from "@solana/web3.js";
import { deriveAgentId, randomId32, solToLamports } from "@agentpay/sdk";
import { getClient } from "../lib/client.js";

export async function run() {
	const client = getClient();
	const owner = client.provider.wallet.publicKey;

	const ownerAgentId = deriveAgentId(`SplitOwner-${Date.now()}`);
	const splitId = randomId32();

	const provider = Keypair.generate().publicKey;
	const referral = Keypair.generate().publicKey;
	const treasury = Keypair.generate().publicKey;

	console.log(chalk.hex("#00E5BF")("── Configuring Revenue Split ──"));
	console.log(`  Provider:   85.00%  (${provider.toBase58()})`);
	console.log(`  Referral:   10.00%  (${referral.toBase58()})`);
	console.log(`  Treasury:    5.00%  (${treasury.toBase58()})`);

	const configSig = await client.splits.configureSplit({
		splitId,
		ownerAgentId,
		recipients: [
			{ wallet: provider, shareBps: 8500 },
			{ wallet: referral, shareBps: 1000 },
			{ wallet: treasury, shareBps: 500 },
		],
		owner,
	});
	console.log(chalk.green(`  ✓ Split configured — Sig: ${configSig}`));
	console.log(chalk.dim(`    Split ID: ${Buffer.from(splitId).toString("hex")}`));

	console.log(chalk.hex("#00E5BF")("\n── Distributing 0.1 SOL ──"));
	const distSig = await client.splits.distribute({
		splitId,
		amountLamports: solToLamports(0.1),
		payer: owner,
	});
	console.log(chalk.green(`  ✓ Distribution — Sig: ${distSig}`));

	console.log(chalk.bold("\n  Distribution Breakdown:"));
	console.log(`    Provider  (85%):  0.085 SOL`);
	console.log(`    Referral  (10%):  0.010 SOL`);
	console.log(`    Treasury   (5%):  0.005 SOL`);

	console.log(chalk.green("\n✓ Revenue split demo complete"));
}
