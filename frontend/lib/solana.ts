import { clusterApiUrl, type Cluster } from "@solana/web3.js";

export const SOLANA_CLUSTER: Cluster =
	(process.env.NEXT_PUBLIC_SOLANA_CLUSTER as Cluster) || "testnet";

export const SOLANA_RPC_URL =
	process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(SOLANA_CLUSTER);

export const PROGRAM_IDS = {
	agentRegistry: process.env.NEXT_PUBLIC_AGENT_REGISTRY_PROGRAM_ID || "",
	paymentRouter: process.env.NEXT_PUBLIC_PAYMENT_ROUTER_PROGRAM_ID || "",
	splitVault: process.env.NEXT_PUBLIC_SPLIT_VAULT_PROGRAM_ID || "",
};

export function explorerTxUrl(signature: string): string {
	const cluster = SOLANA_CLUSTER === "mainnet-beta" ? "" : `?cluster=${SOLANA_CLUSTER}`;
	return `https://solscan.io/tx/${signature}${cluster}`;
}

export function explorerAddressUrl(address: string): string {
	const cluster = SOLANA_CLUSTER === "mainnet-beta" ? "" : `?cluster=${SOLANA_CLUSTER}`;
	return `https://solscan.io/address/${address}${cluster}`;
}
