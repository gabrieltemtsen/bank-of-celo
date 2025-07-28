# Bank of Celo - Community DeFi Platform for Farcaster

**Social-First DeFi Banking Built on Celo and Base Networks**

Bank of Celo is a community-driven DeFi platform that bridges social verification with decentralized finance. Built specifically for the Farcaster ecosystem, it provides gamified financial services including donations, rewards, savings vaults, and lottery systems across Celo and Base networks.

---

## 🌟 What is Bank of Celo?

Bank of Celo combines social identity verification through Farcaster with decentralized financial services. The platform addresses the need for accessible DeFi tools within social networks, offering users multiple ways to earn, save, and participate in community-funded initiatives.

### Core Value Propositions:
- 🏦 **Multi-Network Support** – Operates on both Celo and Base networks
- 🎯 **Social Verification** – Uses Farcaster identity and quality scores for sybil resistance  
- 💰 **Community Rewards** – Daily claims, jackpots, and gamified engagement
- 🔄 **Savings Vaults** – Yield farming with foreign exchange tokens (FX)
- 🤝 **Donation System** – Community-funded vault for sustainable rewards

---

## 🚀 Key Features

### 🏠 **Home Dashboard**
- Real-time vault balance display
- Quick access to all platform features
- Network switching between Celo and Base
- User session management with Farcaster authentication

### 💸 **Transact Hub**
**Donations:**
- Support the community vault with CELO or DEGEN tokens
- Referral tracking integration
- Real-time transaction confirmations

**Claims:**
- Daily rewards for verified Farcaster users
- **Celo Network:** 0.5 CELO per claim
- **Base Network:** 100 DEGEN per claim
- 24-hour cooldown period
- Quality score requirement (>0.39)

**Gasless Claims:**
- Auto-enabled for users with insufficient gas on Celo
- EIP-712 signature verification

### 🎰 **Jackpot System**
**Lottery Features:**
- **Celo:** 1 CELO per ticket
- **Base:** 250 DEGEN per ticket
- Round-based draws with countdown timers
- Automatic winner selection
- Prize claiming with 5% platform fee
- Historical round tracking

### 📈 **Fx Savings** *(Under Development)*
**Celo Mode:**
- Deposit cEUR tokens
- Earn CELO rewards
- APY-based yield calculation

**Degen Mode:**
- Deposit USDC tokens
- Earn DEGEN rewards
- Batch transaction support for approve + deposit

**Vault Contracts:**
- EUR Vault: `0x6C617A05b9D183D2BD1A3350F4782Fc125460634`
- USDC Vault: `0x8Ca054b89F04C5546f37B633690fb940Cc4130`

### 🏆 **Rewards & Gamification**
- Daily check-in system
- Streak tracking
- Community leaderboards
- Round-based participation rewards

---

## 🔗 Network Support

