import chalk from "chalk";
import { deriveAgentId } from "@agentpay/sdk";
import { getClient } from "../lib/client.js";

export async function run() {
	const client = getClient();
	const owner = client.provider.wallet.publicKey;

	const labelA = `DataProvider-${Date.now()}`;
	const labelB = `InferenceEngine-${Date.now()}`;
	const idA = deriveAgentId(labelA);
	const idB = deriveAgentId(labelB);

	console.log(chalk.hex("#5B45FF")("Registering Agent A: DataProvider"));
	console.log(chalk.dim(`  Label: ${labelA}`));
	const sigA = await client.registry.registerAgent({
		agentId: idA,
		name: "DataProvider",
		services: ["data-query", "batch-export"],
		owner,
	});
	console.log(chalk.green(`  ✓ Signature: ${sigA}`));

	console.log();
	console.log(chalk.hex("#5B45FF")("Registering Agent B: InferenceEngine"));
	console.log(chalk.dim(`  Label: ${labelB}`));
	const sigB = await client.registry.registerAgent({
		agentId: idB,
		name: "InferenceEngine",
		services: ["text-completion", "image-generation"],
		owner,
	});
	console.log(chalk.green(`  ✓ Signature: ${sigB}`));

	console.log();
	console.log(chalk.hex("#00E5BF")("Verifying registrations..."));

	const profileA = await client.registry.getAgent(idA);
	console.log(chalk.bold("\n  Agent A:"));
	console.log(`    Name:     ${profileA.name}`);
	console.log(`    Wallet:   ${profileA.wallet.toBase58()}`);
	console.log(`    Services: ${profileA.services.join(", ")}`);
	console.log(`    Active:   ${profileA.active}`);

	const profileB = await client.registry.getAgent(idB);
	console.log(chalk.bold("\n  Agent B:"));
	console.log(`    Name:     ${profileB.name}`);
	console.log(`    Wallet:   ${profileB.wallet.toBase58()}`);
	console.log(`    Services: ${profileB.services.join(", ")}`);
	console.log(`    Active:   ${profileB.active}`);

	console.log(chalk.green("\n✓ Agent registration complete"));
}
