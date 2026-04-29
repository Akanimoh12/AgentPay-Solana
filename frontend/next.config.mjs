import { fileURLToPath } from "url";
import { join, dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
	env: {
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
		NEXT_PUBLIC_SOLANA_CLUSTER: process.env.NEXT_PUBLIC_SOLANA_CLUSTER,
		NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
		NEXT_PUBLIC_AGENT_REGISTRY_PROGRAM_ID: process.env.NEXT_PUBLIC_AGENT_REGISTRY_PROGRAM_ID,
		NEXT_PUBLIC_PAYMENT_ROUTER_PROGRAM_ID: process.env.NEXT_PUBLIC_PAYMENT_ROUTER_PROGRAM_ID,
		NEXT_PUBLIC_SPLIT_VAULT_PROGRAM_ID: process.env.NEXT_PUBLIC_SPLIT_VAULT_PROGRAM_ID,
	},
	webpack: (config, { isServer }) => {
		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				path: false,
				crypto: false,
				os: false,
				stream: false,
				buffer: false,
			};
			// Stub pino-pretty — pulled in transitively by @walletconnect/logger
			// but not available in the browser bundle.
			config.resolve.alias = {
				...config.resolve.alias,
				"pino-pretty": join(__dirname, "stubs/pino-pretty.js"),
			};
		}
		return config;
	},
};

export default nextConfig;
