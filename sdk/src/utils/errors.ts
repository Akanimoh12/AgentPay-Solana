export class AgentPayError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AgentPayError";
	}
}

export class AgentNotFoundError extends AgentPayError {
	constructor(agentId: string) {
		super(`Agent not found: ${agentId}`);
		this.name = "AgentNotFoundError";
	}
}

export class EscrowNotFoundError extends AgentPayError {
	constructor(escrowId: string) {
		super(`Escrow not found: ${escrowId}`);
		this.name = "EscrowNotFoundError";
	}
}

export class InsufficientFundsError extends AgentPayError {
	constructor(message = "Insufficient lamports for transaction") {
		super(message);
		this.name = "InsufficientFundsError";
	}
}
