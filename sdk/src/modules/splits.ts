import { Program, AnchorProvider, BN, type Idl } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, AccountMeta } from "@solana/web3.js";
import { splitVaultIdl } from "../idl/split_vault.js";
import { splitPda } from "../utils/keys.js";
import type { SplitConfig, SplitRecipient } from "../types/split.js";

export class SplitsModule {
	readonly program: Program<Idl>;
	readonly programId: PublicKey;

	constructor(programId: PublicKey, provider: AnchorProvider) {
		this.programId = programId;
		this.program = new Program(
			{ ...splitVaultIdl, address: programId.toBase58() } as unknown as Idl,
			provider,
		);
	}

	async configureSplit(params: {
		splitId: Uint8Array;
		ownerAgentId: Uint8Array;
		recipients: SplitRecipient[];
		owner: PublicKey;
	}): Promise<string> {
		return this.program.methods
			.configureSplit(
				Array.from(params.splitId),
				Array.from(params.ownerAgentId),
				params.recipients,
			)
			.accounts({
				split: splitPda(this.programId, params.splitId),
				owner: params.owner,
				systemProgram: SystemProgram.programId,
			})
			.rpc();
	}

	async deactivateSplit(splitId: Uint8Array, owner: PublicKey): Promise<string> {
		return this.program.methods
			.deactivateSplit()
			.accounts({
				split: splitPda(this.programId, splitId),
				owner,
			})
			.rpc();
	}

	async distribute(params: {
		splitId: Uint8Array;
		amountLamports: BN;
		payer: PublicKey;
	}): Promise<string> {
		const split = await this.getSplit(params.splitId);
		const remaining: AccountMeta[] = split.recipients.map((r) => ({
			pubkey: r.wallet,
			isSigner: false,
			isWritable: true,
		}));
		return this.program.methods
			.distribute(new BN(params.amountLamports.toString()))
			.accounts({
				split: splitPda(this.programId, params.splitId),
				payer: params.payer,
				systemProgram: SystemProgram.programId,
			})
			.remainingAccounts(remaining)
			.rpc();
	}

	async getSplit(splitId: Uint8Array): Promise<SplitConfig> {
		const raw: any = await (this.program.account as any).splitConfig.fetch(
			splitPda(this.programId, splitId),
		);
		return {
			splitId: Uint8Array.from(raw.splitId),
			owner: raw.owner,
			ownerAgentId: Uint8Array.from(raw.ownerAgentId),
			recipients: raw.recipients.map((r: any) => ({
				wallet: r.wallet as PublicKey,
				shareBps: r.shareBps,
			})),
			active: raw.active,
		};
	}

	async listSplits(): Promise<SplitConfig[]> {
		const all: any[] = await (this.program.account as any).splitConfig.all();
		return all.map((entry) => ({
			splitId: Uint8Array.from(entry.account.splitId),
			owner: entry.account.owner,
			ownerAgentId: Uint8Array.from(entry.account.ownerAgentId),
			recipients: entry.account.recipients.map((r: any) => ({
				wallet: r.wallet as PublicKey,
				shareBps: r.shareBps,
			})),
			active: entry.account.active,
		}));
	}
}
