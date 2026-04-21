/**
 * Smart Contract Unit Tests for Crowdfund Soroban Contract
 * 
 * These tests demonstrate best practices for testing Soroban smart contracts
 * using the Soroban SDK and Rust testing framework.
 * 
 * Setup: cargo test (in the contract directory)
 */

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as AddressTestUtils;
    use soroban_sdk::testutils::Env as EnvTestUtils;
    use soroban_sdk::{Address, Env, String as SorobanString};

    /// Helper function to create a test environment
    fn setup_env() -> (Env, Address) {
        let env = Env::default();
        let admin = Address::random(&env);
        (env, admin)
    }

    /// Test: Campaign creation with valid data
    #[test]
    fn test_create_campaign_success() {
        let (env, admin) = setup_env();
        let contract_id = env.register_contract(None, Contract);
        let client = ContractClient::new(&env, &contract_id);

        let title = SorobanString::from_slice(&env, "Test Campaign");
        let target = 1000_0000000u128; // 1000 XLM
        let deadline = env.ledger().timestamp() + 30 * 24 * 60 * 60;

        let campaign_id = client.create_campaign(&admin, &title, &target, &deadline);
        assert_eq!(campaign_id, 1);
    }

    /// Test: Campaign ID auto-increment
    #[test]
    fn test_campaign_id_auto_increment() {
        let (env, admin) = setup_env();
        let contract_id = env.register_contract(None, Contract);
        let client = ContractClient::new(&env, &contract_id);

        let title = SorobanString::from_slice(&env, "Campaign");
        let target = 1000_0000000u128;
        let deadline = env.ledger().timestamp() + 30 * 24 * 60 * 60;

        let id1 = client.create_campaign(&admin, &title, &target, &deadline);
        let id2 = client.create_campaign(&admin, &title, &target, &deadline);
        let id3 = client.create_campaign(&admin, &title, &target, &deadline);

        assert_eq!(id1, 1);
        assert_eq!(id2, 2);
        assert_eq!(id3, 3);
    }

    /// Test: Retrieve campaign data
    #[test]
    fn test_fetch_campaign_data() {
        let (env, admin) = setup_env();
        let contract_id = env.register_contract(None, Contract);
        let client = ContractClient::new(&env, &contract_id);

        let title = SorobanString::from_slice(&env, "Test Campaign");
        let target = 1000_0000000u128;
        let deadline = env.ledger().timestamp() + 30 * 24 * 60 * 60;

        let campaign_id = client.create_campaign(&admin, &title, &target, &deadline);
        let campaign = client.get_campaign(&campaign_id);

        assert_eq!(campaign.title, title);
        assert_eq!(campaign.target, target);
        assert_eq!(campaign.creator, admin);
    }

    /// Test: Donation to campaign
    #[test]
    fn test_donate_to_campaign() {
        let (env, admin) = setup_env();
        let donor = Address::random(&env);
        let contract_id = env.register_contract(None, Contract);
        let client = ContractClient::new(&env, &contract_id);

        let title = SorobanString::from_slice(&env, "Campaign");
        let target = 1000_0000000u128;
        let deadline = env.ledger().timestamp() + 30 * 24 * 60 * 60;

        let campaign_id = client.create_campaign(&admin, &title, &target, &deadline);

        // Make a donation
        let donation_amount = 100_0000000u128; // 100 XLM
        client.donate(&campaign_id, &donor, &donation_amount);

        let campaign = client.get_campaign(&campaign_id);
        assert_eq!(campaign.raised, donation_amount);
    }

    /// Test: Multiple donations accumulate
    #[test]
    fn test_multiple_donations() {
        let (env, admin) = setup_env();
        let contract_id = env.register_contract(None, Contract);
        let client = ContractClient::new(&env, &contract_id);

        let title = SorobanString::from_slice(&env, "Campaign");
        let target = 1000_0000000u128;
        let deadline = env.ledger().timestamp() + 30 * 24 * 60 * 60;

        let campaign_id = client.create_campaign(&admin, &title, &target, &deadline);

        let donor1 = Address::random(&env);
        let donor2 = Address::random(&env);
        let amount1 = 100_0000000u128;
        let amount2 = 200_0000000u128;

        client.donate(&campaign_id, &donor1, &amount1);
        client.donate(&campaign_id, &donor2, &amount2);

        let campaign = client.get_campaign(&campaign_id);
        assert_eq!(campaign.raised, amount1 + amount2);
    }

    /// Test: Donation count
    #[test]
    fn test_donation_count() {
        let (env, admin) = setup_env();
        let contract_id = env.register_contract(None, Contract);
        let client = ContractClient::new(&env, &contract_id);

        let title = SorobanString::from_slice(&env, "Campaign");
        let target = 1000_0000000u128;
        let deadline = env.ledger().timestamp() + 30 * 24 * 60 * 60;

        let campaign_id = client.create_campaign(&admin, &title, &target, &deadline);

        for i in 0..5 {
            let donor = Address::random(&env);
            client.donate(&campaign_id, &donor, &50_0000000u128);
        }

        let campaign = client.get_campaign(&campaign_id);
        assert_eq!(campaign.donor_count, 5);
    }

    /// Test: Campaign deadline
    #[test]
    fn test_campaign_deadline_enforcement() {
        let (env, admin) = setup_env();
        let contract_id = env.register_contract(None, Contract);
        let client = ContractClient::new(&env, &contract_id);

        let title = SorobanString::from_slice(&env, "Campaign");
        let target = 1000_0000000u128;
        let deadline = env.ledger().timestamp() + 24 * 60 * 60; // 1 day

        let campaign_id = client.create_campaign(&admin, &title, &target, &deadline);

        // Fast-forward time beyond deadline
        env.ledger().set_timestamp(deadline + 1);

        let campaign = client.get_campaign(&campaign_id);
        assert!(!campaign.is_active);
    }

    /// Test: Campaign funding goal achievement
    #[test]
    fn test_funding_goal_achievement() {
        let (env, admin) = setup_env();
        let contract_id = env.register_contract(None, Contract);
        let client = ContractClient::new(&env, &contract_id);

        let title = SorobanString::from_slice(&env, "Campaign");
        let target = 1000_0000000u128;
        let deadline = env.ledger().timestamp() + 30 * 24 * 60 * 60;

        let campaign_id = client.create_campaign(&admin, &title, &target, &deadline);

        // Donate exactly the target amount
        let donor = Address::random(&env);
        client.donate(&campaign_id, &donor, &target);

        let campaign = client.get_campaign(&campaign_id);
        assert_eq!(campaign.raised, target);
        assert!(campaign.raised >= campaign.target);
    }

    /// Test: Retrieve all campaigns
    #[test]
    fn test_get_all_campaigns() {
        let (env, admin) = setup_env();
        let contract_id = env.register_contract(None, Contract);
        let client = ContractClient::new(&env, &contract_id);

        let title = SorobanString::from_slice(&env, "Campaign");
        let target = 1000_0000000u128;
        let deadline = env.ledger().timestamp() + 30 * 24 * 60 * 60;

        for _ in 0..3 {
            client.create_campaign(&admin, &title, &target, &deadline);
        }

        let campaigns = client.get_all_campaigns();
        assert_eq!(campaigns.len(), 3);
    }

    /// Test: Non-existent campaign error
    #[test]
    #[should_panic(expected = "Campaign not found")]
    fn test_fetch_nonexistent_campaign() {
        let (env, _) = setup_env();
        let contract_id = env.register_contract(None, Contract);
        let client = ContractClient::new(&env, &contract_id);

        client.get_campaign(&999);
    }

    /// Test: Campaign filtering by status
    #[test]
    fn test_get_active_campaigns() {
        let (env, admin) = setup_env();
        let contract_id = env.register_contract(None, Contract);
        let client = ContractClient::new(&env, &contract_id);

        let title = SorobanString::from_slice(&env, "Campaign");
        let target = 1000_0000000u128;

        // Create active campaign
        let deadline_active = env.ledger().timestamp() + 30 * 24 * 60 * 60;
        let id_active = client.create_campaign(&admin, &title, &target, &deadline_active);

        // Create expired campaign
        let deadline_expired = env.ledger().timestamp() + 1;
        let id_expired = client.create_campaign(&admin, &title, &target, &deadline_expired);
        env.ledger().set_timestamp(deadline_expired + 1);

        let active_campaigns = client.get_active_campaigns();
        assert_eq!(active_campaigns.len(), 1);

        let first_active = active_campaigns.get(0);
        assert_eq!(first_active.id, id_active);
    }

    /// Test: Campaign statistics
    #[test]
    fn test_campaign_statistics() {
        let (env, admin) = setup_env();
        let contract_id = env.register_contract(None, Contract);
        let client = ContractClient::new(&env, &contract_id);

        let title = SorobanString::from_slice(&env, "Campaign");
        let target = 1000_0000000u128;
        let deadline = env.ledger().timestamp() + 30 * 24 * 60 * 60;

        let campaign_id = client.create_campaign(&admin, &title, &target, &deadline);

        // Add donations from multiple donors
        let total_raised = 0u128;
        for i in 0..10 {
            let donor = Address::random(&env);
            let amount = (i as u128 + 1) * 100_0000000u128;
            client.donate(&campaign_id, &donor, &amount);
            total_raised = total_raised + amount;
        }

        let stats = client.get_campaign_statistics(&campaign_id);
        assert_eq!(stats.total_raised, total_raised);
        assert_eq!(stats.donor_count, 10);
        assert_eq!(stats.average_donation, total_raised / 10);
    }

    /// Test: Data persistence across calls
    #[test]
    fn test_data_persistence() {
        let (env, admin) = setup_env();
        let contract_id = env.register_contract(None, Contract);
        let client = ContractClient::new(&env, &contract_id);

        let title = SorobanString::from_slice(&env, "Persistent Campaign");
        let target = 5000_0000000u128;
        let deadline = env.ledger().timestamp() + 30 * 24 * 60 * 60;

        let campaign_id = client.create_campaign(&admin, &title, &target, &deadline);

        // Retrieve and verify multiple times
        let campaign1 = client.get_campaign(&campaign_id);
        let campaign2 = client.get_campaign(&campaign_id);

        assert_eq!(campaign1.id, campaign2.id);
        assert_eq!(campaign1.title, campaign2.title);
        assert_eq!(campaign1.creator, campaign2.creator);
    }
}
