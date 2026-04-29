use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};

declare_id!("SplitVau1t11111111111111111111111111111111");

const MAX_RECIPIENTS: usize = 10;
const BPS_TOTAL: u16 = 10_000;

#[program]
pub mod split_vault {
    use super::*;

    pub fn configure_split(
        ctx: Context<ConfigureSplit>,
        split_id: [u8; 32],
        owner_agent_id: [u8; 32],
        recipients: Vec<SplitRecipient>,
    ) -> Result<()> {
        require!(
            !recipients.is_empty() && recipients.len() <= MAX_RECIPIENTS,
            SplitError::InvalidRecipientCount
        );
        let total: u32 = recipients.iter().map(|r| r.share_bps as u32).sum();
        require!(total as u16 == BPS_TOTAL, SplitError::SharesMustSumTo10000);

        let split = &mut ctx.accounts.split;
        split.split_id = split_id;
        split.owner = ctx.accounts.owner.key();
        split.owner_agent_id = owner_agent_id;
        split.recipients = recipients.clone();
        split.active = true;
        split.bump = ctx.bumps.split;

        emit!(SplitConfigured {
            split_id,
            owner_agent_id,
            recipient_count: recipients.len() as u8,
        });
        Ok(())
    }

    pub fn deactivate_split(ctx: Context<UpdateSplit>) -> Result<()> {
        let split = &mut ctx.accounts.split;
        split.active = false;
        emit!(SplitDeactivated { split_id: split.split_id });
        Ok(())
    }

    /// Distribute SOL to recipients. The caller passes recipient accounts as remaining_accounts
    /// in the same order as `split.recipients`.
    pub fn distribute<'info>(
        ctx: Context<'_, '_, '_, 'info, Distribute<'info>>,
        amount: u64,
    ) -> Result<()> {
        let split = &ctx.accounts.split;
        require!(split.active, SplitError::SplitNotActive);
        require!(
            ctx.remaining_accounts.len() == split.recipients.len(),
            SplitError::RecipientMismatch
        );

        for (i, recipient_meta) in split.recipients.iter().enumerate() {
            let recipient_ai = &ctx.remaining_accounts[i];
            require!(recipient_ai.key() == recipient_meta.wallet, SplitError::RecipientMismatch);

            let share = ((amount as u128) * recipient_meta.share_bps as u128
                / BPS_TOTAL as u128) as u64;
            if share == 0 {
                continue;
            }
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.payer.to_account_info(),
                        to: recipient_ai.clone(),
                    },
                ),
                share,
            )?;
        }

        emit!(SplitDistributed {
            split_id: split.split_id,
            total_amount: amount,
        });
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(split_id: [u8; 32])]
pub struct ConfigureSplit<'info> {
    #[account(
        init,
        payer = owner,
        space = SplitConfig::SPACE,
        seeds = [b"split", split_id.as_ref()],
        bump,
    )]
    pub split: Account<'info, SplitConfig>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateSplit<'info> {
    #[account(
        mut,
        seeds = [b"split", split.split_id.as_ref()],
        bump = split.bump,
        has_one = owner @ SplitError::Unauthorized,
    )]
    pub split: Account<'info, SplitConfig>,

    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct Distribute<'info> {
    #[account(
        seeds = [b"split", split.split_id.as_ref()],
        bump = split.bump,
    )]
    pub split: Account<'info, SplitConfig>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct SplitConfig {
    pub split_id: [u8; 32],
    pub owner: Pubkey,
    pub owner_agent_id: [u8; 32],
    pub recipients: Vec<SplitRecipient>,
    pub active: bool,
    pub bump: u8,
}

impl SplitConfig {
    pub const SPACE: usize = 8                    // discriminator
        + 32                                      // split_id
        + 32                                      // owner
        + 32                                      // owner_agent_id
        + 4 + (MAX_RECIPIENTS * SplitRecipient::SIZE) // recipients vec
        + 1                                       // active
        + 1;                                      // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct SplitRecipient {
    pub wallet: Pubkey,
    pub share_bps: u16,
}

impl SplitRecipient {
    pub const SIZE: usize = 32 + 2;
}

#[event]
pub struct SplitConfigured {
    pub split_id: [u8; 32],
    pub owner_agent_id: [u8; 32],
    pub recipient_count: u8,
}

#[event]
pub struct SplitDistributed {
    pub split_id: [u8; 32],
    pub total_amount: u64,
}

#[event]
pub struct SplitDeactivated {
    pub split_id: [u8; 32],
}

#[error_code]
pub enum SplitError {
    #[msg("Caller is not the split owner")]
    Unauthorized,
    #[msg("Recipient count must be between 1 and 10")]
    InvalidRecipientCount,
    #[msg("Recipient shares must sum to exactly 10000 bps")]
    SharesMustSumTo10000,
    #[msg("Split is not active")]
    SplitNotActive,
    #[msg("Provided recipient accounts do not match split config")]
    RecipientMismatch,
}
