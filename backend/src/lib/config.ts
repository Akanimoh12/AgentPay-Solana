import { z } from "zod";
import "dotenv/config";

const ConfigSchema = z.object({
	apiPort: z.coerce.number().default(3001),
	databaseUrl: z.string().url(),
	redisUrl: z.string().default("redis://localhost:6379"),
	solanaCluster: z.enum(["testnet", "devnet", "mainnet-beta", "localnet"]).default("testnet"),
	solanaRpcUrl: z.string().url(),
	solanaCommitment: z.enum(["processed", "confirmed", "finalized"]).default("confirmed"),
	agentRegistryProgramId: z.string().min(32),
	paymentRouterProgramId: z.string().min(32),
	splitVaultProgramId: z.string().min(32),
	payerSecretKey: z.string().optional(),
});

const parsed = ConfigSchema.safeParse({
	apiPort: process.env.API_PORT,
	databaseUrl: process.env.DATABASE_URL,
	redisUrl: process.env.REDIS_URL,
	solanaCluster: process.env.SOLANA_CLUSTER,
	solanaRpcUrl: process.env.SOLANA_RPC_URL,
	solanaCommitment: process.env.SOLANA_COMMITMENT,
	agentRegistryProgramId: process.env.AGENT_REGISTRY_PROGRAM_ID,
	paymentRouterProgramId: process.env.PAYMENT_ROUTER_PROGRAM_ID,
	splitVaultProgramId: process.env.SPLIT_VAULT_PROGRAM_ID,
	payerSecretKey: process.env.PAYER_SECRET_KEY || undefined,
});

if (!parsed.success) {
	console.error("Invalid environment configuration:", parsed.error.format());
	process.exit(1);
}

export const config = parsed.data;
export type Config = z.infer<typeof ConfigSchema>;
