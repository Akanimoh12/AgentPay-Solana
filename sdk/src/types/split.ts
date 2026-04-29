import type { PublicKey } from "@solana/web3.js";

export interface SplitRecipient {
	wallet: PublicKey;
	shareBps: number;
}

export interface SplitConfig {
	splitId: Uint8Array;
	owner: PublicKey;
	ownerAgentId: Uint8Array;
	recipients: SplitRecipient[];
	active: boolean;
}
