import { z } from "zod";

const PubkeyString = z
	.string()
	.min(32)
	.max(44)
	.regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Must be a base58 Solana pubkey");

export const ClientConfigSchema = z.object({
	rpcUrl: z.string().url(),
	cluster: z.enum(["testnet", "devnet", "mainnet-beta", "localnet"]).default("testnet"),
	commitment: z.enum(["processed", "confirmed", "finalized"]).default("confirmed"),
	programs: z.object({
		agentRegistry: PubkeyString,
		paymentRouter: PubkeyString,
		splitVault: PubkeyString,
	}),
	/** Optional payer secret (base58 or JSON array string) for server-side signing. */
	payerSecretKey: z.string().optional(),
});

export type ClientConfig = z.input<typeof ClientConfigSchema>;
