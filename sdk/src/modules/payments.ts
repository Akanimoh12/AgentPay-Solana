import { Program, AnchorProvider, BN, type Idl } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { paymentRouterIdl } from "../idl/payment_router.js";
import { configPda, escrowPda, escrowVaultPda } from "../utils/keys.js";
import { EscrowNotFoundError } from "../utils/errors.js";
import type { Escrow, DirectPaymentParams, CreateEscrowParams } from "../types/payment.js";

export class PaymentsModule {
	readonly program: Program<Idl>;
	readonly programId: PublicKey;

	constructor(programId: PublicKey, provider: AnchorProvider) {
		this.programId = programId;
		this.program = new Program(
			{ ...paymentRouterIdl, address: programId.toBase58() } as unknown as Idl,
			provider,
		);
	}

	private async feeReceiver(): Promise<PublicKey> {
		const cfg: any = await (this.program.account as any).routerConfig.fetch(
			configPda(this.programId),
		);
		return cfg.feeReceiver as PublicKey;
	}

	async initialize(authority: PublicKey, protocolFeeBps = 50): Promise<string> {
		return this.program.methods
			.initialize(protocolFeeBps)
			.accounts({
				config: configPda(this.programId),
				authority,
				systemProgram: SystemProgram.programId,
			})
			.rpc();
	}

	async payDirect(params: DirectPaymentParams & { payer: PublicKey }): Promise<string> {
		const feeReceiver = await this.feeReceiver();
		return this.program.methods
			.payDirect(
				Array.from(params.senderAgentId),
				Array.from(params.recipientAgentId),
				new BN(params.amountLamports.toString()),
			)
			.accounts({
				config: configPda(this.programId),
				payer: params.payer,
				recipient: params.recipient,
				feeReceiver,
				systemProgram: SystemProgram.programId,
			})
			.rpc();
	}

	async createEscrow(params: CreateEscrowParams & { payer: PublicKey }): Promise<string> {
		return this.program.methods
			.createEscrow(
				Array.from(params.escrowId),
				Array.from(params.payerAgentId),
				Array.from(params.payeeAgentId),
				new BN(params.amountLamports.toString()),
				Array.from(params.jobId),
				new BN(params.deadline),
			)
			.accounts({
				escrow: escrowPda(this.programId, params.escrowId),
				escrowVault: escrowVaultPda(this.programId, params.escrowId),
				payer: params.payer,
				payee: params.payee,
				systemProgram: SystemProgram.programId,
			})
			.rpc();
	}

	async releaseEscrow(escrowId: Uint8Array, payer: PublicKey): Promise<string> {
		const escrow = await this.getEscrow(escrowId);
		const feeReceiver = await this.feeReceiver();
		return this.program.methods
			.releaseEscrow()
			.accounts({
				config: configPda(this.programId),
				escrow: escrowPda(this.programId, escrowId),
				escrowVault: escrowVaultPda(this.programId, escrowId),
				payer,
				payee: escrow.payee,
				feeReceiver,
				systemProgram: SystemProgram.programId,
			})
			.rpc();
	}

	async cancelEscrow(escrowId: Uint8Array, payer: PublicKey): Promise<string> {
		const escrow = await this.getEscrow(escrowId);
		const feeReceiver = await this.feeReceiver();
		return this.program.methods
			.cancelEscrow()
			.accounts({
				config: configPda(this.programId),
				escrow: escrowPda(this.programId, escrowId),
				escrowVault: escrowVaultPda(this.programId, escrowId),
				payer,
				payee: escrow.payee,
				feeReceiver,
				systemProgram: SystemProgram.programId,
			})
			.rpc();
	}

	async getEscrow(escrowId: Uint8Array): Promise<Escrow> {
		try {
			const raw: any = await (this.program.account as any).escrow.fetch(
				escrowPda(this.programId, escrowId),
			);
			return {
				escrowId: Uint8Array.from(raw.escrowId),
				payer: raw.payer,
				payee: raw.payee,
				payerAgentId: Uint8Array.from(raw.payerAgentId),
				payeeAgentId: Uint8Array.from(raw.payeeAgentId),
				amount: raw.amount,
				jobId: Uint8Array.from(raw.jobId),
				deadline: (raw.deadline as BN).toNumber(),
				released: raw.released,
				cancelled: raw.cancelled,
				createdAt: (raw.createdAt as BN).toNumber(),
			};
		} catch {
			throw new EscrowNotFoundError(Buffer.from(escrowId).toString("hex"));
		}
	}

	async listEscrows(): Promise<Escrow[]> {
		const all: any[] = await (this.program.account as any).escrow.all();
		return all.map((entry) => ({
			escrowId: Uint8Array.from(entry.account.escrowId),
			payer: entry.account.payer,
			payee: entry.account.payee,
			payerAgentId: Uint8Array.from(entry.account.payerAgentId),
			payeeAgentId: Uint8Array.from(entry.account.payeeAgentId),
			amount: entry.account.amount,
			jobId: Uint8Array.from(entry.account.jobId),
			deadline: (entry.account.deadline as BN).toNumber(),
			released: entry.account.released,
			cancelled: entry.account.cancelled,
			createdAt: (entry.account.createdAt as BN).toNumber(),
		}));
	}
}
