import type { PublicKey } from "@solana/web3.js";
import type BN from "bn.js";

export interface Invoice {
	invoiceId: string;
	issuer: PublicKey;
	recipient: PublicKey;
	amountLamports: BN;
	memo?: string;
	createdAt: number;
	paid: boolean;
}
