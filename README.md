# Stellar Connect Wallet

A React dApp that connects to the Stellar testnet using the Freighter wallet extension.

## Features

- Connect Freighter wallet
- View public key and XLM balance
- Sign transactions via Freighter

## Prerequisites

- Node.js
- [Freighter](https://www.freighter.app/) browser extension (set to Testnet)

## Setup

```bash
npm install
npm start
```

Opens at `https://localhost:3000` (HTTPS required for Freighter).

## Project Structure

```
src/
├── App.js
├── components/
│   ├── Header.js       # Wallet connect UI
│   └── Freighter.js    # Stellar/Freighter helpers
```

## Usage

1. Install and open Freighter, switch to Testnet.
2. Click **Connect Wallet**.
3. Your address and XLM balance will appear in the header.
