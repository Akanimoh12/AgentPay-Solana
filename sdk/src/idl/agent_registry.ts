export const agentRegistryIdl = {
	version: "0.1.0",
	name: "agent_registry",
	instructions: [
		{
			name: "registerAgent",
			accounts: [
				{ name: "agent", isMut: true, isSigner: false },
				{ name: "walletPointer", isMut: true, isSigner: false },
				{ name: "owner", isMut: true, isSigner: true },
				{ name: "systemProgram", isMut: false, isSigner: false },
			],
			args: [
				{ name: "agentId", type: { array: ["u8", 32] } },
				{ name: "name", type: "string" },
				{ name: "services", type: { vec: "string" } },
			],
		},
		{
			name: "updateServices",
			accounts: [
				{ name: "agent", isMut: true, isSigner: false },
				{ name: "wallet", isMut: false, isSigner: true },
			],
			args: [{ name: "services", type: { vec: "string" } }],
		},
		{
			name: "deactivateAgent",
			accounts: [
				{ name: "agent", isMut: true, isSigner: false },
				{ name: "wallet", isMut: false, isSigner: true },
			],
			args: [],
		},
	],
	accounts: [
		{
			name: "AgentProfile",
			type: {
				kind: "struct",
				fields: [
					{ name: "wallet", type: "publicKey" },
					{ name: "agentId", type: { array: ["u8", 32] } },
					{ name: "name", type: "string" },
					{ name: "services", type: { vec: "string" } },
					{ name: "active", type: "bool" },
					{ name: "registeredAt", type: "i64" },
					{ name: "bump", type: "u8" },
				],
			},
		},
		{
			name: "WalletPointer",
			type: {
				kind: "struct",
				fields: [
					{ name: "agentId", type: { array: ["u8", 32] } },
					{ name: "bump", type: "u8" },
				],
			},
		},
	],
	events: [
		{
			name: "AgentRegistered",
			fields: [
				{ name: "agentId", type: { array: ["u8", 32] }, index: false },
				{ name: "wallet", type: "publicKey", index: false },
				{ name: "name", type: "string", index: false },
			],
		},
		{
			name: "ServicesUpdated",
			fields: [{ name: "agentId", type: { array: ["u8", 32] }, index: false }],
		},
		{
			name: "AgentDeactivated",
			fields: [{ name: "agentId", type: { array: ["u8", 32] }, index: false }],
		},
	],
	errors: [
		{ code: 6000, name: "Unauthorized", msg: "Caller is not the agent owner" },
		{ code: 6001, name: "NameTooLong", msg: "Name exceeds maximum length" },
		{ code: 6002, name: "ServiceTooLong", msg: "Service string exceeds maximum length" },
		{ code: 6003, name: "TooManyServices", msg: "Too many services" },
	],
} as const;

export type AgentRegistryIdl = typeof agentRegistryIdl;
