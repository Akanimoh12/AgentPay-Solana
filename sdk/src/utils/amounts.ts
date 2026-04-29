import BN from "bn.js";
import { LAMPORTS_PER_SOL, BPS_DENOMINATOR } from "./constants.js";

export function solToLamports(sol: number | string): BN {
	const value = typeof sol === "string" ? Number(sol) : sol;
	if (!Number.isFinite(value) || value < 0) {
		throw new Error(`Invalid SOL amount: ${sol}`);
	}
	return new BN(Math.round(value * LAMPORTS_PER_SOL));
}

export function lamportsToSol(lamports: BN | bigint | number): number {
	const n = BN.isBN(lamports)
		? lamports.toNumber()
		: typeof lamports === "bigint"
			? Number(lamports)
			: lamports;
	return n / LAMPORTS_PER_SOL;
}

export function formatSol(lamports: BN | bigint | number, fractionDigits = 4): string {
	return lamportsToSol(lamports).toFixed(fractionDigits);
}

export function bpsToPercent(bps: number): number {
	return (bps / BPS_DENOMINATOR) * 100;
}

export function percentToBps(percent: number): number {
	return Math.round((percent / 100) * BPS_DENOMINATOR);
}
