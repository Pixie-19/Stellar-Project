# API Documentation

## Overview

This document provides comprehensive API documentation for the StellarFund decentralized crowdfunding application. It covers both the frontend services and smart contract interactions.

---

## Table of Contents

1. [Frontend Services](#frontend-services)
2. [Smart Contract Functions](#smart-contract-functions)
3. [React Components](#react-components)
4. [Custom Hooks](#custom-hooks)
5. [Caching System](#caching-system)
6. [Error Handling](#error-handling)

---

## Frontend Services

### Soroban Integration (`src/components/Soroban.js`)

#### Wallet Functions

##### `checkFreighterConnection()`
Validates that the Freighter wallet extension is installed and accessible.

```javascript
try {
  const connected = await checkFreighterConnection();
  console.log('Wallet connected:', connected);
} catch (error) {
  if (error instanceof WalletNotFoundError) {
    console.log('Freighter not installed');
  }
}
```

**Returns:** `Promise<boolean>`
**Throws:** `WalletNotFoundError`

---

##### `retrievePublicKey()`
Retrieves the public key of the connected wallet address.

```javascript
const publicKey = await retrievePublicKey();
console.log('Connected address:', publicKey);
```

**Returns:** `Promise<string>` - Stellar public address
**Throws:** `WalletNotFoundError`

---

##### `getBalance(publicKey?)`
Fetches the XLM balance for a wallet address.

```javascript
const balance = await getBalance('GADDRESS123...');
console.log('Balance:', balance, 'XLM');
```

**Parameters:**
- `publicKey` (string, optional) - Wallet address. If omitted, uses connected wallet.

**Returns:** `Promise<string>` - Balance as string with decimal places
**Throws:** `WalletNotFoundError`

---

#### Transaction Functions

##### `invokeContract(functionName, args?, onStatusChange?, requiresAuth?)`
Executes a smart contract function with full transaction lifecycle management.

```javascript
const onStatusChange = (status, message) => {
  console.log(`${status}: ${message}`);
};

try {
  const result = await invokeContract(
    'donate',
    [campaignId, donationAmount],
    onStatusChange,
    true
  );
  console.log('Transaction successful:', result);
} catch (error) {
  if (error instanceof TransactionRejectedError) {
    console.log('User rejected the transaction');
  }
}
```

**Parameters:**
- `functionName` (string) - Name of contract function to call
- `args` (Array, optional) - Arguments to pass to contract function
- `onStatusChange` (Function, optional) - Callback for status updates
- `requiresAuth` (boolean, optional) - Whether transaction requires signature (default: true)

**Returns:** `Promise<object>` - `{ result, hash, status }`
**Throws:** `ContractError`, `TransactionRejectedError`, `InsufficientBalanceError`

**Status Progression:**
- `BUILDING` → `SIMULATING` → `AWAITING_SIGNATURE` → `SUBMITTING` → `PENDING` → `SUCCESS`

---

#### Error Classes

All errors extend JavaScript's `Error` class and include a `code` property:

##### `WalletNotFoundError`
Thrown when Freighter is not installed or inaccessible.

```javascript
// Error properties
error.name     // 'WalletNotFoundError'
error.code     // 'WALLET_NOT_FOUND'
error.message  // Custom message or default
```

##### `TransactionRejectedError`
Thrown when user rejects transaction in wallet.

```javascript
error.code // 'TX_REJECTED'
```

##### `InsufficientBalanceError`
Thrown when account lacks sufficient XLM for transaction.

```javascript
error.code // 'INSUFFICIENT_BALANCE'
```

##### `ContractError`
Thrown when smart contract execution fails.

```javascript
error.code // 'CONTRACT_ERROR'
```

---

## Smart Contract Functions

### Campaign Management

#### `create_campaign(creator, title, target, deadline) -> u64`
Creates a new crowdfunding campaign.

**Parameters:**
- `creator` (Address) - Campaign creator's address
- `title` (String) - Campaign title (max 200 chars)
- `target` (u128) - Funding goal in stroops
- `deadline` (u64) - Unix timestamp for campaign end

**Returns:** Campaign ID (u64)

**Example:**
```javascript
const campaignId = await invokeContract('create_campaign', [
  userAddress,
  'Build a Community Library',
  5000_0000000n, // 5000 XLM
  Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 // 30 days
]);
```

---

#### `donate(campaign_id, donor, amount) -> bool`
Contributes funds to a campaign.

**Parameters:**
- `campaign_id` (u64) - Target campaign ID
- `donor` (Address) - Donor's address
- `amount` (u128) - Donation amount in stroops

**Returns:** Success flag

**Example:**
```javascript
await invokeContract('donate', [
  campaignId,
  userAddress,
  100_0000000n // 100 XLM
]);
```

---

#### `get_campaign(campaign_id) -> Campaign`
Retrieves campaign details.

**Parameters:**
- `campaign_id` (u64) - Campaign ID

**Returns:** Campaign struct with fields:
- `id` (u64)
- `creator` (Address)
- `title` (String)
- `target` (u128)
- `raised` (u128)
- `deadline` (u64)
- `donor_count` (u32)
- `is_active` (bool)

---

#### `get_all_campaigns() -> Vec<Campaign>`
Retrieves all campaigns.

**Returns:** Vector of Campaign structs

---

---

## React Components

### Loading & Progress Components (`src/components/LoadingSpinner.js`)

#### `<LoadingSpinner />`
Displays animated loading indicator.

```jsx
import { LoadingSpinner } from './components/LoadingSpinner';

<LoadingSpinner 
  size="md"
  variant="default"
  message="Fetching campaigns..."
  color="#8b5cf6"
/>
```

**Props:**
- `size` (string) - 'sm' | 'md' | 'lg' (default: 'md')
- `variant` (string) - 'default' | 'pulse' | 'orbit' (default: 'default')
- `message` (string) - Optional loading message
- `color` (string) - CSS color value (default: 'inherit')

---

#### `<ProgressBar />`
Shows progress with percentage indicator.

```jsx
<ProgressBar 
  percentage={75}
  label="Funding Progress"
  showPercentage={true}
  color="#3b82f6"
/>
```

**Props:**
- `percentage` (number) - Progress 0-100 (auto-clamped)
- `label` (string) - Optional label text
- `showPercentage` (boolean) - Show % text (default: true)
- `color` (string) - CSS color value

---

#### `<StatusBadge />`
Displays transaction/operation status with icon.

```jsx
<StatusBadge 
  status="pending"
  message="Waiting for confirmation..."
/>
```

**Props:**
- `status` (string) - 'idle' | 'building' | 'simulating' | 'awaiting_signature' | 'submitting' | 'pending' | 'success' | 'failed' | 'rejected'
- `message` (string) - Optional status message

---

#### `<StepIndicator />`
Shows multi-step progress.

```jsx
const steps = [
  { label: 'Connect Wallet', description: 'Link your Freighter wallet' },
  { label: 'Review Campaign', description: 'Check campaign details' },
  { label: 'Confirm Donation', description: 'Sign the transaction' }
];

<StepIndicator steps={steps} currentStep={1} />
```

**Props:**
- `steps` (Array) - Step objects with `label`, `description`, optional `status`
- `currentStep` (number) - Active step index (default: 0)

---

#### `<SkeletonLoader />`
Placeholder loading state.

```jsx
<SkeletonLoader count={3} type="card" />
```

**Props:**
- `count` (number) - Number of skeletons (default: 1)
- `type` (string) - 'line' | 'card' | 'circle' (default: 'line')

---

## Custom Hooks

### `useAsync(asyncFn, dependencies?)`
Manages async operations with loading/error states.

```javascript
const { data, loading, error, execute, reset } = useAsync(
  async () => {
    const campaigns = await invokeContract('get_all_campaigns');
    return campaigns;
  },
  [] // Run once on mount
);

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <CampaignList campaigns={data} />;
```

**Returns:**
- `data` - Operation result
- `loading` - Boolean loading state
- `error` - Error object or null
- `execute(...args)` - Function to trigger async operation
- `reset()` - Clear state

---

### `useBalance(address, fetchFn, interval?)`
Fetches and caches wallet balance with optional polling.

```javascript
const { balance, loading, error, refresh } = useBalance(
  userAddress,
  getBalance,
  5000 // Poll every 5 seconds
);

return (
  <div>
    <p>Balance: {balance} XLM</p>
    <button onClick={refresh}>Refresh</button>
  </div>
);
```

**Returns:**
- `balance` - Current balance string
- `loading` - Fetch in progress
- `error` - Fetch error
- `refresh()` - Force re-fetch

---

### `useDebounce(value, delay?)`
Debounces a value.

```javascript
const debouncedSearch = useDebounce(searchInput, 500);

useEffect(() => {
  // Search only after 500ms of inactivity
  performSearch(debouncedSearch);
}, [debouncedSearch]);
```

---

### `useForm(initialValues, validate)`
Manages form state and validation.

```javascript
const { values, errors, handleChange, handleSubmit } = useForm(
  { title: '', target: '' },
  (values) => {
    const errors = {};
    if (!values.title) errors.title = 'Title required';
    if (values.target <= 0) errors.target = 'Target must be > 0';
    return errors;
  }
);

const onSubmit = async (formValues) => {
  await createCampaign(formValues);
};

return (
  <form onSubmit={handleSubmit(onSubmit)}>
    <input
      name="title"
      value={values.title}
      onChange={handleChange}
    />
    {errors.title && <span>{errors.title}</span>}
  </form>
);
```

---

### `useLocalStorage(key, initialValue)`
Persists state to browser localStorage.

```javascript
const [campaigns, setCampaigns] = useLocalStorage('campaigns', []);

const addCampaign = (campaign) => {
  setCampaigns([...campaigns, campaign]);
};
```

---

## Caching System

### Cache Service (`src/services/cache.js`)

#### Basic Usage

```javascript
import { cache, cacheKeys } from './services/cache';

// Set a value (5 minute default TTL)
cache.set('my-key', { data: 'value' });

// Set with custom TTL (30 seconds)
cache.set('balance', '1000', 30 * 1000);

// Get a value
const value = cache.get('my-key');

// Check existence
if (cache.has('my-key')) {
  // Use cached data
}

// Remove specific key
cache.remove('my-key');

// Clear all cache
cache.clear();

// Get all valid keys
const keys = cache.keys(); // ['key1', 'key2']

// Get stats
const stats = cache.stats(); // { size: 2, keys: 2 }
```

---

#### Cache Key Generators

```javascript
// Account data
cacheKeys.balance(address)        // 'balance:GADDRESS...'
cacheKeys.accountInfo(address)    // 'account:GADDRESS...'

// Campaign data
cacheKeys.campaign(id)            // 'campaign:123'
cacheKeys.campaigns()             // 'campaigns:all'
cacheKeys.campaignsList()         // 'campaigns:list'

// Transaction data
cacheKeys.transaction(hash)       // 'tx:abc123...'
cacheKeys.userTransactions(addr)  // 'txs:GADDRESS...'

// Wallet data
cacheKeys.walletConnected()       // 'wallet:connected'
cacheKeys.walletAddress()         // 'wallet:address'
```

---

### Integration with useBalance Hook

```javascript
// Automatically caches for 30 seconds
const { balance, refresh } = useBalance(
  address,
  getBalance,
  5000 // Poll every 5 seconds
);

// Cache is checked before fetching from network
// Reduces API calls significantly
```

---

## Error Handling

### Global Error Handler Pattern

```javascript
const handleTransaction = async () => {
  try {
    const result = await invokeContract('donate', [campaignId, amount], 
      (status) => setTxStatus(status)
    );
    showToast('Donation successful!', 'success');
  } catch (error) {
    if (error instanceof TransactionRejectedError) {
      showToast('You rejected the transaction', 'warning');
    } else if (error instanceof InsufficientBalanceError) {
      showToast('Not enough XLM balance', 'error');
    } else if (error instanceof WalletNotFoundError) {
      showToast('Connect your wallet first', 'error');
    } else {
      showToast(error.message, 'error');
    }
  }
};
```

---

## Rate Limiting & Best Practices

### Balance Polling
```javascript
// ✅ Good: 5-second polling with caching
useBalance(address, getBalance, 5000)

// ❌ Avoid: Too frequent polling
useBalance(address, getBalance, 500)
```

### Transaction Status
```javascript
// ✅ Use provided status callbacks
invokeContract(fn, args, (status, msg) => {
  console.log(`Status: ${status} - ${msg}`);
})

// ❌ Avoid: Manual polling of transaction status
while (true) {
  const status = await checkStatus(hash);
  if (status === 'SUCCESS') break;
}
```

---

## Versioning

- **API Version:** 1.0.0
- **Last Updated:** 2024
- **Stellar Network:** Testnet
- **Soroban SDK:** Latest stable

---

## Support

For issues or questions:
1. Check test files for usage examples
2. Review component documentation
3. Open issue on GitHub repository
