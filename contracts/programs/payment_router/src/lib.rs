use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};

declare_id!("PaymentRoutr1111111111111111111111111111111");

const MAX_FEE_BPS: u16 = 500;
const BPS_DENOMINATOR: u128 = 10_000;

#[program]
pub mod payment_router {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, protocol_fee_bps: u16) -> Result<()> {
        require!(protocol_fee_bps <= MAX_FEE_BPS, PaymentError::FeeTooHigh);
        let cfg = &mut ctx.accounts.config;
        cfg.authority = ctx.accounts.authority.key();
        cfg.fee_receiver = ctx.accounts.authority.key();
        cfg.protocol_fee_bps = protocol_fee_bps;
        cfg.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn set_protocol_fee(ctx: Context<UpdateConfig>, fee_bps: u16) -> Result<()> {
        require!(fee_bps <= MAX_FEE_BPS, PaymentError::FeeTooHigh);
        ctx.accounts.config.protocol_fee_bps = fee_bps;
        Ok(())
    }

    pub fn set_fee_receiver(ctx: Context<UpdateConfig>, receiver: Pubkey) -> Result<()> {
        ctx.accounts.config.fee_receiver = receiver;
        Ok(())
    }

    pub fn pay_direct(
        ctx: Context<PayDirect>,
        sender_agent_id: [u8; 32],
        recipient_agent_id: [u8; 32],
        amount: u64,
    ) -> Result<()> {
        let cfg = &ctx.accounts.config;
        let fee = ((amount as u128) * cfg.protocol_fee_bps as u128 / BPS_DENOMINATOR) as u64;
        let payout = amount.checked_sub(fee).ok_or(PaymentError::MathOverflow)?;

        // payer -> recipient
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.recipient.to_account_info(),
                },
            ),
            payout,
        )?;

        // payer -> fee receiver
        if fee > 0 {
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.payer.to_account_info(),
                        to: ctx.accounts.fee_receiver.to_account_info(),
                    },
                ),
                fee,
            )?;
        }

        emit!(DirectPayment {
            from: sender_agent_id,
            to: recipient_agent_id,
            amount,
            fee,
        });
        Ok(())
    }

    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        escrow_id: [u8; 32],
        payer_agent_id: [u8; 32],
        payee_agent_id: [u8; 32],
        amount: u64,
        job_id: [u8; 32],
        deadline: i64,
    ) -> Result<()> {
        // Fund the escrow vault (PDA owned by system program; lamports held there).
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.escrow_vault.to_account_info(),
                },
            ),
            amount,
        )?;

        let escrow = &mut ctx.accounts.escrow;
        escrow.escrow_id = escrow_id;
        escrow.payer = ctx.accounts.payer.key();
        escrow.payee = ctx.accounts.payee.key();
        escrow.payer_agent_id = payer_agent_id;
        escrow.payee_agent_id = payee_agent_id;
        escrow.amount = amount;
        escrow.job_id = job_id;
        escrow.deadline = deadline;
        escrow.released = false;
        escrow.cancelled = false;
        escrow.created_at = Clock::get()?.unix_timestamp;
        escrow.bump = ctx.bumps.escrow;
        escrow.vault_bump = ctx.bumps.escrow_vault;

        emit!(EscrowCreated {
            escrow_id,
            payer_agent_id,
            payee_agent_id,
            amount,
        });
        Ok(())
    }

    pub fn release_escrow(ctx: Context<SettleEscrow>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        let escrow = &mut ctx.accounts.escrow;
        require!(!escrow.released && !escrow.cancelled, PaymentError::AlreadySettled);
        require!(escrow.payer == ctx.accounts.payer.key(), PaymentError::Unauthorized);

        let fee = ((escrow.amount as u128) * cfg.protocol_fee_bps as u128 / BPS_DENOMINATOR) as u64;
        let payout = escrow.amount.checked_sub(fee).ok_or(PaymentError::MathOverflow)?;

        let escrow_id = escrow.escrow_id;
        let vault_bump = escrow.vault_bump;
        let seeds: &[&[u8]] = &[b"escrow_vault", escrow_id.as_ref(), &[vault_bump]];
        let signer_seeds: &[&[&[u8]]] = &[seeds];

        // vault -> payee
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_vault.to_account_info(),
                    to: ctx.accounts.payee.to_account_info(),
                },
                signer_seeds,
            ),
            payout,
        )?;

        // vault -> fee receiver
        if fee > 0 {
            system_program::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_vault.to_account_info(),
                        to: ctx.accounts.fee_receiver.to_account_info(),
                    },
                    signer_seeds,
                ),
                fee,
            )?;
        }

        escrow.released = true;
        emit!(EscrowReleased {
            escrow_id: escrow.escrow_id,
            amount: payout,
            fee,
        });
        Ok(())
    }

    pub fn cancel_escrow(ctx: Context<SettleEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(!escrow.released && !escrow.cancelled, PaymentError::AlreadySettled);
        require!(escrow.payer == ctx.accounts.payer.key(), PaymentError::Unauthorized);
        require!(
            Clock::get()?.unix_timestamp >= escrow.deadline,
            PaymentError::DeadlineNotReached
        );

        let escrow_id = escrow.escrow_id;
        let vault_bump = escrow.vault_bump;
        let seeds: &[&[u8]] = &[b"escrow_vault", escrow_id.as_ref(), &[vault_bump]];
        let signer_seeds: &[&[&[u8]]] = &[seeds];

        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_vault.to_account_info(),
                    to: ctx.accounts.payer.to_account_info(),
                },
                signer_seeds,
            ),
            escrow.amount,
        )?;

        escrow.cancelled = true;
        emit!(EscrowCancelled { escrow_id: escrow.escrow_id });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = RouterConfig::SPACE,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, RouterConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority @ PaymentError::Unauthorized,
    )]
    pub config: Account<'info, RouterConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct PayDirect<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, RouterConfig>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: SOL recipient
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,

    /// CHECK: must equal config.fee_receiver
    #[account(mut, address = config.fee_receiver)]
    pub fee_receiver: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(escrow_id: [u8; 32])]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        payer = payer,
        space = Escrow::SPACE,
        seeds = [b"escrow", escrow_id.as_ref()],
        bump,
    )]
    pub escrow: Account<'info, Escrow>,

    /// CHECK: PDA holding lamports for the escrow
    #[account(
        mut,
        seeds = [b"escrow_vault", escrow_id.as_ref()],
        bump,
    )]
    pub escrow_vault: SystemAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: payee wallet pubkey recorded in escrow
    pub payee: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettleEscrow<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, RouterConfig>,

    #[account(
        mut,
        seeds = [b"escrow", escrow.escrow_id.as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,

    /// CHECK: PDA holding lamports
    #[account(
        mut,
        seeds = [b"escrow_vault", escrow.escrow_id.as_ref()],
        bump = escrow.vault_bump,
    )]
    pub escrow_vault: SystemAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: must equal escrow.payee
    #[account(mut, address = escrow.payee)]
    pub payee: UncheckedAccount<'info>,

    /// CHECK: must equal config.fee_receiver
    #[account(mut, address = config.fee_receiver)]
    pub fee_receiver: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct RouterConfig {
    pub authority: Pubkey,
    pub fee_receiver: Pubkey,
    pub protocol_fee_bps: u16,
    pub bump: u8,
}

