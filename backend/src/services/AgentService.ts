import { eq, and } from "drizzle-orm";
import { PublicKey } from "@solana/web3.js";
import { deriveAgentId } from "@agentpay/sdk";
import { db } from "../db/index.js";
import { agents } from "../db/schema.js";
import { getAgentPayClient } from "../lib/agentpay.js";

type RegisterParams = {
	agentId: string;
	name: string;
	services: string[];
};

type AgentFilters = {
	active?: boolean;
	service?: string;
};

function agentIdBytes(agentId: string): Uint8Array {
	if (/^[0-9a-fA-F]{64}$/.test(agentId)) {
		return Uint8Array.from(Buffer.from(agentId, "hex"));
	}
	return deriveAgentId(agentId);
}

export class AgentService {
	async register(params: RegisterParams) {
		const client = getAgentPayClient();
		const owner = client.provider.wallet.publicKey;
		const idBytes = agentIdBytes(params.agentId);
		const signature = await client.registry.registerAgent({
			agentId: idBytes,
			name: params.name,
			services: params.services,
			owner,
		});

		const profile = await client.registry.getAgent(idBytes);

		const [agent] = await db
			.insert(agents)
			.values({
				agentId: params.agentId,
				wallet: profile.wallet.toBase58(),
				name: params.name,
				services: params.services,
				active: true,
			})
			.returning();

		return { ...agent, signature };
	}

	async getAll(filters: AgentFilters) {
		const conditions = [];
		if (filters.active !== undefined) {
			conditions.push(eq(agents.active, filters.active));
		}

		const rows = conditions.length
			? await db.select().from(agents).where(and(...conditions))
			: await db.select().from(agents);

		if (filters.service) {
			return rows.filter((r) => (r.services as string[])?.includes(filters.service!));
		}
		return rows;
	}

	async getById(agentId: string) {
		const [row] = await db.select().from(agents).where(eq(agents.agentId, agentId));
		if (row) return row;

		const client = getAgentPayClient();
		const profile = await client.registry.getAgent(agentIdBytes(agentId));
		return {
			agentId,
			wallet: profile.wallet.toBase58(),
			name: profile.name,
			services: profile.services,
			active: profile.active,
			registeredAt: new Date(profile.registeredAt * 1000),
		};
	}

	async updateServices(agentId: string, services: string[]) {
		const client = getAgentPayClient();
		const owner = client.provider.wallet.publicKey;
		const signature = await client.registry.updateServices({
			agentId: agentIdBytes(agentId),
			services,
			owner,
		});

		await db.update(agents).set({ services }).where(eq(agents.agentId, agentId));
		const [updated] = await db.select().from(agents).where(eq(agents.agentId, agentId));
		return { ...updated, signature };
	}
}

export const agentService = new AgentService();
