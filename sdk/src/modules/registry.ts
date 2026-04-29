import { Program, AnchorProvider, BN, type Idl } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { agentRegistryIdl } from "../idl/agent_registry.js";
import { agentPda, walletPointerPda } from "../utils/keys.js";
import { AgentNotFoundError } from "../utils/errors.js";
import type { AgentProfile } from "../types/agent.js";

export class RegistryModule {
	readonly program: Program<Idl>;
	readonly programId: PublicKey;

	constructor(programId: PublicKey, provider: AnchorProvider) {
		this.programId = programId;
		this.program = new Program(
			{ ...agentRegistryIdl, address: programId.toBase58() } as unknown as Idl,
			provider,
		);
	}

	async registerAgent(params: {
		agentId: Uint8Array;
		name: string;
		services: string[];
		owner: PublicKey;
	}): Promise<string> {
		const agent = agentPda(this.programId, params.agentId);
		const wallet = walletPointerPda(this.programId, params.owner);
		return this.program.methods
			.registerAgent(Array.from(params.agentId), params.name, params.services)
			.accounts({
				agent,
				walletPointer: wallet,
				owner: params.owner,
				systemProgram: SystemProgram.programId,
			})
			.rpc();
	}

	async updateServices(params: {
		agentId: Uint8Array;
		services: string[];
		owner: PublicKey;
	}): Promise<string> {
		return this.program.methods
			.updateServices(params.services)
			.accounts({
				agent: agentPda(this.programId, params.agentId),
				wallet: params.owner,
			})
			.rpc();
	}

	async deactivateAgent(params: {
		agentId: Uint8Array;
		owner: PublicKey;
	}): Promise<string> {
		return this.program.methods
			.deactivateAgent()
			.accounts({
				agent: agentPda(this.programId, params.agentId),
				wallet: params.owner,
			})
			.rpc();
	}

	async getAgent(agentId: Uint8Array): Promise<AgentProfile> {
		try {
			const raw: any = await (this.program.account as any).agentProfile.fetch(
				agentPda(this.programId, agentId),
			);
			return {
				wallet: raw.wallet,
				agentId: Uint8Array.from(raw.agentId),
				name: raw.name,
				services: raw.services,
				active: raw.active,
				registeredAt: (raw.registeredAt as BN).toNumber(),
			};
		} catch {
			throw new AgentNotFoundError(Buffer.from(agentId).toString("hex"));
		}
	}

	async getAgentByWallet(owner: PublicKey): Promise<Uint8Array | null> {
		try {
			const raw: any = await (this.program.account as any).walletPointer.fetch(
				walletPointerPda(this.programId, owner),
			);
			return Uint8Array.from(raw.agentId);
		} catch {
			return null;
		}
	}

	async listAgents(): Promise<AgentProfile[]> {
		const all: any[] = await (this.program.account as any).agentProfile.all();
		return all.map((entry) => ({
			wallet: entry.account.wallet,
			agentId: Uint8Array.from(entry.account.agentId),
			name: entry.account.name,
			services: entry.account.services,
			active: entry.account.active,
			registeredAt: (entry.account.registeredAt as BN).toNumber(),
		}));
	}
}
