import {
	pgTable,
	serial,
	integer,
	text,
	boolean,
	timestamp,
	jsonb,
} from "drizzle-orm/pg-core";

export const agents = pgTable("agents", {
	id: serial("id").primaryKey(),
	agentId: text("agent_id").unique().notNull(),
	wallet: text("wallet").notNull(),
	name: text("name").notNull(),
	services: jsonb("services").$type<string[]>().default([]),
	active: boolean("active").default(true),
	registeredAt: timestamp("registered_at").defaultNow(),
	createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
	id: serial("id").primaryKey(),
	type: text("type").notNull(),
	fromAgentId: text("from_agent_id").notNull(),
	toAgentId: text("to_agent_id").notNull(),
	amountLamports: text("amount_lamports").notNull(),
	feeLamports: text("fee_lamports"),
	signature: text("signature"),
	status: text("status").default("pending"),
	createdAt: timestamp("created_at").defaultNow(),
});

export const escrows = pgTable("escrows", {
	id: serial("id").primaryKey(),
	escrowId: text("escrow_id").unique().notNull(),
	payerAgentId: text("payer_agent_id").notNull(),
	payeeAgentId: text("payee_agent_id").notNull(),
	amountLamports: text("amount_lamports").notNull(),
	jobId: text("job_id"),
	deadline: timestamp("deadline"),
	status: text("status").default("active"),
	signature: text("signature"),
	createdAt: timestamp("created_at").defaultNow(),
	settledAt: timestamp("settled_at"),
});

export const invoices = pgTable("invoices", {
	id: serial("id").primaryKey(),
	invoiceId: text("invoice_id").unique().notNull(),
	fromAgentId: text("from_agent_id"),
	toAgentId: text("to_agent_id"),
	amountLamports: text("amount_lamports"),
	description: text("description"),
	status: text("status").default("draft"),
	createdAt: timestamp("created_at").defaultNow(),
});

export const splits = pgTable("splits", {
	id: serial("id").primaryKey(),
	splitId: text("split_id").unique().notNull(),
	ownerAgentId: text("owner_agent_id").notNull(),
	recipients: jsonb("recipients").$type<{ wallet: string; shareBps: number }[]>().default([]),
	totalRecipients: integer("total_recipients").default(0),
	status: text("status").default("active"),
	signature: text("signature"),
	createdAt: timestamp("created_at").defaultNow(),
});

export const distributions = pgTable("distributions", {
	id: serial("id").primaryKey(),
	splitId: text("split_id").notNull(),
	amountLamports: text("amount_lamports").notNull(),
	signature: text("signature"),
	createdAt: timestamp("created_at").defaultNow(),
});
