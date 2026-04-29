import chalk from "chalk";
import { Keypair } from "@solana/web3.js";
import {
	deriveAgentId,
	randomId32,
	solToLamports,
	lamportsToSol,
	formatSol,
} from "@agentpay/sdk";
import { getClient } from "../lib/client.js";

function phase(label: string) {
	console.log(chalk.bold.hex("#5B45FF")(`\n${"═".repeat(50)}`));
	console.log(chalk.bold.hex("#5B45FF")(`  PHASE: ${label}`));
	console.log(chalk.bold.hex("#5B45FF")(`${"═".repeat(50)}\n`));
}

export async function run() {
	const client = getClient();
	const payer = client.provider.wallet.publicKey;

	const requesterWallet = Keypair.generate().publicKey;
	const providerWallet = Keypair.generate().publicKey;
	const referralWallet = Keypair.generate().publicKey;

	const requesterId = deriveAgentId(`TaskRequester-${Date.now()}`);
	const providerId = deriveAgentId(`InferenceProvider-${Date.now()}`);
	const referralId = deriveAgentId(`ReferralAgent-${Date.now()}`);

	phase("1 — Agent Registration");

	const sigRequester = await client.registry.registerAgent({
		agentId: requesterId,
		name: "TaskRequester",
		services: ["data-query"],
		owner: payer,
	});
	console.log(chalk.green(`  ✓ TaskRequester registered — Sig: ${sigRequester}`));

	const sigProvider = await client.registry.registerAgent({
		agentId: providerId,
		name: "InferenceProvider",
		services: ["text-completion", "image-generation"],
		owner: payer,
	});
	console.log(chalk.green(`  ✓ InferenceProvider registered — Sig: ${sigProvider}`));

	const sigReferral = await client.registry.registerAgent({
		agentId: referralId,
		name: "ReferralAgent",
		services: ["referral"],
		owner: payer,
	});
	console.log(chalk.green(`  ✓ ReferralAgent registered — Sig: ${sigReferral}`));

	phase("2 — Verify Registered Agents");

	const requesterProfile = await client.registry.getAgent(requesterId);
	const providerProfile = await client.registry.getAgent(providerId);
	console.log(`  TaskRequester:     ${requesterProfile.name} — active=${requesterProfile.active}`);
	console.log(`  InferenceProvider: ${providerProfile.name} — active=${providerProfile.active}`);

	phase("3 — Create Escrow");

	const escrowId = randomId32();
	const jobId = deriveAgentId("inference-job-full-workflow");
	const deadline = Math.floor(Date.now() / 1000) + 3600;
	const escrowAmount = solToLamports(0.05);

	const escrowSig = await client.payments.createEscrow({
		escrowId,
		payerAgentId: requesterId,
		payeeAgentId: providerId,
		payee: providerWallet,
		amountLamports: escrowAmount,
		jobId,
		deadline,
		payer,
	});
	console.log(chalk.green(`  ✓ Escrow created — Sig: ${escrowSig}`));
	console.log(`    Amount:   ${formatSol(escrowAmount)} SOL`);
	console.log(`    Deadline: ${new Date(deadline * 1000).toISOString()}`);

	phase("4 — Simulate Job Completion");

	console.log(chalk.yellow("  ⏳ Simulating inference job..."));
	await new Promise((r) => setTimeout(r, 2000));
	console.log(chalk.green("  ✓ Job completed successfully"));

	phase("5 — Release Escrow");

	const escrowState = await client.payments.getEscrow(escrowId);
	console.log(`  Before release: released=${escrowState.released} cancelled=${escrowState.cancelled}`);

	const releaseSig = await client.payments.releaseEscrow(escrowId, payer);
	console.log(chalk.green(`  ✓ Escrow released — Sig: ${releaseSig}`));
	console.log(`    Funds sent to InferenceProvider`);

	phase("6 — Revenue Split Distribution");

	const splitId = randomId32();
	const configSig = await client.splits.configureSplit({
		splitId,
		ownerAgentId: providerId,
		recipients: [
			{ wallet: providerWallet, shareBps: 8500 },
			{ wallet: referralWallet, shareBps: 1000 },
			{ wallet: payer, shareBps: 500 },
		],
		owner: payer,
	});
	console.log(chalk.green(`  ✓ Split configured — Sig: ${configSig}`));

	const distSig = await client.splits.distribute({
		splitId,
		amountLamports: solToLamports(0.1),
		payer,
	});
	console.log(chalk.green(`  ✓ Distributed — Sig: ${distSig}`));
	console.log(`    Provider  (85%): 0.085 SOL`);
	console.log(`    Referral  (10%): 0.010 SOL`);
	console.log(`    Treasury   (5%): 0.005 SOL`);

	phase("7 — Direct Payment");

	const recipientWallet = Keypair.generate().publicKey;
	const recipientId = deriveAgentId(`Recipient-${Date.now()}`);
	const directSig = await client.payments.payDirect({
		senderAgentId: requesterId,
		recipientAgentId: recipientId,
		recipient: recipientWallet,
		amountLamports: solToLamports(0.01),
		payer,
	});
	console.log(chalk.green(`  ✓ Direct payment sent — Sig: ${directSig}`));
	console.log(`    Amount: 0.01 SOL`);

	console.log(chalk.bold.hex("#00E5BF")(`\n${"═".repeat(50)}`));
	console.log(chalk.bold.hex("#00E5BF")("  FULL WORKFLOW SUMMARY"));
	console.log(chalk.bold.hex("#00E5BF")(`${"═".repeat(50)}`));
	console.log(`  Agents Registered:  3`);
	console.log(`  Agents Verified:    2`);
	console.log(`  Escrows Created:    1`);
	console.log(`  Escrows Released:   1`);
	console.log(`  Splits Configured:  1`);
	console.log(`  Distributions:      1`);
	console.log(`  Direct Payments:    1`);
	console.log(chalk.green("\n✓ Full workflow complete"));
}
