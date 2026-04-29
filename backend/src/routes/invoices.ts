import { Hono } from "hono";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../db/index.js";
import { invoices } from "../db/schema.js";

const CreateInvoiceSchema = z.object({
	fromAgentId: z.string().min(1),
	toAgentId: z.string().min(1),
	amountLamports: z.string().min(1),
	description: z.string().min(1),
});

export const invoicesRoutes = new Hono();

invoicesRoutes.post("/", async (c) => {
	const body = await c.req.json();
	const parsed = CreateInvoiceSchema.parse(body);

	const [row] = await db
		.insert(invoices)
		.values({
			invoiceId: randomUUID(),
			fromAgentId: parsed.fromAgentId,
			toAgentId: parsed.toAgentId,
			amountLamports: parsed.amountLamports,
			description: parsed.description,
			status: "draft",
		})
		.returning();
	return c.json(row, 201);
});

invoicesRoutes.get("/", async (c) => {
	const agentId = c.req.query("agentId");
	const status = c.req.query("status");
	const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 50;
	const offset = c.req.query("offset") ? parseInt(c.req.query("offset")!) : 0;

	const conditions = [];
	if (agentId) conditions.push(eq(invoices.fromAgentId, agentId));
	if (status) conditions.push(eq(invoices.status, status));

	const query = db
		.select()
		.from(invoices)
		.orderBy(desc(invoices.createdAt))
		.limit(limit)
		.offset(offset);

	const rows = conditions.length ? await query.where(and(...conditions)) : await query;
	return c.json(rows);
});

invoicesRoutes.get("/:invoiceId", async (c) => {
	const invoiceId = c.req.param("invoiceId");
	const [row] = await db.select().from(invoices).where(eq(invoices.invoiceId, invoiceId));
	if (!row) return c.json({ error: { code: 404, message: "Invoice not found" } }, 404);
	return c.json(row);
});
