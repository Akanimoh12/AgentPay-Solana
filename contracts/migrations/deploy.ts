// Anchor migration script. Runs after `anchor deploy`.
// Initializes the payment_router config account on testnet.

import * as anchor from "@coral-xyz/anchor";

module.exports = async function (provider: anchor.AnchorProvider) {
  anchor.setProvider(provider);

  const router = anchor.workspace.PaymentRouter as anchor.Program;
  const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    router.programId,
  );

  try {
    await router.account.routerConfig.fetch(configPda);
    console.log("PaymentRouter config already initialized:", configPda.toBase58());
  } catch {
    const tx = await router.methods
      .initialize(50)
      .accounts({
        config: configPda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("PaymentRouter initialized in tx:", tx);
  }
};
