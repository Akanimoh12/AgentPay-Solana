import { eq, desc } from "drizzle-orm";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { deriveAgentId, randomId32 } from "@agentpay/sdk";
import { db } from "../db/index.js";
import { splits, distributions } from "../db/schema.js";
import { getAgentPayClient } from "../lib/agentpay.js";

type ConfigureSplitParams = {
	agentId: string;
	recipients: { wallet: string; shareBps: number }[];
};

type DistributeParams = {
	amountLamports: string;
};

function agentIdBytes(agentId: string): Uint8Array {
	if (/^[0-9a-fA-F]{64}$/.test(agentId)) {
		return Uint8Array.from(Buffer.from(agentId, "hex"));
	}
	return deriveAgentId(agentId);
}

export class SplitService {
	async configure(params: ConfigureSplitParams) {
		const client = getAgentPayClient();
		const owner = client.provider.wallet.publicKey;
		const splitId = randomId32();
		const splitIdHex = Buffer.from(splitId).toString("hex");

		const recipients = params.recipients.map((r) => ({
			wallet: new PublicKey(r.wallet),
			shareBps: r.shareBps,
		}));

		const signature = await client.splits.configureSplit({
			splitId,
			ownerAgentId: agentIdBytes(params.agentId),
			recipients,
			owner,
		});

		const [row] = await db
			.insert(splits)
			.values({
				splitId: splitIdHex,
				ownerAgentId: params.agentId,
				recipients: params.recipients,
				totalRecipients: params.recipients.length,
				status: "active",
				signature,
			})
			.returning();

		return row;
	}

	async distribute(splitId: string, params: DistributeParams) {
		const client = getAgentPayClient();
		const payer = client.provider.wallet.publicKey;
		const signature = await client.splits.distribute({
			splitId: Uint8Array.from(Buffer.from(splitId, "hex")),
			amountLamports: new BN(params.amountLamports),
			payer,
		});

		const [dist] = await db
			.insert(distributions)
			.values({
				splitId,
				amountLamports: params.amountLamports,
				signature,
			})
			.returning();

		return { ...dist, signature };
	}

	async getAll() {
		return db.select().from(splits).orderBy(desc(splits.createdAt));
	}

	async getById(splitId: string) {
		const [row] = await db.select().from(splits).where(eq(splits.splitId, splitId));
		return row || null;
	}
}

export const splitService = new SplitService();
