"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useSplits() {
	return useQuery({
		queryKey: ["splits"],
		queryFn: () => api.splits.list(),
	});
}

export function useSplit(splitId: string) {
	return useQuery({
		queryKey: ["split", splitId],
		queryFn: () => api.splits.get(splitId),
		enabled: !!splitId,
	});
}

export function useConfigureSplit() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: {
			agentId: string;
			recipients: { wallet: string; shareBps: number }[];
		}) => api.splits.configure(params),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["splits"] });
		},
	});
}

export function useDistribute() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: { splitId: string; amountLamports: string }) =>
			api.splits.distribute(params.splitId, { amountLamports: params.amountLamports }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["splits"] });
		},
	});
}
