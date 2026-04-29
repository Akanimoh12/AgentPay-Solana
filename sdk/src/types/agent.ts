import type { PublicKey } from "@solana/web3.js";

export interface AgentProfile {
	wallet: PublicKey;
	agentId: Uint8Array;
	name: string;
	services: string[];
	active: boolean;
	registeredAt: number;
}
