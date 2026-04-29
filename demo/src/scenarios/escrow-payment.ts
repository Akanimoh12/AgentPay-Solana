import chalk from "chalk";
import { Keypair } from "@solana/web3.js";
import { deriveAgentId, randomId32, solToLamports } from "@agentpay/sdk";
import { getClient } from "../lib/client.js";

export async function run() {
	const client = getClient();
	const payer = client.provider.wallet.publicKey;
	const payee = Keypair.generate().publicKey;

	const payerId = deriveAgentId(`TaskRequester-${Date.now()}`);
	const payeeId = deriveAgentId(`InferenceEngine-${Date.now()}`);

	const escrowId = randomId32();
	const jobId = deriveAgentId("inference-job-001");
	const deadline = Math.floor(Date.now() / 1000) + 3600;

	console.log(chalk.hex("#00E5BF")("── Creating Escrow ──"));
	console.log(`  Payer wallet: ${payer.toBase58()}`);
	console.log(`  Payee wallet: ${payee.toBase58()}`);
	console.log(`  Amount:       0.05 SOL`);
	console.log(`  Deadline:     ${new Date(deadline * 1000).toISOString()}`);

	const createSig = await client.payments.createEscrow({
		escrowId,
		payerAgentId: payerId,
		payeeAgentId: payeeId,
		payee,
		amountLamports: solToLamports(0.05),
		jobId,
		deadline,
		payer,
	});
	console.log(chalk.green(`  ✓ Escrow created — Sig: ${createSig}`));
	console.log(chalk.dim(`    Escrow ID: ${Buffer.from(escrowId).toString("hex")}`));

	const escrow = await client.payments.getEscrow(escrowId);
	console.log(`\n  Escrow status: released=${escrow.released} cancelled=${escrow.cancelled}`);

	console.log(chalk.hex("#00E5BF")("\n── Releasing Escrow ──"));
	const releaseSig = await client.payments.releaseEscrow(escrowId, payer);
	console.log(chalk.green(`  ✓ Escrow released — Sig: ${releaseSig}`));

	console.log(chalk.green("\n✓ Escrow payment demo complete"));
}
