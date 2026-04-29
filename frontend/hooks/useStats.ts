"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatSol } from "@/lib/units";

export function useStats() {
	const agents = useQuery({
		queryKey: ["agents"],
		queryFn: () => api.agents.list(),
	});

	const payments = useQuery({
		queryKey: ["payments"],
		queryFn: () => api.payments.list(),
	});

	const escrows = useQuery({
		queryKey: ["payments", "escrows"],
		queryFn: () => api.payments.list({ type: "escrow" }),
	});

	const isLoading = agents.isLoading || payments.isLoading || escrows.isLoading;

	const allPayments = payments.data || [];
	const allEscrows = escrows.data || [];

	const totalPayments = allPayments.length;
	const activeEscrows = allEscrows.filter((e: any) => e.status === "active").length;
	const registeredAgents = (agents.data || []).length;
	const totalLamports = allPayments.reduce(
		(sum: number, p: any) => sum + Number(p.amountLamports || 0),
		0,
	);

	return {
		totalPayments,
		activeEscrows,
		registeredAgents,
		totalVolume: formatSol(totalLamports),
		isLoading,
	};
}
