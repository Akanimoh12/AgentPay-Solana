import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";

describe("agent_registry", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.AgentRegistry as Program;

  function randomAgentId(): number[] {
    const arr = new Uint8Array(32);
    for (let i = 0; i < 32; i++) arr[i] = Math.floor(Math.random() * 256);
    return Array.from(arr);
  }

  it("registers an agent", async () => {
    const agentId = randomAgentId();
    const owner = anchor.web3.Keypair.generate();

    const sig = await provider.connection.requestAirdrop(
      owner.publicKey,
      anchor.web3.LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");

    const [agentPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(agentId)],
      program.programId,
    );
    const [walletPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("wallet"), owner.publicKey.toBuffer()],
      program.programId,
    );

    await program.methods
      .registerAgent(agentId, "Test Agent", ["llm", "embeddings"])
      .accounts({
        agent: agentPda,
        walletPointer: walletPda,
        owner: owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    const account = await program.account.agentProfile.fetch(agentPda);
    expect(account.name).to.equal("Test Agent");
    expect(account.active).to.equal(true);
    expect(account.services).to.have.length(2);
  });
});
