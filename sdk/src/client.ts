import {
	Connection,
	Keypair,
	PublicKey,
	type Commitment,
	type ConfirmOptions,
} from "@solana/web3.js";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import bs58 from "bs58";
import { ClientConfigSchema, type ClientConfig } from "./types/schemas.js";
import { RegistryModule } from "./modules/registry.js";
import { PaymentsModule } from "./modules/payments.js";
import { SplitsModule } from "./modules/splits.js";

function loadKeypair(secret: string): Keypair {
	const trimmed = secret.trim();
	if (trimmed.startsWith("[")) {
		return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(trimmed)));
	}
	return Keypair.fromSecretKey(bs58.decode(trimmed));
}

/**
 * Read-only wallet stand-in for use when no payer secret is provided.
 * Anchor's Wallet interface requires sign methods; reads don't need them.
 */
class ReadonlyWallet implements Wallet {
	readonly payer: Keypair;
	constructor(public publicKey: PublicKey) {
		this.payer = Keypair.generate();
	}
	async signTransaction<T>(): Promise<T> {
		throw new Error("Cannot sign with read-only wallet");
	}
	async signAllTransactions<T>(): Promise<T[]> {
		throw new Error("Cannot sign with read-only wallet");
	}
}

export class AgentPayClient {
	readonly connection: Connection;
	readonly provider: AnchorProvider;
	readonly registry: RegistryModule;
	readonly payments: PaymentsModule;
	readonly splits: SplitsModule;

	constructor(config: ClientConfig) {
		const commitment: Commitment = (config.commitment ?? "confirmed") as Commitment;
		this.connection = new Connection(config.rpcUrl, commitment);

		const wallet: Wallet = config.payerSecretKey
			? new Wallet(loadKeypair(config.payerSecretKey))
			: new ReadonlyWallet(PublicKey.default);

		const opts: ConfirmOptions = { commitment, preflightCommitment: commitment };
		this.provider = new AnchorProvider(this.connection, wallet, opts);

		this.registry = new RegistryModule(new PublicKey(config.programs.agentRegistry), this.provider);
		this.payments = new PaymentsModule(new PublicKey(config.programs.paymentRouter), this.provider);
		this.splits = new SplitsModule(new PublicKey(config.programs.splitVault), this.provider);
	}
}

export function createAgentPayClient(config: ClientConfig): AgentPayClient {
	const validated = ClientConfigSchema.parse(config);
	return new AgentPayClient(validated);
}
