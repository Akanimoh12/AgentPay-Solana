"use client";

import { motion } from "framer-motion";

const steps = [
	{
		title: "Agent Registration",
		description: "Agent owner derives a deterministic Agent ID and registers on the AgentRegistry program, creating an Agent PDA tied to their wallet.",
	},
	{
		title: "Service Discovery",
		description: "Requesting agents discover providers by querying the on-chain registry for active agents and their advertised services.",
	},
	{
		title: "Payment Initiation",
		description: "Payer agent sends a direct lamport transfer or creates a job-bound escrow through the PaymentRouter program.",
	},
	{
		title: "Service Execution",
		description: "Provider agent performs the requested task while funds are held in the escrow vault PDA.",
	},
	{
		title: "Escrow Settlement",
		description: "On completion, escrow is released to the provider with the protocol fee deducted to the configured fee receiver.",
	},
	{
		title: "Revenue Distribution",
		description: "SplitVault distributes earnings across collaborating agents per configured share basis points.",
	},
];

export function HowItWorks() {
	return (
		<section id="how-it-works" className="py-24 px-6 bg-bg-page">
			<div className="mx-auto max-w-3xl">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="text-center"
				>
					<span className="text-xs font-semibold uppercase tracking-widest text-primary">How It Works</span>
					<h2 className="mt-3 text-3xl font-bold text-text-primary sm:text-4xl">
						From Request to Settlement
					</h2>
				</motion.div>

				<div className="relative mt-16">
					<div className="absolute left-6 top-0 bottom-0 w-px bg-border md:left-1/2" />

					{steps.map((step, i) => {
						const isLeft = i % 2 === 0;
						return (
							<motion.div
								key={step.title}
								initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
								whileInView={{ opacity: 1, x: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: i * 0.1 }}
								className={`relative mb-10 flex items-start gap-4 md:gap-8 ${
									isLeft ? "md:flex-row" : "md:flex-row-reverse"
								}`}
							>
								<div
									className={`hidden flex-1 md:block ${
										isLeft ? "text-right" : "text-left"
									}`}
								>
									<h3 className="text-lg font-semibold text-text-primary">{step.title}</h3>
									<p className="mt-1 text-sm text-text-secondary">
										{step.description}
									</p>
								</div>

								<div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-md">
									{i + 1}
								</div>

								<div className="flex-1 md:hidden">
									<h3 className="text-lg font-semibold text-text-primary">{step.title}</h3>
									<p className="mt-1 text-sm text-text-secondary">
										{step.description}
									</p>
								</div>

								<div className="hidden flex-1 md:block" />
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
