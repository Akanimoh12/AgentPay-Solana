export { AgentPayClient, createAgentPayClient } from "./client.js";

export { RegistryModule } from "./modules/registry.js";
export { PaymentsModule } from "./modules/payments.js";
export { SplitsModule } from "./modules/splits.js";

export * from "./types/index.js";

export {
	agentRegistryIdl,
	paymentRouterIdl,
	splitVaultIdl,
} from "./idl/index.js";

export {
	shortenPubkey,
	deriveAgentId,
	agentPda,
	walletPointerPda,
	configPda,
	escrowPda,
	escrowVaultPda,
	splitPda,
	randomId32,
} from "./utils/keys.js";

export {
	solToLamports,
	lamportsToSol,
	formatSol,
	bpsToPercent,
	percentToBps,
} from "./utils/amounts.js";

export {
	AgentPayError,
	AgentNotFoundError,
	EscrowNotFoundError,
	InsufficientFundsError,
} from "./utils/errors.js";

export {
	SOLANA_TESTNET_RPC,
	SOLANA_DEVNET_RPC,
	SOLANA_MAINNET_RPC,
	LAMPORTS_PER_SOL,
	MAX_SPLIT_RECIPIENTS,
	MAX_FEE_BPS,
	BPS_DENOMINATOR,
} from "./utils/constants.js";
