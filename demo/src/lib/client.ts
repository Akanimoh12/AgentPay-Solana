import { createAgentPayClient, type AgentPayClient } from "@agentpay/sdk";

let cached: AgentPayClient | null = null;

export function getClient(): AgentPayClient {
	if (cached) return cached;

	const required = [
		"AGENT_REGISTRY_PROGRAM_ID",
		"PAYMENT_ROUTER_PROGRAM_ID",
		"SPLIT_VAULT_PROGRAM_ID",
		"PAYER_SECRET_KEY",
	];
	const missing = required.filter((k) => !process.env[k]);
	if (missing.length) {
		throw new Error(
			`Missing required env vars: ${missing.join(", ")}. Copy .env.example to .env and fill them in.`,
		);
	}

	cached = createAgentPayClient({
		rpcUrl: process.env.SOLANA_RPC_URL || "https://api.testnet.solana.com",
		cluster: (process.env.SOLANA_CLUSTER as any) || "testnet",
		commitment: (process.env.SOLANA_COMMITMENT as any) || "confirmed",
		programs: {
			agentRegistry: process.env.AGENT_REGISTRY_PROGRAM_ID!,
			paymentRouter: process.env.PAYMENT_ROUTER_PROGRAM_ID!,
			splitVault: process.env.SPLIT_VAULT_PROGRAM_ID!,
		},
		payerSecretKey: process.env.PAYER_SECRET_KEY,
	});
	return cached;
}
