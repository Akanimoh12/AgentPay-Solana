import { PublicKey } from "@solana/web3.js";
import { createHash } from "node:crypto";
import {
	AGENT_SEED,
	WALLET_SEED,
	CONFIG_SEED,
	ESCROW_SEED,
	ESCROW_VAULT_SEED,
	SPLIT_SEED,
} from "./constants.js";

export function shortenPubkey(pubkey: PublicKey | string, chars = 4): string {
	const s = typeof pubkey === "string" ? pubkey : pubkey.toBase58();
	if (s.length <= chars * 2 + 3) return s;
	return `${s.slice(0, chars)}...${s.slice(-chars)}`;
}

/**
 * Derive a deterministic 32-byte agent id from any human label.
 * Used so callers can mint stable PDAs from a name string.
 */
export function deriveAgentId(label: string): Uint8Array {
	return new Uint8Array(createHash("sha256").update(label).digest());
}

export function agentPda(programId: PublicKey, agentId: Uint8Array): PublicKey {
	return PublicKey.findProgramAddressSync(
		[Buffer.from(AGENT_SEED), Buffer.from(agentId)],
		programId,
	)[0];
}

export function walletPointerPda(programId: PublicKey, owner: PublicKey): PublicKey {
	return PublicKey.findProgramAddressSync(
		[Buffer.from(WALLET_SEED), owner.toBuffer()],
		programId,
	)[0];
}

export function configPda(programId: PublicKey): PublicKey {
	return PublicKey.findProgramAddressSync([Buffer.from(CONFIG_SEED)], programId)[0];
}

export function escrowPda(programId: PublicKey, escrowId: Uint8Array): PublicKey {
	return PublicKey.findProgramAddressSync(
		[Buffer.from(ESCROW_SEED), Buffer.from(escrowId)],
		programId,
	)[0];
}

export function escrowVaultPda(programId: PublicKey, escrowId: Uint8Array): PublicKey {
	return PublicKey.findProgramAddressSync(
		[Buffer.from(ESCROW_VAULT_SEED), Buffer.from(escrowId)],
		programId,
	)[0];
}

export function splitPda(programId: PublicKey, splitId: Uint8Array): PublicKey {
	return PublicKey.findProgramAddressSync(
		[Buffer.from(SPLIT_SEED), Buffer.from(splitId)],
		programId,
	)[0];
}

export function randomId32(): Uint8Array {
	const buf = new Uint8Array(32);
	crypto.getRandomValues(buf);
	return buf;
}