### **Celo Network** (Primary)
- **Chain ID:** 42220
- **Native Token:** CELO
- **Supported Tokens:** CELO, cEUR
- **Explorer:** [Celoscan](https://celoscan.io)

### **Base Network** (Degen Mode)
- **Chain ID:** 8453  
- **Primary Token:** DEGEN (ERC-20)
- **Supported Tokens:** DEGEN, USDC
- **Explorer:** [Basescan](https://basescan.org)

---

## 📜 Smart Contract Addresses

### **Celo Network Contracts**
```
Bank of Celo:     0x18Ea8d1D41A3307D159D2d3C1fCfBCF139354A8F
Daily Check-in:   0xd9771bAE9A9647Fd83C9066f981ef91373A56B36
Jackpot:          0x9602d02Bd17d9f1c1EB09028fCea26dD29383611
EUR Vault (FX):   0x6C617A05b9D183D2BD1A3350F4782Fc125460634
```

### **Base Network Contracts**
```
Bank of Degen:    0xbAA9d576E6bA810C6e15f2b3b144a7268a6280e2
Daily Check-in:   0x951C3C3A213a6845a7aD92E5Ea52D3983D83C296
Jackpot:          0xb805cAcA994d25234Ac9d6b9c53De49a1B500872
USDC Vault (FX):  0x8Ca054b89F04C5546f37B633690fb940Cc4130
```

### **Legacy Contracts** *(Deprecated)*
```
BankOfCelo (legacy):     0x6DD5608Bf1F68C23Bf5D519161128240C7D764Fc
CeloDailyCheckIn:        0xaFbFAaac9c495C74de33c039C0B56172b393d2Ad
CeloJackpotV2:           0xB6cF643d413D055a467cDd4a4224047831dD92b2
DegenDailyCheckIn:       0xb2e22CdfaB5274186498CedD66b5801e80e98299
DegenJackpot:            0xD8407eE0b2B1008FAb9e2bD8Ab9005F2dA8BEE67
```

---

## 🛠 Technical Architecture

### **Frontend Stack**
- **Framework:** Next.js 15 with TypeScript
- **Styling:** Tailwind CSS with shadcn/ui components
- **Animations:** Framer Motion
- **State Management:** React Context + Custom Hooks

### **Blockchain Integration**
- **Web3 Library:** Wagmi v2 + Viem
- **Wallet Support:** Frame SDK, WalletConnect
- **Multi-chain:** Dynamic network switching
- **Gasless Transactions:** EIP-712 meta-transactions

### **Farcaster Integration**
- **Authentication:** NextAuth with Farcaster provider
- **Data Source:** Neynar API for user profiles and quality scores
- **Frame Support:** Native Farcaster Mini Apps framework
- **Identity Verification:** FID-based user validation

### **Data Layer**
- **Database:** Convex for user data and leaderboards
- **Caching:** Real-time updates with 3-second polling
- **External APIs:** Neynar for Farcaster data
- **Contract State:** Direct blockchain queries

---

## 🧑‍💻 Development Setup

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Git

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/your-org/bank-of-celo.git
cd bank-of-celo
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
Copy `.env.example` to `.env.local` and configure:
```bash
# Farcaster Auth
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Neynar API
NEYNAR_API_KEY="your-neynar-api-key"

# Convex
CONVEX_DEPLOYMENT="your-convex-deployment"
NEXT_PUBLIC_CONVEX_URL="your-convex-url"

# Blockchain RPCs
NEXT_PUBLIC_ALCHEMY_API_KEY="your-alchemy-key"
```

4. **Start development server**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

---

## 🗄️ Database Setup (Convex)

### **Install Convex CLI**
```bash
npm install -g convex
```

### **Initialize Convex**
```bash
npx convex dev
```

### **Deploy Functions**
```bash
npx convex deploy
```

### **Database Schema**
The app uses Convex for:
- User profiles and FID mapping
- Donation tracking and leaderboards  
- Referral system data
- Session management

---

## 🚀 Deployment

### **Vercel Deployment**
```bash
npm run deploy:vercel
```

### **Production Build**
```bash
npm run build
```

### **Environment Variables**
Ensure all production environment variables are configured in your hosting platform:
- Database connections
- API keys
- Authentication secrets
- RPC endpoints

---

## 🔐 Security Features

- **Sybil Resistance:** Farcaster quality score validation
- **Transaction Security:** EIP-712 signature verification  
- **Rate Limiting:** 24-hour claim cooldowns
- **Contract Auditing:** Multi-signature wallet controls
- **Front-end Security:** CSP headers and input validation

---

## 🌐 Live Application

**Production:** [https://bank-of-celo.vercel.app/](https://bank-of-celo.vercel.app/)

### **Getting Started as a User**
1. Connect your Farcaster account
2. Switch between Celo/Base networks as needed
3. Check your quality score for claim eligibility
4. Participate in donations, claims, jackpots, or savings

---

## 🧪 Testing

### **Local Testing**
```bash
# Run linter
npm run lint

# Type checking
npm run type-check

# Build verification
npm run build
```

### **Network Testing**
- Test on Celo Alfajores testnet
- Use Base Goerli for Base network features
- Verify contract interactions with small amounts first

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow TypeScript best practices
- Use semantic commit messages
- Test on both networks before submitting
- Ensure mobile responsiveness

---

## 📊 Current Status

### **Production Ready**
✅ Home dashboard and navigation  
✅ Donation and claim systems  
✅ Jackpot/lottery functionality  
✅ Daily check-in rewards  
✅ Multi-network support  
✅ Farcaster authentication  

### **Under Development**
🚧 Fx Savings vaults (testing phase)  
🚧 Advanced reward calculations  
🚧 Enhanced leaderboard features  
🚧 Mobile app optimization  

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🏗️ Built With

- [Next.js](https://nextjs.org/) - React framework
- [Wagmi](https://wagmi.sh/) - React hooks for Ethereum
- [Viem](https://viem.sh/) - TypeScript interface for Ethereum
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Convex](https://convex.dev/) - Backend-as-a-service
- [Neynar](https://neynar.com/) - Farcaster API service

---

**Built with ❤️ for the Farcaster and Celo communities.**

*Creating the future of social DeFi, one transaction at a time.*