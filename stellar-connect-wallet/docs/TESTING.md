# Testing Guide

Complete guide to testing the StellarFund application at all levels.

## Table of Contents

1. [Running Tests](#running-tests)
2. [Unit Tests](#unit-tests)
3. [Component Tests](#component-tests)
4. [Integration Tests](#integration-tests)
5. [Smart Contract Tests](#smart-contract-tests)
6. [Test Coverage](#test-coverage)
7. [Debugging Tests](#debugging-tests)

---

## Running Tests

### Frontend Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- cache.test.js

# Run tests matching pattern
npm test -- --testNamePattern="useAsync"
```

### Smart Contract Tests

```bash
cd crowdfund-contract

# Run all contract tests
cargo test

# Run tests with output
cargo test -- --nocapture

# Run specific test
cargo test test_create_campaign_success

# Run tests in release mode (optimized)
cargo test --release
```

---

## Unit Tests

### Cache Service (`src/services/cache.test.js`)

Tests for the caching system covering:
- Basic get/set operations
- TTL (Time-to-Live) expiration
- Cache key generation
- Batch operations
- Various data types

**Key Tests:**
```javascript
// Setting and retrieving values
cache.set('key1', 'value1');
expect(cache.get('key1')).toBe('value1');

// TTL expiration
cache.set('key1', 'value1', 1000); // 1 second TTL
// After 1 second, value is expired

// Using cache keys
cache.set(cacheKeys.balance(address), balance);
const cachedBalance = cache.get(cacheKeys.balance(address));
```

**Run:**
```bash
npm test -- cache.test.js
```

---

### Custom Hooks (`src/hooks/useAsync.test.js`)

Tests for all custom React hooks:
- `useAsync` - Async operations
- `useDebounce` - Value debouncing
- `useForm` - Form state management
- `useLocalStorage` - Persistent state

**Key Tests:**
```javascript
// useAsync success
const { data, loading, execute } = useAsync(fetchData);
await execute();
expect(data).toBeDefined();

// useForm validation
const { errors, handleSubmit } = useForm(
  { email: '' },
  (values) => ({ email: values.email ? {} : { email: 'Required' } })
);

// useLocalStorage persistence
const [value, setValue] = useLocalStorage('key', 'initial');
setValue('new');
expect(localStorage.getItem('key')).toBe(JSON.stringify('new'));
```

**Run:**
```bash
npm test -- useAsync.test.js
```

---

## Component Tests

### Loading Components (`src/components/LoadingSpinner.test.js`)

Tests for all loading and progress indicator components:
- `LoadingSpinner` (size, variant, message)
- `ProgressBar` (percentage, clamping)
- `SkeletonLoader` (types, count)
- `StatusBadge` (all status types)
- `StepIndicator` (progression, completion)

**Example Test:**
```javascript
it('should render progress bar with correct percentage', () => {
  const { container } = render(<ProgressBar percentage={75} />);
  const fill = container.querySelector('.progress-bar-fill');
  expect(fill).toHaveStyle({ width: '75%' });
});

it('should display step as completed', () => {
  const steps = [
    { label: 'Step 1' },
    { label: 'Step 2' },
  ];
  const { container } = render(<StepIndicator steps={steps} currentStep={1} />);
  const completed = container.querySelector('.step-item.completed');
  expect(completed).toBeInTheDocument();
});
```

**Run:**
```bash
npm test -- LoadingSpinner.test.js
```

---

## Integration Tests

### Soroban Integration (`src/components/Soroban.test.js`)

Tests for blockchain interaction functions:
- Wallet connection
- Public key retrieval
- Balance fetching
- Error handling

**Test Examples:**

#### Wallet Connection
```javascript
it('should check Freighter connection', async () => {
  const result = await checkFreighterConnection();
  expect(result).toBe(true);
});

it('should throw error when wallet unavailable', async () => {
  await expect(checkFreighterConnection()).rejects.toThrow(WalletNotFoundError);
});
```

#### Balance Fetching
```javascript
it('should get balance for address', async () => {
  const balance = await getBalance('GADDRESS123...');
  expect(balance).toBe('100.5');
});

it('should return 0 for no native balance', async () => {
  const balance = await getBalance('GADDRESS123...');
  expect(balance).toBe('0');
});
```

**Run:**
```bash
npm test -- Soroban.test.js
```

---

## Smart Contract Tests

### Campaign Management Tests (`crowdfund-contract/src/tests.rs`)

Comprehensive tests for all contract functions:

#### Campaign Creation
```rust
#[test]
fn test_create_campaign_success() {
    let (env, admin) = setup_env();
    let contract_id = env.register_contract(None, Contract);
    let client = ContractClient::new(&env, &contract_id);

    let title = SorobanString::from_slice(&env, "Test Campaign");
    let target = 1000_0000000u128;
    let deadline = env.ledger().timestamp() + 30 * 24 * 60 * 60;

    let campaign_id = client.create_campaign(&admin, &title, &target, &deadline);
    assert_eq!(campaign_id, 1);
}
```

#### Donation Tests
```rust
#[test]
fn test_donate_to_campaign() {
    // Setup
    let (env, admin) = setup_env();
    let donor = Address::random(&env);
    
    // Create campaign
    let campaign_id = /* ... */;
    
    // Make donation
    let amount = 100_0000000u128;
    client.donate(&campaign_id, &donor, &amount);
    
    // Verify
    let campaign = client.get_campaign(&campaign_id);
    assert_eq!(campaign.raised, amount);
}
```

#### Error Cases
```rust
#[test]
#[should_panic(expected = "Campaign not found")]
fn test_fetch_nonexistent_campaign() {
    let client = /* ... */;
    client.get_campaign(&999); // Should panic
}
```

**Run All Contract Tests:**
```bash
cd crowdfund-contract
cargo test
```

**Run Specific Test:**
```bash
cargo test test_donate_to_campaign
```

**Run with Output:**
```bash
cargo test -- --nocapture --test-threads=1
```

---

## Test Coverage

### Generate Coverage Report

```bash
# Frontend coverage
npm test -- --coverage --watchAll=false

# Expected output:
# --------|----------|----------|----------|----------|
# File    | % Stmts  | % Branch | % Funcs  | % Lines  |
# --------|----------|----------|----------|----------|
# cache   | 95%      | 90%      | 100%     | 95%      |
# hooks   | 88%      | 85%      | 92%      | 88%      |
# ...     | ...      | ...      | ...      | ...      |
```

### Coverage Goals

- **Statements:** > 80%
- **Branches:** > 75%
- **Functions:** > 85%
- **Lines:** > 80%

### Increasing Coverage

```javascript
// ✅ Test happy path
it('should do X', () => {
  expect(fn()).toBe(expectedValue);
});

// ✅ Test error cases
it('should throw when input invalid', () => {
  expect(() => fn(invalidInput)).toThrow();
});

// ✅ Test edge cases
it('should handle empty input', () => {
  expect(fn([])).toEqual([]);
});

// ✅ Test all branches
if (condition) {
  // Test when true
  expect(fnWhenTrue()).toBe(value);
}
// Test when false
expect(fnWhenFalse()).toBe(value);
```

---

## Debugging Tests

### VS Code Integration

1. **Add Debugger Breakpoints:**
   ```javascript
   it('should pass', () => {
     debugger; // Execution pauses here
     expect(value).toBe(expected);
   });
   ```

2. **Run with Inspector:**
   ```bash
   node --inspect-brk node_modules/.bin/jest --runInBand
   ```

3. **Open Chrome DevTools:**
   - Navigate to `chrome://inspect`
   - Click "Inspect" on the jest process

### Logging for Debugging

```javascript
it('should debug values', () => {
  const result = complexFunction();
  console.log('Result:', result);        // Log to console
  console.table(arrayOfObjects);         // Table format
  console.assert(condition, 'Message');  // Conditional log
  expect(result).toBe(expected);
});
```

### Common Issues

**Issue: "Cannot find module"**
```javascript
// Make sure path is correct relative to test file
import { cache } from '../services/cache'; // Correct
// NOT
import { cache } from './cache'; // Wrong
```

**Issue: "Test timeout"**
```javascript
// Increase timeout for slow operations
it('should complete long operation', async () => {
  const result = await slowAsyncFn();
  expect(result).toBeDefined();
}, 10000); // 10 second timeout
```

**Issue: "Mock not called"**
```javascript
// Ensure mock is used before assertion
const mockFn = jest.fn();
mockFn('value');
expect(mockFn).toHaveBeenCalledWith('value');

// ❌ Wrong: Check mock without calling
expect(mockFn).toHaveBeenCalled(); // Fails!
```

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v2
```

---

## Best Practices

### ✅ Do

- Write tests for edge cases
- Use descriptive test names
- Keep tests isolated and independent
- Mock external dependencies
- Test both success and failure paths
- Use `beforeEach`/`afterEach` for setup/cleanup

### ❌ Don't

- Skip tests with `.skip` in commits
- Leave focused tests with `.only` in commits
- Test implementation details
- Create interdependent tests
- Use real API calls in tests
- Leave console.log statements

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Soroban Testing Guide](https://developers.stellar.org/docs/learn/building-with-soroban)
- [Jest Matchers Cheat Sheet](https://jestjs.io/docs/expect)
