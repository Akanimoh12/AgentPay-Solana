"use client";

import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ChevronRight } from "lucide-react";
import { CopyButton } from "@/components/ui/CopyButton";
import { StatusDot } from "@/components/ui/StatusDot";
import { SOLANA_CLUSTER } from "@/lib/solana";

const pageTitles: Record<string, string> = {
	"/dashboard": "Dashboard",
	"/dashboard/agents": "Agents",
	"/dashboard/payments": "Payments",
	"/dashboard/escrows": "Escrows",
	"/dashboard/invoices": "Invoices",
	"/dashboard/splits": "Revenue Splits",
};

function shortenAddress(address: string) {
	return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function Header() {
	const pathname = usePathname();
	const { publicKey, connected, disconnect } = useWallet();
	const { setVisible } = useWalletModal();
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const pageTitle = pageTitles[pathname] || pathname.split("/").pop() || "Dashboard";
	const address = publicKey?.toBase58() || "";

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				setDropdownOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<header className="flex h-16 items-center justify-between border-b border-border bg-white px-6">
			<div className="flex items-center gap-2 text-sm">
				<span className="text-text-tertiary">Dashboard</span>
				{pageTitle !== "Dashboard" && (
					<>
						<ChevronRight className="h-4 w-4 text-text-tertiary" />
						<span className="text-text-primary">{pageTitle}</span>
					</>
				)}
			</div>

			<div className="relative" ref={dropdownRef}>
				{connected && address ? (
					<button
						onClick={() => setDropdownOpen(!dropdownOpen)}
						className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary hover:border-primary/50 transition-colors shadow-sm"
					>
						<StatusDot variant="online" />
						{shortenAddress(address)}
					</button>
				) : (
					<button
						onClick={() => setVisible(true)}
						className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light transition-colors"
					>
						Connect Wallet
					</button>
				)}

				{dropdownOpen && connected && address && (
					<div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-white p-4 shadow-elevated z-50">
						<div className="mb-3 space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-xs text-text-tertiary">Address</span>
								<CopyButton text={address} />
							</div>
							<p className="break-all text-sm text-text-primary font-mono">
								{address}
							</p>
						</div>
						<div className="mb-3 border-t border-border pt-3">
							<span className="text-xs text-text-tertiary">Cluster</span>
							<p className="text-sm text-text-primary">solana-{SOLANA_CLUSTER}</p>
						</div>
						<button
							onClick={() => {
								disconnect();
								setDropdownOpen(false);
							}}
							className="w-full rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger hover:bg-danger/20 transition-colors"
						>
							Disconnect
						</button>
					</div>
				)}
			</div>
		</header>
	);
}
