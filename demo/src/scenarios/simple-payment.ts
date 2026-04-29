import chalk from "chalk";
import { Keypair } from "@solana/web3.js";
import { deriveAgentId, solToLamports } from "@agentpay/sdk";
import { getClient } from "../lib/client.js";

export async function run() {
	const client = getClient();
	const payer = client.provider.wallet.publicKey;

	// The recipient wallet is illustrative — for a real run, swap in a real pubkey.
	const recipient = Keypair.generate().publicKey;

	const senderLabel = `Sender-${Date.now()}`;
	const senderId = deriveAgentId(senderLabel);
	const recipientLabel = `Receiver-${Date.now()}`;
	const recipientId = deriveAgentId(recipientLabel);

	console.log(chalk.hex("#5B45FF")("Sending 0.01 SOL"));
	console.log(`  From: ${senderLabel}`);
	console.log(`  To:   ${recipient.toBase58()} (${recipientLabel})`);

	const signature = await client.payments.payDirect({
		senderAgentId: senderId,
		recipientAgentId: recipientId,
		recipient,
		amountLamports: solToLamports(0.01),
		payer,
	});
	console.log(chalk.green(`  ✓ Signature: ${signature}`));
	console.log(`    Amount:        0.01 SOL`);
	console.log(`    Fee (50 bps):  0.00005 SOL`);
	console.log(`    Net received:  0.00995 SOL`);

	console.log(chalk.green("\n✓ Simple payment complete"));
}
