# Deployment Guide

Complete guide for deploying the StellarFund application to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Smart Contract Deployment](#smart-contract-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- Node.js 18+ (for frontend)
- Rust 1.70+ (for smart contract)
- Stellar CLI (`cargo install stellar-cli`)
- Freighter Wallet (browser extension)
- Git (for version control)

### Required Accounts

- GitHub account (for source code)
- Vercel or Netlify account (for frontend hosting)
- Stellar Testnet funding (from Friendbot)

### Required Keys & Credentials

```bash
# Stellar keypair (testnet)
STELLAR_SECRET_KEY=SBBB...
STELLAR_PUBLIC_KEY=GADDRESS...

# Optional: Third-party services
GITHUB_TOKEN=ghp_...
VERCEL_TOKEN=...
```

---

## Smart Contract Deployment

### Step 1: Build the Contract

```bash
cd crowdfund-contract

# Build to WASM
cargo build --target wasm32-unknown-unknown --release

# Output file:
# target/wasm32-unknown-unknown/release/stellar_crowdfund_contract.wasm
```

### Step 2: Deploy to Testnet

```bash
# Set up Stellar CLI configuration
stellar config network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

# Deploy contract
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_crowdfund_contract.wasm \
  --network testnet \
  --account <YOUR_ACCOUNT_NAME>

# Output:
# Deployed successfully!
# Contract ID: CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2OOTGZN3
```

### Step 3: Verify Deployment

```bash
# Check contract exists
stellar contract info \
  --id CDLZFC3S... \
  --network testnet

# Invoke function (test)
stellar contract invoke \
  --id CDLZFC3S... \
  --network testnet \
  -- \
  create_campaign \
  --creator <ADDRESS> \
  --title "Test Campaign" \
  --target 1000000000 \
  --deadline 1735689600
```

### Step 4: Update Frontend Configuration

```javascript
// stellar-connect-wallet/src/components/Soroban.js

export const CONTRACT_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2OOTGZN3';
export const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
```

---

## Frontend Deployment

### Option 1: Deploy to Vercel

#### Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

#### Deploy

```bash
cd stellar-connect-wallet

# Deploy to production
vercel --prod

# Or use GitHub integration
# Connect GitHub repo in Vercel dashboard
# Auto-deploys on push to main
```

#### Vercel Configuration (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "env": {
    "REACT_APP_CONTRACT_ID": "@stellar-contract-id",
    "REACT_APP_NETWORK": "testnet"
  }
}
```

### Option 2: Deploy to Netlify

#### Setup

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login
```

#### Deploy

```bash
cd stellar-connect-wallet

# One-time deploy
netlify deploy --prod --dir=build

# Or connect GitHub repo for auto-deploy
netlify init
```

#### Netlify Configuration (`netlify.toml`)

```toml
[build]
  command = "npm run build"
  publish = "build"

[env]
  REACT_APP_CONTRACT_ID = "CDLZFC3S..."
  REACT_APP_NETWORK = "testnet"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
```

```bash
# Build and run
docker build -t stellarfund:latest .
docker run -p 3000:3000 stellarfund:latest
```

---

## Environment Configuration

### Frontend Environment Variables

```bash
# .env (development)
REACT_APP_CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2OOTGZN3
REACT_APP_NETWORK=testnet
REACT_APP_SOROBAN_RPC=https://soroban-testnet.stellar.org
REACT_APP_HORIZON_URL=https://horizon-testnet.stellar.org

# .env.production
REACT_APP_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
REACT_APP_NETWORK=mainnet
REACT_APP_SOROBAN_RPC=https://soroban-mainnet.stellar.org
REACT_APP_HORIZON_URL=https://horizon.stellar.org
```

### Smart Contract Environment

```bash
# stellar config
STELLAR_ACCOUNT=my-account
STELLAR_SECRET=SBXXXXXXX
STELLAR_NETWORK=testnet
```

---

## Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Code reviewed and approved
- [ ] No console errors or warnings
- [ ] Environment variables configured
- [ ] Security audit completed
- [ ] Performance optimized
- [ ] Backup of current deployment created
- [ ] Deployment plan documented

---

## Deployment Steps

### 1. Pre-Deployment

```bash
# Create backup
git tag v1.0.0-backup
git push origin v1.0.0-backup

# Verify all tests pass
npm test -- --coverage

# Build locally to verify
npm run build
```

### 2. Deploy Smart Contract

```bash
cd crowdfund-contract

# Compile
cargo build --target wasm32-unknown-unknown --release

# Deploy
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_crowdfund_contract.wasm \
  --network testnet \
  --account my-account

# Save contract ID
echo "CONTRACT_ID=CDLZFC3S..." > .env.deployment
```

