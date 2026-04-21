# Architecture Guide

Complete architecture documentation for the StellarFund decentralized crowdfunding application.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                      │
│  React 19 Components, State Management, UI/UX                │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                              │
│  Caching, Hooks, Error Handling, Business Logic              │
├─────────────────────────────────────────────────────────────┤
│              Blockchain Integration Layer                     │
│  Soroban SDK, Freighter Wallet, Transaction Builder         │
├─────────────────────────────────────────────────────────────┤
│                  Smart Contract Layer                         │
│  Rust/WASM, Campaign Logic, Fund Management                 │
├─────────────────────────────────────────────────────────────┤
│                    Stellar Network                            │
│  Testnet: Horizon API, Soroban RPC                          │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
stellar-connect-wallet/
├── src/
│   ├── components/              # React components
│   │   ├── LoadingSpinner.js    # Loading/progress UI
│   │   ├── LoadingSpinner.css
│   │   ├── Soroban.js           # Blockchain integration
│   │   ├── Soroban.test.js
│   │   ├── CreateCampaign.js
│   │   ├── CampaignCard.js
│   │   ├── SendPayment.js
│   │   ├── TransactionTracker.js
│   │   ├── ActivityFeed.js
│   │   ├── Toast.js
│   │   ├── Header.js
│   │   └── Freighter.js
│   ├── services/                # Business logic
│   │   ├── cache.js             # Caching service
│   │   └── cache.test.js
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAsync.js          # Reusable hooks
│   │   └── useAsync.test.js
│   ├── App.js                   # Root component
│   ├── App.css
│   ├── index.js                 # Entry point
│   └── index.css
├── docs/                        # Documentation
│   ├── API.md                   # API reference
│   ├── TESTING.md               # Testing guide
│   ├── ARCHITECTURE.md          # This file
│   └── DEPLOYMENT.md            # Deployment guide
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── package.json
├── tailwind.config.js
└── README.md

crowdfund-contract/
├── src/
│   ├── lib.rs                   # Smart contract
│   └── tests.rs                 # Contract tests
├── Cargo.toml
├── target/                      # Build output
└── Makefile
```

---

## Data Flow

### 1. User Action → Component Update

```
User Action (click, input)
    ↓
React Event Handler
    ↓
useAsync Hook / Component State
    ↓
Service Call (Soroban.js)
    ↓
Component Re-render with Loading State
```

### 2. Blockchain Transaction Flow

```
User Initiates Transaction
    ↓
Status: BUILDING
- Build transaction with contract call
- Set account, fee, timeout
    ↓
Status: SIMULATING
- Simulate with Soroban RPC
- Get resource estimates
    ↓
Status: AWAITING_SIGNATURE
- Show user in Freighter wallet
- User signs transaction
    ↓
Status: SUBMITTING
- Submit signed transaction
    ↓
Status: PENDING
- Poll transaction status
- Check Horizon API
    ↓
Status: SUCCESS / FAILED
- Callback with result
- Update UI
```

### 3. Caching Layer

```
Data Request
    ↓
Check Cache
    ├─ Hit: Return cached data
    └─ Miss: Fetch from blockchain
        ↓
    Store in Cache with TTL
    ↓
    Return data
```

---

## Component Hierarchy

```
App
├── Header
│   ├── WalletConnector (Freighter)
│   └── BalanceDisplay
├── Hero Section
├── CreateCampaign
│   ├── FormInputs
│   └── SubmitButton (with LoadingSpinner)
├── CampaignGrid
│   └── CampaignCard (×N)
│       ├── ProgressBar
│       ├── DonateButton
│       └── CampaignDetails
├── TransactionTracker
│   └── StepIndicator
├── ActivityFeed
│   └── TransactionItem (×N)
├── SendPayment
│   └── PaymentForm
├── Toast (notifications)
└── StatusBadge
```

---

## State Management

### Local Component State

```javascript
// Simple UI state
const [isOpen, setIsOpen] = useState(false);

// Form state
const [formValues, setFormValues] = useState({ ... });

// Async operation state
const { data, loading, error } = useAsync(fetchFn);
```

### Persistent State (LocalStorage)

```javascript
// Cache frequently accessed data
const [campaigns, setCampaigns] = useLocalStorage('campaigns', []);
const [userPreferences, setUserPrefs] = useLocalStorage('prefs', {});
```

### Context State (if scaling needed)

```javascript
// Future: Global state via Context
const WalletContext = React.createContext();
const CampaignContext = React.createContext();
```

---

## Caching Strategy

### TTL (Time-to-Live) Tiers

```
Balance Data:           30 seconds
Campaign Details:       5 minutes
Campaign List:          2 minutes
Transaction Status:     10 seconds
Account Info:           1 minute
```

### Cache Invalidation

```javascript
// Manual invalidation
cache.remove(cacheKeys.balance(address));

// Auto-invalidation via TTL
cache.set(key, value, 30 * 1000); // Auto-expires after 30s

