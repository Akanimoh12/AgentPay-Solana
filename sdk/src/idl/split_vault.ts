export const splitVaultIdl = {
	version: "0.1.0",
	name: "split_vault",
	instructions: [
		{
			name: "configureSplit",
			accounts: [
				{ name: "split", isMut: true, isSigner: false },
				{ name: "owner", isMut: true, isSigner: true },
				{ name: "systemProgram", isMut: false, isSigner: false },
			],
			args: [
				{ name: "splitId", type: { array: ["u8", 32] } },
				{ name: "ownerAgentId", type: { array: ["u8", 32] } },
				{
					name: "recipients",
					type: { vec: { defined: "SplitRecipient" } },
				},
			],
		},
		{
			name: "deactivateSplit",
			accounts: [
				{ name: "split", isMut: true, isSigner: false },
				{ name: "owner", isMut: false, isSigner: true },
			],
			args: [],
		},
		{
			name: "distribute",
			accounts: [
				{ name: "split", isMut: false, isSigner: false },
				{ name: "payer", isMut: true, isSigner: true },
				{ name: "systemProgram", isMut: false, isSigner: false },
			],
			args: [{ name: "amount", type: "u64" }],
		},
	],
	accounts: [
		{
			name: "SplitConfig",
			type: {
				kind: "struct",
				fields: [
					{ name: "splitId", type: { array: ["u8", 32] } },
					{ name: "owner", type: "publicKey" },
					{ name: "ownerAgentId", type: { array: ["u8", 32] } },
					{
						name: "recipients",
						type: { vec: { defined: "SplitRecipient" } },
					},
					{ name: "active", type: "bool" },
					{ name: "bump", type: "u8" },
				],
			},
		},
	],
	types: [
		{
			name: "SplitRecipient",
			type: {
				kind: "struct",
				fields: [
					{ name: "wallet", type: "publicKey" },
					{ name: "shareBps", type: "u16" },
				],
			},
		},
	],
	events: [
		{
			name: "SplitConfigured",
			fields: [
				{ name: "splitId", type: { array: ["u8", 32] }, index: false },
				{ name: "ownerAgentId", type: { array: ["u8", 32] }, index: false },
				{ name: "recipientCount", type: "u8", index: false },
			],
		},
		{
			name: "SplitDistributed",
			fields: [
				{ name: "splitId", type: { array: ["u8", 32] }, index: false },
				{ name: "totalAmount", type: "u64", index: false },
			],
		},
		{
			name: "SplitDeactivated",
			fields: [{ name: "splitId", type: { array: ["u8", 32] }, index: false }],
		},
	],
	errors: [
		{ code: 6000, name: "Unauthorized", msg: "Caller is not the split owner" },
		{ code: 6001, name: "InvalidRecipientCount", msg: "Recipient count must be between 1 and 10" },
		{ code: 6002, name: "SharesMustSumTo10000", msg: "Shares must sum to 10000" },
		{ code: 6003, name: "SplitNotActive", msg: "Split is not active" },
		{ code: 6004, name: "RecipientMismatch", msg: "Recipient accounts do not match split config" },
	],
} as const;

export type SplitVaultIdl = typeof splitVaultIdl;
