const LAMPORTS_PER_SOL = 1_000_000_000;

export function solToLamports(sol: number): number {
	return Math.round(sol * LAMPORTS_PER_SOL);
}

export function lamportsToSol(lamports: number | bigint): number {
	return Number(lamports) / LAMPORTS_PER_SOL;
}

export function formatSol(lamports: number | bigint, fractionDigits = 4): string {
	return lamportsToSol(lamports).toFixed(fractionDigits);
}

export function bpsToPercent(bps: number): number {
	return (bps / 10_000) * 100;
}
