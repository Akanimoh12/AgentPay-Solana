"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query";
import { SOLANA_RPC_URL } from "@/lib/solana";

import "@solana/wallet-adapter-react-ui/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
	const wallets = useMemo(
		() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
		[],
	);

	return (
		<ConnectionProvider endpoint={SOLANA_RPC_URL}>
			<WalletProvider wallets={wallets} autoConnect>
				<WalletModalProvider>
					<QueryClientProvider client={queryClient}>
						{children}
					</QueryClientProvider>
				</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
}