impl RouterConfig {
    pub const SPACE: usize = 8 + 32 + 32 + 2 + 1;
}

#[account]
pub struct Escrow {
    pub escrow_id: [u8; 32],
    pub payer: Pubkey,
    pub payee: Pubkey,
    pub payer_agent_id: [u8; 32],
    pub payee_agent_id: [u8; 32],
    pub amount: u64,
    pub job_id: [u8; 32],
    pub deadline: i64,
    pub released: bool,
    pub cancelled: bool,
    pub created_at: i64,
    pub bump: u8,
    pub vault_bump: u8,
}

impl Escrow {
    pub const SPACE: usize = 8        // discriminator
        + 32                          // escrow_id
        + 32 + 32                     // payer, payee
        + 32 + 32                     // payer_agent_id, payee_agent_id
        + 8                           // amount
        + 32                          // job_id
        + 8                           // deadline
        + 1 + 1                       // released, cancelled
        + 8                           // created_at
        + 1 + 1;                      // bumps
}

#[event]
pub struct DirectPayment {
    pub from: [u8; 32],
    pub to: [u8; 32],
    pub amount: u64,
    pub fee: u64,
}

#[event]
pub struct EscrowCreated {
    pub escrow_id: [u8; 32],
    pub payer_agent_id: [u8; 32],
    pub payee_agent_id: [u8; 32],
    pub amount: u64,
}

#[event]
pub struct EscrowReleased {
    pub escrow_id: [u8; 32],
    pub amount: u64,
    pub fee: u64,
}

#[event]
pub struct EscrowCancelled {
    pub escrow_id: [u8; 32],
}

#[error_code]
pub enum PaymentError {
    #[msg("Fee exceeds maximum allowed")]
    FeeTooHigh,
    #[msg("Caller is not authorized")]
    Unauthorized,
    #[msg("Escrow already settled")]
    AlreadySettled,
    #[msg("Deadline not reached")]
    DeadlineNotReached,
    #[msg("Math overflow")]
    MathOverflow,
}