### 3. Deploy Frontend

```bash
# Update environment variables
cp .env.production .env

# Deploy to Vercel/Netlify
vercel --prod

# Or
netlify deploy --prod --dir=build
```

### 4. Post-Deployment Verification

```bash
# Test deployed application
curl https://stellarfund.app
# Should return HTML

# Check contract functionality
# 1. Open application in browser
# 2. Connect wallet
# 3. Create test campaign
# 4. Verify on block explorer
# 5. Make test donation
```

---

## Rollback Plan

### If Deployment Fails

```bash
# Revert to previous version
git revert HEAD
git push origin main

# Redeploy previous version
vercel --prod --yes

# Or
netlify deploy --prod --dir=build
```

### If Contract Fails

```bash
# Use previous contract ID
export CONTRACT_ID=<PREVIOUS_ID>

# Update frontend config
# Redeploy frontend
vercel --prod
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check frontend
curl https://stellarfund.app/health

# Check contract
stellar contract info --id CDLZFC3S... --network testnet

# Check Horizon API
curl https://horizon-testnet.stellar.org/health
```

### Monitoring Setup

#### Sentry (Error Tracking)

```bash
npm install @sentry/react @sentry/tracing
```

```javascript
// src/index.js
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://xxx@xxx.ingest.sentry.io/xxx",
  environment: process.env.REACT_APP_ENV,
  tracesSampleRate: 0.1,
});
```

#### Uptime Monitoring

```bash
# Use external service: UptimeRobot, StatusPage
# Monitor: https://stellarfund.app
# Alert on: Down, Slow responses
```

### Logs

```bash
# View logs on Vercel
vercel logs

# View logs on Netlify
netlify logs:functions

# Docker logs
docker logs <container_id>
```

---

## Scaling Considerations

### If Traffic Increases

1. **Enable Caching**
   ```bash
   # Configure CDN cache headers
   # Cache: static assets (1 year)
   # Cache: API responses (5 minutes)
   ```

2. **Optimize Bundle**
   ```bash
   npm run analyze  # Analyze bundle size
   npm run build    # Check final size
   ```

3. **Database Indexing**
   - If using backend database
   - Add indexes on frequently queried fields

4. **Horizontal Scaling**
   - Deploy multiple instances
   - Use load balancer
   - Sticky sessions for wallet state

---

## Troubleshooting

### Contract Deployment Issues

**Error: "Invalid network"**
```bash
# Verify Stellar CLI config
stellar config network ls

# Fix: Add network
stellar config network add testnet \
  --rpc-url https://soroban-testnet.stellar.org
```

**Error: "Insufficient balance"**
```bash
# Fund account via Friendbot
curl "https://friendbot.stellar.org?addr=GADDRESS..."
```

### Frontend Deployment Issues

**Error: "Build failed"**
```bash
# Check Node version
node --version  # Should be 18+

# Clear cache
npm cache clean --force

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error: "Contract not found in frontend"**
```bash
# Update CONTRACT_ID in Soroban.js
# Verify in .env file
# Redeploy frontend
```

### Runtime Issues

**Contract calls failing**
```bash
# Check contract status
stellar contract info --id CDLZFC3S... --network testnet

# Verify contract invocation
stellar contract invoke --id CDLZFC3S... -- get_campaign --campaign_id 1
```

**Wallet not connecting**
```bash
# Check Freighter extension
# Install from Chrome Web Store if missing

# Check browser console
# Look for wallet errors

# Test with testnet funds
curl "https://friendbot.stellar.org?addr=GADDRESS..."
```

---

## Production Hardening Checklist

### Security

- [ ] HTTPS enabled
- [ ] Framing protection headers
- [ ] CSP headers configured
- [ ] Secrets in environment variables (not code)
- [ ] Rate limiting enabled
- [ ] Input validation on frontend

### Performance

- [ ] Bundle size < 500KB
- [ ] First contentful paint < 2s
- [ ] Lazy loading implemented
- [ ] Images optimized
- [ ] Code splitting enabled

### Reliability

- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring
- [ ] Automated backups
- [ ] Disaster recovery plan
- [ ] Deployment rollback procedure

### Compliance

- [ ] Privacy policy updated
- [ ] Terms of service prepared
- [ ] Audit trail logs
- [ ] GDPR compliance (if needed)

---

## Support & Documentation

- [Vercel Deployment Docs](https://vercel.com/docs)
- [Netlify Deployment Docs](https://docs.netlify.com/)
- [Stellar Deployment Guide](https://developers.stellar.org/docs/build/guides/)
- [Soroban Deployment](https://developers.stellar.org/docs/build/guides/deploy-stellar-contracts)
