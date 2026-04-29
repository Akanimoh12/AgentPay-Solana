export const paymentRouterIdl = {
	version: "0.1.0",
	name: "payment_router",
	instructions: [
		{
			name: "initialize",
			accounts: [
				{ name: "config", isMut: true, isSigner: false },
				{ name: "authority", isMut: true, isSigner: true },
				{ name: "systemProgram", isMut: false, isSigner: false },
			],
			args: [{ name: "protocolFeeBps", type: "u16" }],
		},
		{
			name: "setProtocolFee",
			accounts: [
				{ name: "config", isMut: true, isSigner: false },
				{ name: "authority", isMut: false, isSigner: true },
			],
			args: [{ name: "feeBps", type: "u16" }],
		},
		{
			name: "setFeeReceiver",
			accounts: [
				{ name: "config", isMut: true, isSigner: false },
				{ name: "authority", isMut: false, isSigner: true },
			],
			args: [{ name: "receiver", type: "publicKey" }],
		},
		{
			name: "payDirect",
			accounts: [
				{ name: "config", isMut: false, isSigner: false },
				{ name: "payer", isMut: true, isSigner: true },
				{ name: "recipient", isMut: true, isSigner: false },
				{ name: "feeReceiver", isMut: true, isSigner: false },
				{ name: "systemProgram", isMut: false, isSigner: false },
			],
			args: [
				{ name: "senderAgentId", type: { array: ["u8", 32] } },
				{ name: "recipientAgentId", type: { array: ["u8", 32] } },
				{ name: "amount", type: "u64" },
			],
		},
		{
			name: "createEscrow",
			accounts: [
				{ name: "escrow", isMut: true, isSigner: false },
				{ name: "escrowVault", isMut: true, isSigner: false },
				{ name: "payer", isMut: true, isSigner: true },
				{ name: "payee", isMut: false, isSigner: false },
				{ name: "systemProgram", isMut: false, isSigner: false },
			],
			args: [
				{ name: "escrowId", type: { array: ["u8", 32] } },
				{ name: "payerAgentId", type: { array: ["u8", 32] } },
				{ name: "payeeAgentId", type: { array: ["u8", 32] } },
				{ name: "amount", type: "u64" },
				{ name: "jobId", type: { array: ["u8", 32] } },
				{ name: "deadline", type: "i64" },
			],
		},
		{
			name: "releaseEscrow",
			accounts: [
				{ name: "config", isMut: false, isSigner: false },
				{ name: "escrow", isMut: true, isSigner: false },
				{ name: "escrowVault", isMut: true, isSigner: false },
				{ name: "payer", isMut: true, isSigner: true },
				{ name: "payee", isMut: true, isSigner: false },
				{ name: "feeReceiver", isMut: true, isSigner: false },
				{ name: "systemProgram", isMut: false, isSigner: false },
			],
			args: [],
		},
		{
			name: "cancelEscrow",
			accounts: [
				{ name: "config", isMut: false, isSigner: false },
				{ name: "escrow", isMut: true, isSigner: false },
				{ name: "escrowVault", isMut: true, isSigner: false },
				{ name: "payer", isMut: true, isSigner: true },
				{ name: "payee", isMut: true, isSigner: false },
				{ name: "feeReceiver", isMut: true, isSigner: false },
				{ name: "systemProgram", isMut: false, isSigner: false },
			],
			args: [],
		},
	],
	accounts: [
		{
			name: "RouterConfig",
			type: {
				kind: "struct",
				fields: [
					{ name: "authority", type: "publicKey" },
					{ name: "feeReceiver", type: "publicKey" },
					{ name: "protocolFeeBps", type: "u16" },
					{ name: "bump", type: "u8" },
				],
			},
		},
		{
			name: "Escrow",
			type: {
				kind: "struct",
				fields: [
					{ name: "escrowId", type: { array: ["u8", 32] } },
					{ name: "payer", type: "publicKey" },
					{ name: "payee", type: "publicKey" },
					{ name: "payerAgentId", type: { array: ["u8", 32] } },
					{ name: "payeeAgentId", type: { array: ["u8", 32] } },
					{ name: "amount", type: "u64" },
					{ name: "jobId", type: { array: ["u8", 32] } },
					{ name: "deadline", type: "i64" },
					{ name: "released", type: "bool" },
					{ name: "cancelled", type: "bool" },
					{ name: "createdAt", type: "i64" },
					{ name: "bump", type: "u8" },
					{ name: "vaultBump", type: "u8" },
				],
			},
		},
	],
	events: [
		{
			name: "DirectPayment",
			fields: [
				{ name: "from", type: { array: ["u8", 32] }, index: false },
				{ name: "to", type: { array: ["u8", 32] }, index: false },
				{ name: "amount", type: "u64", index: false },
				{ name: "fee", type: "u64", index: false },
			],
		},
		{
			name: "EscrowCreated",
			fields: [
				{ name: "escrowId", type: { array: ["u8", 32] }, index: false },
				{ name: "payerAgentId", type: { array: ["u8", 32] }, index: false },
				{ name: "payeeAgentId", type: { array: ["u8", 32] }, index: false },
				{ name: "amount", type: "u64", index: false },
			],
		},
		{
			name: "EscrowReleased",
			fields: [
				{ name: "escrowId", type: { array: ["u8", 32] }, index: false },
				{ name: "amount", type: "u64", index: false },
				{ name: "fee", type: "u64", index: false },
			],
		},
		{
			name: "EscrowCancelled",
			fields: [{ name: "escrowId", type: { array: ["u8", 32] }, index: false }],
		},
	],
	errors: [
		{ code: 6000, name: "FeeTooHigh", msg: "Fee exceeds maximum allowed" },
		{ code: 6001, name: "Unauthorized", msg: "Caller is not authorized" },
		{ code: 6002, name: "AlreadySettled", msg: "Escrow already settled" },
		{ code: 6003, name: "DeadlineNotReached", msg: "Deadline not reached" },
		{ code: 6004, name: "MathOverflow", msg: "Math overflow" },
	],
} as const;

export type PaymentRouterIdl = typeof paymentRouterIdl;
