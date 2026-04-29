import { eq, and, desc } from "drizzle-orm";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { deriveAgentId, randomId32 } from "@agentpay/sdk";
import { db } from "../db/index.js";
import { payments, escrows } from "../db/schema.js";
import { getAgentPayClient } from "../lib/agentpay.js";

type DirectPayParams = {
	fromAgentId: string;
	toAgentId: string;
	recipientWallet: string;
	amountLamports: string;
};

type CreateEscrowParams = {
	payerAgentId: string;
	payeeAgentId: string;
	payeeWallet: string;
	amountLamports: string;
	jobId: string;
	deadline: string;
};

type PaymentFilters = {
	agentId?: string;
	type?: string;
	status?: string;
	limit?: number;
	offset?: number;
};

function agentIdBytes(agentId: string): Uint8Array {
	if (/^[0-9a-fA-F]{64}$/.test(agentId)) {
		return Uint8Array.from(Buffer.from(agentId, "hex"));
	}
	return deriveAgentId(agentId);
}

function jobIdBytes(jobId: string): Uint8Array {
	if (/^[0-9a-fA-F]{64}$/.test(jobId)) {
		return Uint8Array.from(Buffer.from(jobId, "hex"));
	}
	return deriveAgentId(jobId);
}

export class PaymentService {
	async payDirect(params: DirectPayParams) {
		const client = getAgentPayClient();
		const payer = client.provider.wallet.publicKey;
		const signature = await client.payments.payDirect({
			senderAgentId: agentIdBytes(params.fromAgentId),
			recipientAgentId: agentIdBytes(params.toAgentId),
			recipient: new PublicKey(params.recipientWallet),
			amountLamports: new BN(params.amountLamports),
			payer,
		});

		const [payment] = await db
			.insert(payments)
			.values({
				type: "direct",
				fromAgentId: params.fromAgentId,
				toAgentId: params.toAgentId,
				amountLamports: params.amountLamports,
				signature,
				status: "completed",
			})
			.returning();

		return payment;
	}

	async createEscrow(params: CreateEscrowParams) {
		const client = getAgentPayClient();
		const payer = client.provider.wallet.publicKey;
		const escrowId = randomId32();
		const escrowIdHex = Buffer.from(escrowId).toString("hex");
		const deadline = Math.floor(new Date(params.deadline).getTime() / 1000);

		const signature = await client.payments.createEscrow({
			escrowId,
			payerAgentId: agentIdBytes(params.payerAgentId),
			payeeAgentId: agentIdBytes(params.payeeAgentId),
			payee: new PublicKey(params.payeeWallet),
			amountLamports: new BN(params.amountLamports),
			jobId: jobIdBytes(params.jobId),
			deadline,
			payer,
		});

		const [escrow] = await db
			.insert(escrows)
			.values({
				escrowId: escrowIdHex,
				payerAgentId: params.payerAgentId,
				payeeAgentId: params.payeeAgentId,
				amountLamports: params.amountLamports,
				jobId: params.jobId,
				deadline: new Date(params.deadline),
				status: "active",
				signature,
			})
			.returning();

		return escrow;
	}

	async getEscrow(escrowId: string) {
		const [row] = await db.select().from(escrows).where(eq(escrows.escrowId, escrowId));
		return row || null;
	}

	async releaseEscrow(escrowId: string) {
		const client = getAgentPayClient();
		const payer = client.provider.wallet.publicKey;
		const signature = await client.payments.releaseEscrow(
			Uint8Array.from(Buffer.from(escrowId, "hex")),
			payer,
		);

		await db
			.update(escrows)
			.set({ status: "released", settledAt: new Date() })
			.where(eq(escrows.escrowId, escrowId));

		const [updated] = await db.select().from(escrows).where(eq(escrows.escrowId, escrowId));
		return { ...updated, signature };
	}

	async cancelEscrow(escrowId: string) {
		const client = getAgentPayClient();
		const payer = client.provider.wallet.publicKey;
		const signature = await client.payments.cancelEscrow(
			Uint8Array.from(Buffer.from(escrowId, "hex")),
			payer,
		);

		await db
			.update(escrows)
			.set({ status: "cancelled", settledAt: new Date() })
			.where(eq(escrows.escrowId, escrowId));

		const [updated] = await db.select().from(escrows).where(eq(escrows.escrowId, escrowId));
		return { ...updated, signature };
	}

	async getPayments(filters: PaymentFilters) {
		const conditions = [];
		if (filters.agentId) conditions.push(eq(payments.fromAgentId, filters.agentId));
		if (filters.type) conditions.push(eq(payments.type, filters.type));
		if (filters.status) conditions.push(eq(payments.status, filters.status));

		const limit = filters.limit || 50;
		const offset = filters.offset || 0;

		const query = db
			.select()
			.from(payments)
			.orderBy(desc(payments.createdAt))
			.limit(limit)
			.offset(offset);

		if (conditions.length) return query.where(and(...conditions));
		return query;
	}

	async getById(id: number) {
		const [row] = await db.select().from(payments).where(eq(payments.id, id));
		return row || null;
	}
}

export const paymentService = new PaymentService();