// Clear all on significant actions
cache.clear(); // After wallet disconnect
```

---

## Error Handling Strategy

### Error Hierarchy

```
Error
├── WalletNotFoundError
│   └── Handle: Show "Install Freighter" message
├── TransactionRejectedError
│   └── Handle: Show "You rejected the transaction"
├── InsufficientBalanceError
│   └── Handle: Show "Not enough XLM"
├── ContractError
│   └── Handle: Show "Contract execution failed"
└── GenericError
    └── Handle: Show error message, offer retry
```

### Error Handling Pattern

```javascript
try {
  const result = await invokeContract(fn, args, onStatusChange);
  // Success handling
} catch (error) {
  if (error instanceof WalletNotFoundError) {
    // Handle wallet error
  } else if (error instanceof InsufficientBalanceError) {
    // Handle balance error
  } else {
    // Generic error handling
  }
}
```

---

## Performance Optimization

### 1. Caching

- Cache balance data (reduces RPC calls)
- Cache campaign list (reduces contract reads)
- Automatic TTL expiration

### 2. Debouncing

```javascript
// Debounce search inputs
const debouncedSearch = useDebounce(searchInput, 500);
```

### 3. Lazy Loading

```javascript
// Load campaigns on demand
const [campaigns, setCampaigns] = useState([]);
const loadMore = useCallback(async () => {
  const next = await fetchCampaigns(offset);
  setCampaigns([...campaigns, ...next]);
}, [campaigns, offset]);
```

### 4. Code Splitting

```javascript
// Future: Split large components
const CreateCampaign = React.lazy(() => import('./CreateCampaign'));
```

### 5. Memoization

```javascript
const MemoizedCard = React.memo(CampaignCard);
const memoizedCallback = useCallback(fn, [deps]);
```

---

## Security Considerations

### 1. Wallet Security

- ✅ Never request private keys
- ✅ Use Freighter for signing
- ✅ Validate signatures server-side (if backend exists)

### 2. Smart Contract Security

- ✅ Validate input parameters
- ✅ Check campaign deadlines
- ✅ Prevent integer overflow (Rust prevents this)
- ✅ Reentrancy protection

### 3. Frontend Security

- ✅ Sanitize user input
- ✅ Validate blockchain responses
- ✅ HTTPS only
- ✅ Content Security Policy headers

### 4. Data Validation

```javascript
// Validate before contract call
function validateDonation(campaignId, amount) {
  if (!campaignId || campaignId <= 0) throw new Error('Invalid campaign');
  if (!amount || amount <= 0) throw new Error('Invalid amount');
  if (amount > MAX_DONATION) throw new Error('Amount too high');
}
```

---

## Scalability Considerations

### If Scaling Up

1. **Backend API**
   - Replace direct contract calls with REST/GraphQL
   - Implement indexing layer
   - Add transaction queue

2. **Database**
   - Cache contract data in PostgreSQL
   - Implement read replicas
   - Index frequently queried fields

3. **State Management**
   - Migrate to Redux/Zustand
   - Implement selectors
   - Cache normalized state

4. **Monitoring**
   - Add error tracking (Sentry)
   - Performance monitoring (Datadog)
   - Analytics (Google Analytics)

---

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Check code style
npm run lint
```

### Contract Development

```bash
cd crowdfund-contract

# Build contract
cargo build --target wasm32-unknown-unknown --release

# Run tests
cargo test

# Deploy to testnet
stellar contract deploy --wasm target/wasm32-unknown-unknown/release/crowdfund_contract.wasm --network testnet
```

---

## Testing Architecture

### Unit Tests
- Service functions (cache, hooks)
- Business logic
- Utility functions

### Component Tests
- UI rendering
- User interactions
- Props handling

### Integration Tests
- Wallet connection flow
- Transaction flow
- Error scenarios

### Contract Tests
- Campaign creation
- Donations
- Data retrieval
- Error cases

---

## Deployment Architecture

### Frontend Deployment

```
GitHub Repository
    ↓
GitHub Actions CI/CD
    ↓
Build & Test
    ↓
Deploy to Vercel/Netlify
    ↓
Serve at stellarfund.app
```

### Contract Deployment

```
Rust Code (Soroban)
    ↓
Compile to WASM
    ↓
Deploy to Stellar Testnet
    ↓
Contract ID: CDLZFC3S...
```

---

## Future Enhancements

1. **Mainnet Support**
   - Switch from Testnet to Production
   - Update network endpoints
   - Add mainnet deployment

2. **Advanced Features**
   - Milestone-based fund release
   - Dispute resolution
   - Refund management
   - Token rewards

3. **Mobile App**
   - React Native version
   - Mobile wallet integration
   - Push notifications

4. **Analytics**
   - Campaign performance tracking
   - User engagement metrics
   - Donation trends

---

## References

- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Learning Guide](https://developers.stellar.org/docs/learn/building-with-soroban)
- [React Documentation](https://react.dev/)
- [Jest Testing](https://jestjs.io/)
