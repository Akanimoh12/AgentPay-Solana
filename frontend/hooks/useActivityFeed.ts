"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatSol } from "@/lib/units";

interface ActivityEvent {
	id: string;
	type: string;
	description: string;
	timestamp: string;
}

export function useActivityFeed() {
	const agents = useQuery({
		queryKey: ["agents"],
		queryFn: () => api.agents.list(),
	});

	const payments = useQuery({
		queryKey: ["payments", "recent"],
		queryFn: () => api.payments.list({ limit: "8", offset: "0" }),
	});

	const isLoading = agents.isLoading || payments.isLoading;

	const events: ActivityEvent[] = [];

	if (agents.data) {
		agents.data.slice(0, 4).forEach((a: any, i: number) => {
			events.push({
				id: `agent-${i}`,
				type: "agent",
				description: `Agent ${a.name || a.agentId?.slice(0, 10)} registered`,
				timestamp: a.registeredAt || a.createdAt || new Date().toISOString(),
			});
		});
	}

	if (payments.data) {
		payments.data.slice(0, 4).forEach((p: any, i: number) => {
			const sol = formatSol(Number(p.amountLamports || 0));
			const desc =
				p.type === "escrow"
					? `Escrow ${p.status === "released" ? "released" : "created"} for ${sol} SOL`
					: `Payment of ${sol} SOL ${p.status}`;
			events.push({
				id: `payment-${i}`,
				type: p.type,
				description: desc,
				timestamp: p.createdAt || new Date().toISOString(),
			});
		});
	}

	events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

	return { events: events.slice(0, 8), isLoading };
}
