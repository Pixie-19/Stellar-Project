#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, String, Vec,
    log,
};

#[contracttype]
#[derive(Clone)]
pub struct Campaign {
    pub creator: Address,
    pub title: String,
    pub description: String,
    pub target_amount: i128,
    pub raised_amount: i128,
    pub deadline: u64,
    pub is_active: bool,
    pub donor_count: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct Donation {
    pub donor: Address,
    pub amount: i128,
    pub timestamp: u64,
    pub campaign_id: u32,
}

#[contracttype]
pub enum DataKey {
    Campaign(u32),
    CampaignCount,
    Donations(u32),
    DonorAmount(u32, Address),
    TotalDonors(u32),
    EventLog,
}

#[contract]
pub struct CrowdfundContract;

#[contractimpl]
impl CrowdfundContract {
    /// Create a new crowdfunding campaign
    pub fn create_campaign(
        env: Env,
        creator: Address,
        title: String,
        description: String,
        target_amount: i128,
        deadline: u64,
    ) -> u32 {
        creator.require_auth();

        // Validate inputs
        if target_amount <= 0 {
            panic!("Target amount must be positive");
        }

        let count: u32 = env
            .storage()
            .persistent()
            .get(&DataKey::CampaignCount)
            .unwrap_or(0);

        let campaign_id = count + 1;

        let campaign = Campaign {
            creator: creator.clone(),
            title,
            description,
            target_amount,
            raised_amount: 0,
            deadline,
            is_active: true,
            donor_count: 0,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
        env.storage()
            .persistent()
            .set(&DataKey::CampaignCount, &campaign_id);

        // Emit event
        env.events()
            .publish((symbol_short!("create"),), campaign_id);

        log!(&env, "Campaign {} created by {}", campaign_id, creator);

        campaign_id
    }

    /// Donate to a campaign
    pub fn donate(
        env: Env,
        donor: Address,
        campaign_id: u32,
        amount: i128,
        token_address: Address,
    ) -> i128 {
        donor.require_auth();

        if amount <= 0 {
            panic!("Donation amount must be positive");
        }

        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign not found");

        if !campaign.is_active {
            panic!("Campaign is no longer active");
        }

        // Transfer tokens from donor to contract
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&donor, &env.current_contract_address(), &amount);

        // Update campaign
        campaign.raised_amount += amount;
        campaign.donor_count += 1;

        // Check if goal reached
        if campaign.raised_amount >= campaign.target_amount {
            campaign.is_active = false;
        }

        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);

        // Track donor contribution
        let donor_key = DataKey::DonorAmount(campaign_id, donor.clone());
        let prev_amount: i128 = env.storage().persistent().get(&donor_key).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&donor_key, &(prev_amount + amount));

        // Emit event
        env.events()
            .publish((symbol_short!("donate"),), (campaign_id, donor.clone(), amount));

        log!(
            &env,
            "Donation of {} to campaign {} by {}",
            amount,
            campaign_id,
            donor
        );

        campaign.raised_amount
    }

    /// Get campaign details
    pub fn get_campaign(env: Env, campaign_id: u32) -> Campaign {
        env.storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign not found")
    }

    /// Get total number of campaigns
    pub fn get_campaign_count(env: Env) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::CampaignCount)
            .unwrap_or(0)
    }

    /// Get multiple campaigns (pagination)
    pub fn get_campaigns(env: Env, offset: u32, limit: u32) -> Vec<Campaign> {
        let count = Self::get_campaign_count(env.clone());
        let mut campaigns = Vec::new(&env);
        
        let start = offset + 1;
        let end = core::cmp::min(start + limit, count + 1);
        
        for id in start..end {
            if let Some(campaign) = env.storage().persistent().get(&DataKey::Campaign(id)) {
                campaigns.push_back(campaign);
            }
        }
        
        campaigns
    }

    /// Get donor's contribution to a campaign
    pub fn get_donor_amount(env: Env, campaign_id: u32, donor: Address) -> i128 {
        let donor_key = DataKey::DonorAmount(campaign_id, donor);
        env.storage().persistent().get(&donor_key).unwrap_or(0)
    }

    /// Close a campaign (only creator)
    pub fn close_campaign(env: Env, creator: Address, campaign_id: u32) -> bool {
        creator.require_auth();

        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign not found");

        if campaign.creator != creator {
            panic!("Only the campaign creator can close it");
        }

        campaign.is_active = false;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);

        // Emit event
        env.events()
            .publish((symbol_short!("close"),), campaign_id);

        true
    }

    /// Withdraw funds (only creator, only when goal met or campaign closed)
    pub fn withdraw(env: Env, creator: Address, campaign_id: u32, token_address: Address) -> i128 {
        creator.require_auth();

        let campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign not found");

        if campaign.creator != creator {
            panic!("Only the campaign creator can withdraw");
        }

        if campaign.raised_amount == 0 {
            panic!("No funds to withdraw");
        }

        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(
            &env.current_contract_address(),
            &creator,
            &campaign.raised_amount,
        );

        // Emit event
        env.events()
            .publish((symbol_short!("withdraw"),), (campaign_id, campaign.raised_amount));

        campaign.raised_amount
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_create_campaign() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(CrowdfundContract, ());
        let client = CrowdfundContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let title = String::from_str(&env, "Test Campaign");
        let desc = String::from_str(&env, "A test crowdfunding campaign");

        let id = client.create_campaign(&creator, &title, &desc, &1000_i128, &1000000_u64);
        assert_eq!(id, 1);

        let campaign = client.get_campaign(&1);
        assert_eq!(campaign.target_amount, 1000);
        assert_eq!(campaign.raised_amount, 0);
        assert!(campaign.is_active);
    }

    #[test]
    fn test_campaign_count() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(CrowdfundContract, ());
        let client = CrowdfundContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let title = String::from_str(&env, "Campaign 1");
        let desc = String::from_str(&env, "First campaign");

        client.create_campaign(&creator, &title, &desc, &500_i128, &2000000_u64);
        client.create_campaign(&creator, &title, &desc, &1000_i128, &3000000_u64);

        assert_eq!(client.get_campaign_count(), 2);
    }
}
