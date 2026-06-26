---
name: bank-of-celo
description: Community DeFi platform for Farcaster — social-first banking built on Celo and Base networks with donations, rewards, savings vaults, jackpots, and gamified engagement.
---

# Bank of Celo

> Social-first DeFi banking built on Celo and Base networks for the Farcaster ecosystem.

## Project Overview

Bank of Celo is a community-driven DeFi platform that bridges Farcaster social identity verification with decentralized financial services. Users authenticate via Farcaster, then interact with on-chain smart contracts for donations, daily claims, jackpot/lottery, FX savings vaults, and gamified rewards — all across **Celo** (primary) and **Base** (Degen mode) networks.

**Live URL:** https://bank-of-celo.vercel.app/

---

## Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, TypeScript) |
| **Styling** | Tailwind CSS + shadcn/ui + Framer Motion |
| **Web3** | Wagmi v2 + Viem |
| **Auth** | NextAuth v4 with Farcaster provider |
| **Data Layer** | Convex (real-time BaaS) |
| **Social API** | Neynar (Farcaster profiles, quality scores) |
| **Smart Contracts** | Solidity (Hardhat) |
| **Subgraph** | The Graph (boc-graph) |
| **Hosting** | Vercel |
| **Cache/KV** | Upstash Redis |

### Directory Structure

```
bank-of-celo/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes (auth, claim, farcaster, leaderboard, etc.)
│   │   ├── chain-mode/         # Chain-specific pages
│   │   ├── services/           # Service layer pages
│   │   ├── app.tsx             # Main app shell
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Entry page
│   │   ├── providers.tsx       # App-level providers (Wagmi, QueryClient)
│   │   ├── ConvexClientProvider.tsx  # Convex provider wrapper
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── Main.tsx            # Primary app component with tab routing
│   │   ├── chain/              # ChainModeToggle (Celo ↔ Base switch)
│   │   ├── tabs/               # Feature tab components
│   │   │   ├── HomeTab.tsx     # Dashboard / home view
│   │   │   ├── TransactTab.tsx # Donations + Claims
│   │   │   ├── JackPot.tsx     # Lottery system (v1)
│   │   │   ├── JackPotV2.tsx   # Lottery system (v2, current)
│   │   │   ├── FxTab.tsx       # FX Savings vaults
│   │   │   ├── LeaderboardTab.tsx  # Community leaderboard
│   │   │   ├── SwapBridgeTab.tsx   # Squid cross-chain swap widget
│   │   │   ├── cashback/       # Cashback features
│   │   │   ├── rewards/        # Reward components
│   │   │   └── services/       # Service tab components
│   │   ├── providers/          # Context providers
│   │   └── ui/                 # shadcn/ui primitives
│   ├── constants/
│   │   └── images.ts           # Image asset constants
│   ├── contexts/               # React Context definitions (currently empty dir)
│   ├── hooks/
│   │   └── contracts.ts        # Contract hooks + ABIs + addresses
│   └── lib/
│       ├── constants.ts        # ABIs, contract addresses, chain configs (large file)
│       ├── kv.ts               # Upstash Redis KV helpers
│       ├── neynar.ts           # Neynar API client (Farcaster data)
│       ├── notifs.ts           # Notification utilities
│       ├── truncateAddress.ts  # Address display helper
│       └── utils.ts            # General utilities (cn, formatting)
├── contracts/                  # Hardhat project
│   ├── contracts/              # Solidity smart contracts
│   │   ├── BankOfCelo.sol      # Main Celo bank contract
│   │   ├── BankOfDegen.sol     # Main Base/Degen bank contract
│   │   ├── BankOfCeloRelay.sol # Gasless relay (EIP-712 meta-tx)
│   │   ├── CeloDailyCheckIn.sol / V2  # Daily check-in contracts
│   │   ├── DegenDailyCheckIn.sol       # Base daily check-in
│   │   ├── CeloJackpot.sol / V2       # Lottery contracts (Celo)
│   │   ├── DegenJackpot.sol           # Lottery contract (Base)
│   │   ├── CeloEURVault.sol           # EUR savings vault
│   │   ├── UsdcVault.sol              # USDC savings vault
│   │   ├── FarQuest.sol               # Quest system
│   │   ├── FootyClaim.sol             # Themed claim contract
│   │   └── LoyaltyRewards.sol         # Loyalty rewards
│   ├── scripts/                # Deployment scripts
│   ├── test/                   # Contract tests
│   └── hardhat.config.ts       # Hardhat configuration
├── convex/                     # Convex backend functions
│   ├── schema.ts               # DB schema (users, rewards tables)
│   ├── users.ts                # User CRUD operations
│   └── rewards.ts              # Reward tracking functions
├── boc-graph/                  # The Graph subgraph
│   ├── schema.graphql          # GraphQL entity schema
│   ├── subgraph.yaml           # Subgraph manifest
│   ├── src/                    # AssemblyScript mappings
│   └── abis/                   # Contract ABIs for indexing
├── scripts/                    # Build/dev/deploy scripts
│   ├── dev.js                  # Development server script
│   ├── build.js                # Production build script
│   └── deploy.js               # Vercel deployment script
└── public/                     # Static assets
```

