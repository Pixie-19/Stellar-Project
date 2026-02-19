# Stellar Payment dApp

A React-based decentralized application that connects to the **Stellar Testnet** via the [Freighter](https://www.freighter.app/) wallet extension. Users can view their XLM balance and send XLM to any Stellar address.

---

## Screenshot

<img width="1919" height="963" alt="Screenshot" src="https://github.com/user-attachments/assets/694bb909-0ced-480f-8c13-463f9b9df9db" />


---

## Features

- Connect to Freighter wallet with one click
- Display wallet public key and live XLM balance
- Send XLM to any valid Stellar Testnet address
- Real-time balance refresh after transactions
- Transaction hash display with Stellar Expert link
- Error handling for insufficient funds, missing destinations, and user cancellations

---

## How It Works

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Freighter
    participant Horizon as Stellar Horizon (Testnet)

    User->>App: Click "Connect Wallet"
    App->>Freighter: Request permission
    Freighter-->>App: Approved + public key
    App->>Horizon: Load account & balance
    Horizon-->>App: Account data
    App-->>User: Show address & balance

    User->>App: Enter destination + amount
    User->>App: Click "Send XLM"
    App->>Horizon: Load sender account
    App->>App: Build payment transaction
    App->>Freighter: Sign transaction (XDR)
    Freighter-->>User: Confirm in extension
    User->>Freighter: Approve
    Freighter-->>App: Signed XDR
    App->>Horizon: Submit transaction
    Horizon-->>App: Transaction result
    App-->>User: Show tx hash + updated balance
```

---

## Architecture

```mermaid
graph TD
    A[App.js] --> B[Header.js]
    A --> C[SendPayment.js]
    B --> D[Freighter.js]
    C --> D
    D --> E[Freighter Wallet Extension]
    D --> F[Stellar Horizon Testnet API]

    style A fill:#241e1b,stroke:#c9a96e,color:#e8ddd5
    style B fill:#2a2320,stroke:#3d3330,color:#e8ddd5
    style C fill:#2a2320,stroke:#3d3330,color:#e8ddd5
    style D fill:#2a2320,stroke:#c9a96e,color:#e8ddd5
    style E fill:#1a1210,stroke:#4ade80,color:#4ade80
    style F fill:#1a1210,stroke:#4ade80,color:#4ade80
```

---

## Project Structure

```
src/
├── App.js                  # Root component, manages wallet state
├── App.css                 # App-level styles (layout, wallet card, welcome)
├── index.js                # Entry point
├── index.css               # Global styles (reset, fonts)
└── components/
    ├── Freighter.js        # Stellar SDK & Freighter API helpers
    ├── Header.js           # Navbar with wallet connect button
    ├── Header.css          # Header styles
    ├── SendPayment.js      # Send XLM form with validation
    └── SendPayment.css     # Send payment styles
```

---

## Prerequisites

- **Node.js** (v16+)
- **npm**
- [**Freighter**](https://www.freighter.app/) browser extension installed and set to **Testnet**
- A funded Stellar Testnet account (use [Friendbot](https://friendbot.stellar.org/) to fund)

---

## Setup

```bash
cd stellar-connect-wallet
npm install
npm start
```

Opens at `https://localhost:3000` (HTTPS is required for Freighter).

---

## Usage

```mermaid
flowchart LR
    A[Install Freighter] --> B[Set to Testnet]
    B --> C[Click Connect Wallet]
    C --> D[View Balance]
    D --> E[Enter Destination & Amount]
    E --> F[Click Send XLM]
    F --> G[Confirm in Freighter]
    G --> H[Transaction Complete]

    style A fill:#241e1b,stroke:#3d3330,color:#e8ddd5
    style B fill:#241e1b,stroke:#3d3330,color:#e8ddd5
    style C fill:#2a2320,stroke:#c9a96e,color:#c9a96e
    style D fill:#2a2320,stroke:#3d3330,color:#e8ddd5
    style E fill:#2a2320,stroke:#3d3330,color:#e8ddd5
    style F fill:#2a2320,stroke:#c9a96e,color:#c9a96e
    style G fill:#2a2320,stroke:#3d3330,color:#e8ddd5
    style H fill:#1a1210,stroke:#4ade80,color:#4ade80
```

1. Install and open Freighter, switch to **Testnet**.
2. Click **Connect Wallet** and approve in the extension.
3. Your wallet address and XLM balance will appear.
4. Enter a valid Stellar Testnet public address and amount.
5. Click **Send XLM** and confirm the transaction in Freighter.
6. The transaction hash will be displayed with a link to view it on [Stellar Expert](https://stellar.expert/).

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Stellar SDK | Transaction building & Horizon API |
| Freighter API | Wallet connection & transaction signing |
| CSS (modular) | Component-scoped styling |

---

## Important Notes

- This project uses the **Stellar Testnet** only — do NOT use real mainnet funds.
- Always confirm transactions before signing in Freighter.
- This is a learning/demo application.
