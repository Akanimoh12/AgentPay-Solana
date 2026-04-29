use anchor_lang::prelude::*;

declare_id!("AgentRegist1111111111111111111111111111111");

const MAX_NAME_LEN: usize = 64;
const MAX_SERVICE_LEN: usize = 32;
const MAX_SERVICES: usize = 16;

#[program]
pub mod agent_registry {
    use super::*;

    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        agent_id: [u8; 32],
        name: String,
        services: Vec<String>,
    ) -> Result<()> {
        require!(name.as_bytes().len() <= MAX_NAME_LEN, RegistryError::NameTooLong);
        require!(services.len() <= MAX_SERVICES, RegistryError::TooManyServices);
        for s in services.iter() {
            require!(s.as_bytes().len() <= MAX_SERVICE_LEN, RegistryError::ServiceTooLong);
        }

        let agent = &mut ctx.accounts.agent;
        agent.wallet = ctx.accounts.owner.key();
        agent.agent_id = agent_id;
        agent.name = name.clone();
        agent.services = services;
        agent.active = true;
        agent.registered_at = Clock::get()?.unix_timestamp;
        agent.bump = ctx.bumps.agent;

        let pointer = &mut ctx.accounts.wallet_pointer;
        pointer.agent_id = agent_id;
        pointer.bump = ctx.bumps.wallet_pointer;

        emit!(AgentRegistered {
            agent_id,
            wallet: agent.wallet,
            name,
        });
        Ok(())
    }

    pub fn update_services(ctx: Context<UpdateAgent>, services: Vec<String>) -> Result<()> {
        require!(services.len() <= MAX_SERVICES, RegistryError::TooManyServices);
        for s in services.iter() {
            require!(s.as_bytes().len() <= MAX_SERVICE_LEN, RegistryError::ServiceTooLong);
        }
        let agent = &mut ctx.accounts.agent;
        agent.services = services;
        emit!(ServicesUpdated { agent_id: agent.agent_id });
        Ok(())
    }

    pub fn deactivate_agent(ctx: Context<UpdateAgent>) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        agent.active = false;
        emit!(AgentDeactivated { agent_id: agent.agent_id });
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(agent_id: [u8; 32])]
pub struct RegisterAgent<'info> {
    #[account(
        init,
        payer = owner,
        space = AgentProfile::SPACE,
        seeds = [b"agent", agent_id.as_ref()],
        bump,
    )]
    pub agent: Account<'info, AgentProfile>,

    #[account(
        init,
        payer = owner,
        space = WalletPointer::SPACE,
        seeds = [b"wallet", owner.key().as_ref()],
        bump,
    )]
    pub wallet_pointer: Account<'info, WalletPointer>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAgent<'info> {
    #[account(
        mut,
        seeds = [b"agent", agent.agent_id.as_ref()],
        bump = agent.bump,
        has_one = wallet @ RegistryError::Unauthorized,
    )]
    pub agent: Account<'info, AgentProfile>,

    /// CHECK: validated via has_one on agent
    pub wallet: Signer<'info>,
}

#[account]
pub struct AgentProfile {
    pub wallet: Pubkey,
    pub agent_id: [u8; 32],
    pub name: String,
    pub services: Vec<String>,
    pub active: bool,
    pub registered_at: i64,
    pub bump: u8,
}

impl AgentProfile {
    pub const SPACE: usize = 8                     // discriminator
        + 32                                       // wallet
        + 32                                       // agent_id
        + 4 + MAX_NAME_LEN                         // name
        + 4 + (MAX_SERVICES * (4 + MAX_SERVICE_LEN)) // services
        + 1                                        // active
        + 8                                        // registered_at
        + 1;                                       // bump
}

#[account]
pub struct WalletPointer {
    pub agent_id: [u8; 32],
    pub bump: u8,
}

impl WalletPointer {
    pub const SPACE: usize = 8 + 32 + 1;
}

#[event]
pub struct AgentRegistered {
    pub agent_id: [u8; 32],
    pub wallet: Pubkey,
    pub name: String,
}

#[event]
pub struct ServicesUpdated {
    pub agent_id: [u8; 32],
}

#[event]
pub struct AgentDeactivated {
    pub agent_id: [u8; 32],
}

#[error_code]
pub enum RegistryError {
    #[msg("Caller is not the agent owner")]
    Unauthorized,
    #[msg("Name exceeds maximum length")]
    NameTooLong,
    #[msg("Service string exceeds maximum length")]
    ServiceTooLong,
    #[msg("Too many services")]
    TooManyServices,
}