---

## Networks & Contracts

### Celo Network (Chain ID: 42220)
| Contract | Address |
|---|---|
| Bank of Celo | `0x18Ea8d1D41A3307D159D2d3C1fCfBCF139354A8F` |
| Daily Check-in | `0xd9771bAE9A9647Fd83C9066f981ef91373A56B36` |
| Jackpot | `0x9602d02Bd17d9f1c1EB09028fCea26dD29383611` |
| EUR Vault (FX) | `0x6C617A05b9D183D2BD1A3350F4782Fc125460634` |

### Base Network (Chain ID: 8453)
| Contract | Address |
|---|---|
| Bank of Degen | `0xbAA9d576E6bA810C6e15f2b3b144a7268a6280e2` |
| Daily Check-in | `0x951C3C3A213a6845a7aD92E5Ea52D3983D83C296` |
| Jackpot | `0xb805cAcA994d25234Ac9d6b9c53De49a1B500872` |
| USDC Vault (FX) | `0x8Ca054b89C9F04C5546f37B633690fb940Cc4130` |

> **Important:** There are legacy/deprecated contract addresses in the README. Always use the addresses above for current development.

---

## Key Conventions

### Code Style
- **TypeScript** everywhere — strict types, no `any` unless unavoidable
- **ESLint** + **Prettier** enforced (`.eslintrc.json`, `.prettierrc`)
- **Tailwind CSS** for styling — use utility classes, extend via `tailwind.config.ts`
- **shadcn/ui** for base UI primitives (in `src/components/ui/`)
- **Framer Motion** for animations — use motion components for transitions

### Component Patterns
- Tab-based navigation managed in `src/components/Main.tsx`
- Feature components live under `src/components/tabs/`
- Chain switching via `ChainModeToggle` component — affects which contracts/tokens are used
- Provider hierarchy: `ConvexClientProvider` → `Wagmi` → `QueryClient` → `SessionProvider`

### Smart Contract Interaction
- All contract ABIs and addresses centralized in `src/lib/constants.ts` and `src/hooks/contracts.ts`
- Use **Wagmi hooks** (`useReadContract`, `useWriteContract`, `useWaitForTransactionReceipt`) for all blockchain reads/writes
- **Viem** for lower-level operations (encoding, hashing, formatting)
- Gasless transactions use **EIP-712** signature verification via `BankOfCeloRelay.sol`

### Authentication Flow
1. User connects via **Farcaster Frame SDK** or **WalletConnect**
2. **NextAuth** creates a session with Farcaster credentials
3. **Neynar API** fetches user profile and quality score
4. Quality score > 0.39 required for claim eligibility (sybil resistance)

