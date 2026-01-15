# MantleForge CLI

**Deploy AI Agents on Mantle with Git** - Professional command-line interface for the MantleForge deployment platform.

MantleForge transforms AI agent deployment into a seamless Git-native workflow. Deploy autonomous agents to Mantle Sepolia testnet with a single `git push`. Each branch becomes a unique smart contract, enabling truly parallel A/B testing of trading strategies.

## Installation

### Quick Install (For Users)

**Option 1: Install from npm (Recommended)**
```bash
npm install -g mantle-forge

# Start using MantleForge CLI
mantle-forge stats
mantle-forge compare main aggressive
```

**Option 2: Install from source (Development)**
```bash
git clone https://github.com/Mantle-Forge/mantle-forge.git
cd mantle-forge
npm install
```

### Development
```bash
npm link
```

## CLI Commands

* `npx mantle-forge init` - Configure MantleForge deployment pipeline for your repository
* `npx mantle-forge secrets set <KEY=VALUE>` - Store encrypted secrets for the current branch (e.g., `GROQ_API_KEY=sk-...`)
* `npx mantle-forge secrets check` - Verify which secrets are configured for your agent
* `npx mantle-forge stats` - Display real-time performance metrics from your Mantle agent
* `npx mantle-forge logs` - Stream the latest 50 log entries from your agent process
* `npx mantle-forge compare <branch1> <branch2>` - Side-by-side comparison of two agent strategies
* `npx mantle-forge restart` - Restart the agent for the current branch

You can use `npx mantle-forge` directly as shown above.

## Key Features

- 🚀 **One-Command Setup**: Interactive initialization that configures everything automatically
- 🔐 **Enterprise-Grade Security**: AES-256 encrypted secret storage, one set per Git branch
- 📊 **Live Performance Tracking**: Real-time metrics from agents executing on Mantle Sepolia
- 🔄 **Parallel Strategy Testing**: Compare multiple trading strategies running simultaneously
- ⛓️ **Native Mantle Integration**: Built specifically for Mantle's Layer 2 infrastructure
- 🎨 **Developer-Friendly UX**: Color-coded terminal output with clear, actionable feedback
- ⚡ **Lightweight & Fast**: Minimal dependencies, instant command execution

## Mantle Sepolia Integration

MantleForge leverages Mantle's high-performance Layer 2 infrastructure to deploy and manage AI agents:

- **Smart Contract Deployment**: Each Git branch deploys as a unique `Agent.sol` contract on Mantle Sepolia
- **On-Chain Identity**: Every agent has a permanent contract address on Mantle blockchain
- **DEX Integration**: Agents execute real trades on Mantle-compatible decentralized exchanges
- **Factory Pattern**: Centralized `AgentFactory` contract manages all agent deployments
- **Blockchain-Backed Registry**: Agent addresses persist on-chain, surviving backend failures

## Usage

### Initialize Repository for Mantle Deployment

```bash
npx mantle-forge init
```

The initialization process:
- Creates `.gitagent.json` configuration file in your repository root
- Prompts for GitHub repository URL (used for webhook auto-configuration)
- Provides step-by-step instructions for connecting to MantleForge backend
- Guides you through secret management and first deployment workflow

### Configure Agent Secrets

```bash
npx mantle-forge secrets set GROQ_API_KEY=sk-your-key-here
npx mantle-forge secrets set AGENT_PRIVATE_KEY=0x...
npx mantle-forge secrets set AI_PROMPT="You are an aggressive trader"
```

**Security Features:**
- Secrets are encrypted using AES-256 before storage
- Each Git branch maintains its own isolated secret set
- Secrets are automatically injected as environment variables when agents deploy to Mantle
- Never stored in plaintext - all encryption handled by MantleForge backend

### Monitor Agent Performance

```bash
npx mantle-forge stats    # View comprehensive performance metrics
npx mantle-forge logs     # Stream real-time agent decision logs
```

The `stats` command displays:
- Total trading decisions made
- BUY vs HOLD signal breakdown
- Number of executed trades
- Success rate percentage
- Price statistics (average, min, max)
- Activity timeline (first/last decision timestamps)

### Compare Trading Strategies

Run parallel A/B tests by comparing different Git branches deployed as separate Mantle contracts:
```bash
npx mantle-forge compare branch1 branch2
```

**Comparison Metrics:**
- Decision volume (total decisions per strategy)
- Signal distribution (BUY vs HOLD ratios)
- Trade execution counts
- Win rate percentages
- Average trading prices
- Performance winner analysis

Perfect for testing different AI prompts, trading thresholds, or risk parameters across multiple Mantle agent contracts simultaneously.

## Configuration

The CLI creates a `.mantlepush.json` file in your repository root:

```json
{
  "repo_url": "https://github.com/username/repo.git"
}
```

## Development

To test the CLI locally:

```bash
npm link
mantle-forge --help
```

## About MantleForge

MantleForge is a Git-native deployment platform built specifically for Mantle Network. It brings the simplicity of Vercel-style deployments to blockchain AI agents, making Mantle the easiest network to deploy autonomous agents on.

**Key Benefits:**
- ⚡ **30-second deployments** - From `git push` to live on-chain agent
- 🔄 **Branch-based A/B testing** - Test multiple strategies simultaneously
- 🔒 **Enterprise security** - Encrypted secrets, on-chain identity
- 📊 **Real-time monitoring** - CLI and web dashboard for agent metrics

**Repository**: https://github.com/Mantle-Forge/mantle-forge  
**Live Dashboard**: https://mantle-git-agent.onrender.com/dashboard  
**Mantle Explorer**: https://sepolia.mantlescan.xyz

## Requirements

- **Node.js** 16+ (for CLI tool)
- **Git** repository (for version control)
- **MantleForge Backend** (deployed at https://mantle-git-agent.onrender.com or self-hosted)
- **Mantle Sepolia Testnet** access (for contract deployment)
