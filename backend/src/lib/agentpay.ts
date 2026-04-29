import { createAgentPayClient, type AgentPayClient } from "@agentpay/sdk";
import { config } from "./config.js";

let client: AgentPayClient | null = null;

export function getAgentPayClient(): AgentPayClient {
	if (!client) {
		client = createAgentPayClient({
			rpcUrl: config.solanaRpcUrl,
			cluster: config.solanaCluster,
			commitment: config.solanaCommitment,
			programs: {
				agentRegistry: config.agentRegistryProgramId,
				paymentRouter: config.paymentRouterProgramId,
				splitVault: config.splitVaultProgramId,
			},
			payerSecretKey: config.payerSecretKey,
		});
	}
	return client;
}