### Data Layer (Convex)
- **Schema** in `convex/schema.ts` — two tables: `users` and `rewards`
- `users`: stores FID, username, engagement score, OG status, wallet address
- `rewards`: tracks per-period reward claims (FID, amount, claimed status)
- Real-time polling with ~3-second intervals for live updates

### API Routes (`src/app/api/`)
- `auth/` — NextAuth endpoints
- `claim/` — Daily reward claiming logic
- `farcaster/` — Farcaster data proxying
- `leaderboard/` — Rankings and stats
- `sign/` — EIP-712 signature generation for gasless tx
- `send-notification/` — Push notification dispatch
- `self-protocol/` — Self.xyz identity verification
- `webhook/` — External webhook handlers
- `sync-celo-feed/` — Feed synchronization

---

## Environment Variables

```bash
# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Farcaster / Neynar
NEYNAR_API_KEY="..."

# Convex
CONVEX_DEPLOYMENT="..."
NEXT_PUBLIC_CONVEX_URL="..."

# Blockchain RPCs
NEXT_PUBLIC_ALCHEMY_API_KEY="..."

# Upstash Redis
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
```

---

## Development Commands

```bash
# Start development server (custom script handles port conflicts + env)
npm run dev

# Production build
npm run build        # Custom build script
npm run build:prod   # Direct next build

# Deploy to Vercel
npm run deploy:vercel

# Lint
npm run lint

# Kill port 3000 processes
npm run cleanup

# Convex development
npx convex dev       # Start Convex dev server
npx convex deploy    # Deploy Convex functions

# Smart contracts (from /contracts directory)
npx hardhat compile
npx hardhat test
npx hardhat ignition deploy ...
```

---

## Feature Modules

### Donations (TransactTab)
- Users donate CELO or DEGEN to the community vault
- Referral tracking via Divvi SDK (`@divvi/referral-sdk`)
- Transaction confirmation with explorer links

### Daily Claims (TransactTab)
- **Celo:** 0.5 CELO per claim, **Base:** 100 DEGEN per claim
- 24-hour cooldown enforced on-chain
- Gasless claiming auto-enabled when user has insufficient gas (Celo only)

### Jackpot/Lottery (JackPotV2)
- Round-based lottery with countdown timers
- **Celo:** 1 CELO/ticket, **Base:** 250 DEGEN/ticket
- Automatic winner selection, 5% platform fee on prizes
- Historical round tracking

### FX Savings (FxTab)
- **Celo Mode:** Deposit cEUR → earn CELO rewards (APY-based)
- **Degen Mode:** Deposit USDC → earn DEGEN rewards
- Batch transactions for approve + deposit flow

### Leaderboard (LeaderboardTab)
- Community rankings based on engagement
- Convex-powered real-time updates

### Swap/Bridge (SwapBridgeTab)
- Cross-chain swaps via Squid Widget (`@0xsquid/widget`)

---

## Important Considerations

1. **Multi-chain awareness** — Always consider both Celo and Base networks when adding features. Use the chain mode toggle pattern.
2. **Farcaster-first** — This is a Farcaster Mini App. All auth and identity flows go through Farcaster/Neynar.
3. **Gasless UX** — On Celo, support EIP-712 meta-transactions for users without gas.
4. **`src/lib/constants.ts` is large** (~134KB) — It contains all ABIs. When modifying, target specific sections rather than rewriting.
5. **Legacy contracts exist** — Some contracts are deprecated. Always reference the current contract addresses listed above.
6. **Convex is the source of truth** for off-chain user data (scores, rewards tracking). Blockchain is source of truth for on-chain state.
7. **Quality score gating** — Claims require Farcaster quality score > 0.39. This is a core anti-sybil mechanism — do not remove or weaken.
8. **Self.xyz integration** — Used for OG/identity verification. Handle verification callbacks properly.
