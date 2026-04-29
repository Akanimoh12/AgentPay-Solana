import type { PublicKey } from "@solana/web3.js";
import type BN from "bn.js";

export interface Escrow {
	escrowId: Uint8Array;
	payer: PublicKey;
	payee: PublicKey;
	payerAgentId: Uint8Array;
	payeeAgentId: Uint8Array;
	amount: BN;
	jobId: Uint8Array;
	deadline: number;
	released: boolean;
	cancelled: boolean;
	createdAt: number;
}

export interface DirectPaymentParams {
	senderAgentId: Uint8Array;
	recipientAgentId: Uint8Array;
	recipient: PublicKey;
	amountLamports: BN;
}

export interface CreateEscrowParams {
	escrowId: Uint8Array;
	payerAgentId: Uint8Array;
	payeeAgentId: Uint8Array;
	payee: PublicKey;
	amountLamports: BN;
	jobId: Uint8Array;
	deadline: number;
}
