#!/usr/bin/env node

const { Command } = require('commander');
const axios = require('axios');
const shell = require('shelljs');
const { createPromptModule } = require('inquirer');
const prompt = createPromptModule();
const chalk = require('chalk');
const fs = require('fs');

const program = new Command();
program.name('mantle-forge');
program.version('0.1.0');

// --- Configuration ---
const API_BASE_URL = 'https://mantle-git-agent.onrender.com';
const CONFIG_FILE = '.mantlepush.json';

// --- Helper Functions ---

// Reads the .mantlepush.json file
function getConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  }
  
  console.error(chalk.red(`Error: This repository is not configured for MantleForge. Missing ${CONFIG_FILE}.`));
  console.log(chalk.yellow('Run `mantle-forge init` to initialize MantleForge in this repository.'));
  process.exit(1);
}

// Gets the current git branch
function getCurrentBranch() {
  const branch = shell.exec('git rev-parse --abbrev-ref HEAD', { silent: true }).stdout.trim();
  if (!branch) {
    console.error(chalk.red('Error: Could not determine git branch.'));
    process.exit(1);
  }
  return branch;
}

// Calculate branch_hash (same as backend)
const { ethers } = require('ethers');

function calculateBranchHash(repo_url, branch_name) {
  return ethers.id(repo_url + "/" + branch_name);
}

// Helper function to fetch stats for a specific branch
async function getStats(repo_url, branch_name) {
  try {
    const branch_hash = calculateBranchHash(repo_url, branch_name);
    const url = `${API_BASE_URL}/api/stats/${branch_hash}`;
    const { data } = await axios.get(url);
    return { ...data, branch_name, repo_url };
  } catch (err) {
    const errorMsg = err.response?.data?.error || err.message;
    if (err.response?.status === 404) {
      console.error(chalk.red(`Agent not found for branch "${branch_name}"`));
    } else {
      console.error(chalk.red(`Error fetching stats for ${branch_name}: ${errorMsg}`));
    }
    return null;
  }
}

// --- CLI Commands ---

/**
 * INIT - Initialize MantleForge for this repository
 */
program
  .command('init')
  .description('Initialize MantleForge deployment pipeline for this repository')
  .action(async () => {
    if (fs.existsSync(CONFIG_FILE)) {
      const existingConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      console.log(chalk.yellow(`This project is already initialized.`));
      console.log(chalk.cyan(`Current repository: ${existingConfig.repo_url}`));
      console.log(chalk.yellow(`\nTo reinitialize with a different repository, delete ${CONFIG_FILE} first.`));
      return;
    }

    const answers = await prompt([
      {
        type: 'input',
        name: 'repo_url',
        message: 'What is your GitHub repository URL (e.g., https://github.com/user/repo.git)?',
        default: shell.exec('git remote get-url origin', { silent: true }).stdout.trim(),
      }
    ]);

    if (!answers.repo_url) {
      console.error(chalk.red('Error: Repository URL is required.'));
      return;
    }

    const config = { repo_url: answers.repo_url };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

    console.log(chalk.green(`✅ ${CONFIG_FILE} created.`));
    console.log('');
    console.log(chalk.bold('📋 Next Steps:'));
    console.log('');
    
    const repoUrl = answers.repo_url;
    const oauthUrl = `https://mantle-git-agent.onrender.com/auth/github?repo_url=${encodeURIComponent(repoUrl)}`;
    
    console.log(chalk.cyan('🚀 Option A: Automatic Webhook Configuration (Recommended)'));
    console.log(`   Visit: ${chalk.underline(oauthUrl)}`);
    console.log(`   Authorize GitHub to automatically set up deployment webhooks`);
    console.log('');
    
    console.log(chalk.yellow('⚙️  Option B: Manual Webhook Configuration'));
    console.log(`   Navigate to: GitHub → ${answers.repo_url.split('/').slice(-2).join('/')} → Settings → Webhooks`);
    console.log(`   Webhook URL: ${chalk.cyan('https://mantle-git-agent.onrender.com/webhook/github/push')}`);
    console.log(`   Content type: ${chalk.cyan('application/json')}`);
    console.log(`   Events: ${chalk.cyan('Just the push event')}`);
    console.log('');
    
    console.log(chalk.bold('🔐 Configure Agent Secrets:'));
    console.log(`   ${chalk.cyan('mantle-forge secrets set GROQ_API_KEY=your-key-here')}`);
    console.log(`   ${chalk.cyan('mantle-forge secrets set AGENT_PRIVATE_KEY=0x...')}`);
    console.log(`   These secrets are encrypted and securely stored for each branch`);
    console.log('');
    
    console.log(chalk.bold('🚀 Deploy to Mantle Sepolia:'));
    console.log(`   ${chalk.cyan('git push origin main')}`);
    console.log(`   Each push automatically deploys a new smart contract on Mantle Sepolia testnet`);
    console.log(`   Your agent will be live on-chain within 30 seconds!`);
    console.log('');
    
    console.log(chalk.bold('📊 Monitor Your Agents:'));
    console.log(`   ${chalk.cyan('mantle-forge stats')} - View real-time performance metrics`);
    console.log(`   ${chalk.cyan('mantle-forge logs')} - Stream live agent decision logs`);
    console.log(`   Web Dashboard: ${chalk.underline('https://mantle-git-agent.onrender.com/dashboard')}`);
  });

/**
 * SECRETS - Manage secrets for the current branch
 */
const secretsCommand = program
  .command('secrets')
  .description('Manage secrets for the current branch');

// SECRETS SET - Set a secret
secretsCommand
  .command('set <KEY_VALUE>')
  .description('Set a secret for the current branch (e.g., KEY=VALUE)')
  .action(async (keyValue) => {
    const fullCommand = process.argv.slice(2).join(' ');
    const match = fullCommand.match(/secrets set (.+)/);
    
    if (!match) {
      console.error(chalk.red('Error: Invalid format. Use KEY=VALUE'));
      return;
    }
    
    const keyValueStr = match[1];
    const [key, ...valueParts] = keyValueStr.split('=');
    const value = valueParts.join('=');

    if (!key || !value) {
      console.error(chalk.red('Error: Invalid format. Use KEY=VALUE'));
      return;
    }

    const config = getConfig();
    const branch_name = getCurrentBranch();

    try {
      console.log(chalk.cyan(`Setting secret ${key} for branch ${branch_name}...`));
      await axios.post(`${API_BASE_URL}/api/secrets`, {
        repo_url: config.repo_url,
        branch_name: branch_name,
        key: key,
        value: value,
      });
      console.log(chalk.green(`✅ Secret ${key} set.`));
    } catch (err) {
      console.error(chalk.red(`Error setting secret: ${err.response?.data?.error || err.message}`));
    }
  });

// SECRETS CHECK - Check which secrets are set
secretsCommand
  .command('check')
  .description('Check which required secrets are set for the current branch')
  .action(async () => {
    const config = getConfig();
    const branch_name = getCurrentBranch();
    const branch_hash = calculateBranchHash(config.repo_url, branch_name);

    try {
      console.log(chalk.cyan(`🔍 Checking secrets for branch: ${chalk.bold(branch_name)}...`));
      const { data } = await axios.get(`${API_BASE_URL}/api/secrets/check/${branch_hash}`);
      
      console.log(chalk.bold(`\n--- Secrets Status for ${branch_name} ---`));
      
      // Required secrets
      console.log(chalk.bold('\n📋 Required Secrets:'));
      data.secrets.required.forEach(secret => {
        const status = secret.set ? chalk.green('✅ Set') : chalk.red('❌ Missing');
        console.log(`  ${status} ${chalk.bold(secret.key)}`);
      });
      
      // Overall status
      console.log(chalk.bold('\n📊 Status:'));
      if (data.all_required_set) {
        console.log(chalk.green(`  ✅ All required secrets are set! Agent is ready to run.`));
      } else {
        console.log(chalk.red(`  ❌ Missing required secrets: ${chalk.bold(data.missing.join(', '))}`));
      }
      
    } catch (err) {
      if (err.response?.status === 404) {
        console.error(chalk.red(`Agent not found for branch "${branch_name}"`));
        console.log(chalk.yellow(`  → Make sure you've pushed this branch`));
      } else {
        console.error(chalk.red(`Error checking secrets: ${err.response?.data?.error || err.message}`));
      }
    }
  });

/**
 * STATS - View agent performance metrics
 */
program
  .command('stats')
  .description('View real-time performance metrics for your Mantle agent')
  .action(async () => {
    const config = getConfig();
    const branch_name = getCurrentBranch();

    console.log(chalk.cyan(`📊 Fetching stats for ${branch_name}...`));
    const result = await getStats(config.repo_url, branch_name);

    if (!result) {
      console.log(chalk.yellow(`\n⚠️  Could not fetch stats for "${branch_name}"`));
      return;
    }

    if (result && result.stats) {
      const s = result.stats;
      const totalDecisions = s.total_decisions || 0;
      
      console.log(chalk.bold(`\n--- Mantle Agent Performance: ${branch_name} ---`));
      console.log(chalk.green(`  Total Decisions:  ${totalDecisions}`));
      console.log(chalk.cyan(`  BUY Signals:     ${s.buy_count || 0}`));
      console.log(chalk.yellow(`  HOLD Signals:    ${s.hold_count || 0}`));
      console.log(chalk.magenta(`  Trades Executed: ${s.trades_executed || 0}`));
      
      if (totalDecisions === 0) {
        console.log(chalk.yellow(`\n⚠️  No trading decisions recorded yet.`));
        return;
      }
      
      if (s.avg_price) {
        console.log(`\n  Price Statistics:`);
        console.log(`    Average: $${parseFloat(s.avg_price).toFixed(4)}`);
        console.log(`    Min:     $${parseFloat(s.min_price).toFixed(4)}`);
        console.log(`    Max:     $${parseFloat(s.max_price).toFixed(4)}`);
      }
      
      if (s.trades_executed > 0 && totalDecisions > 0) {
        const successRate = ((s.trades_executed / totalDecisions) * 100).toFixed(1);
        console.log(chalk.green(`\n  Success Rate: ${successRate}%`));
      }
    } else {
      console.log(chalk.yellow('No performance metrics available yet.'));
    }
  });

/**
 * LOGS - Stream agent logs
 */
program
  .command('logs')
  .description('Stream real-time logs from your Mantle agent process')
  .action(async () => {
    const config = getConfig();
    const branch_name = getCurrentBranch();

    try {
      console.log(chalk.cyan(`Fetching logs for ${branch_name}...`));
      const url = `${API_BASE_URL}/api/logs/${encodeURIComponent(config.repo_url)}/${encodeURIComponent(branch_name)}`;
      const { data } = await axios.get(url);

      console.log(chalk.bold(`--- Recent Agent Logs: ${branch_name} (Last 50 entries) ---`));
      if (data.logs && data.logs.length > 0) {
        data.logs.forEach(line => console.log(line));
      } else {
        console.log(chalk.yellow('No logs found.'));
      }
    } catch (err) {
      console.error(chalk.red(`Error fetching logs: ${err.response?.data?.error || err.message}`));
    }
  });

/**
 * RESTART - Restart the agent
 */
program
  .command('restart')
  .description('Restart the Mantle agent for the current branch')
  .action(async () => {
    const config = getConfig();
    const branch_name = getCurrentBranch();
    const branch_hash = calculateBranchHash(config.repo_url, branch_name);

    try {
      console.log(chalk.cyan(`🔄 Restarting agent for branch: ${chalk.bold(branch_name)}...`));
      const url = `${API_BASE_URL}/api/agents/branch/${branch_hash}/restart`;
      const { data } = await axios.post(url);

      if (data.success) {
        console.log(chalk.green(`✅ Agent restarted successfully!`));
        console.log(chalk.gray(`   Branch: ${data.agent?.branch_name || branch_name}`));
        console.log(chalk.cyan(`\n💡 The agent will reload with the latest code and secrets.`));
      } else {
        console.log(chalk.yellow(`⚠️  Restart response: ${JSON.stringify(data)}`));
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      if (err.response?.status === 404) {
        console.error(chalk.red(`Agent not found for branch "${branch_name}"`));
      } else {
        console.error(chalk.red(`Error restarting agent: ${errorMsg}`));
      }
    }
  });

/**
 * COMPARE - Compare two branches
 */
program
  .command('compare <branch1> <branch2>')
  .description('Compare performance metrics between two agent strategies on Mantle')
  .action(async (branch1, branch2) => {
    const config = getConfig();

    console.log(chalk.cyan(`📊 Comparing strategies: ${chalk.bold(branch1)} vs ${chalk.bold(branch2)}...`));

    const [result1, result2] = await Promise.all([
      getStats(config.repo_url, branch1),
      getStats(config.repo_url, branch2)
    ]);

    if (!result1 || !result2) {
      console.error(chalk.red('Could not fetch stats for comparison.'));
      return;
    }

    if (!result1.stats || !result2.stats) {
      console.log(chalk.yellow('\n⚠️  One or both agents have no metrics yet.'));
      return;
    }

    const s1 = result1.stats;
    const s2 = result2.stats;

    // Helper function to strip ANSI codes for width calculation
    const stripAnsi = (str) => str.replace(/\u001b\[[0-9;]*m/g, '');
    
    // Helper function to pad string accounting for ANSI codes
    const padWithAnsi = (str, width) => {
      const visibleLength = stripAnsi(str).length;
      const padding = Math.max(0, width - visibleLength);
      return str + ' '.repeat(padding);
    };

    console.log(chalk.bold('\n╔═════════════════════╦═══════════════════════════╦════════════════════════════╗'));
    const titleText = '  Strategy Comparison';
    const titlePadding = 78 - titleText.length;
    console.log(chalk.bold(`║${titleText}${' '.repeat(titlePadding)}║`));
    console.log(chalk.bold('╠═════════════════════╬═══════════════════════════╬════════════════════════════╣'));
    
    // Create comparison table
    const metrics = [
      { label: 'Total Decisions', v1: s1.total_decisions || 0, v2: s2.total_decisions || 0 },
      { label: 'BUY Signals', v1: s1.buy_count || 0, v2: s2.buy_count || 0 },
      { label: 'HOLD Signals', v1: s1.hold_count || 0, v2: s2.hold_count || 0 },
      { label: 'Trades Executed', v1: s1.trades_executed || 0, v2: s2.trades_executed || 0 },
    ];

    // Header row
    const headerMetric = padWithAnsi('Metric', 19);
    const header1 = padWithAnsi(chalk.bold(branch1), 27);
    const header2 = padWithAnsi(chalk.bold(branch2), 27);
    console.log(`║ ${headerMetric}║ ${header1}║ ${header2}║`);
    console.log(chalk.bold('╠═════════════════════╬═══════════════════════════╬═══════════════════════════╣'));
    
    // Data rows
    metrics.forEach((m) => {
      const label = padWithAnsi(m.label, 19);
      const v1Str = padWithAnsi(m.v1.toString(), 27);
      const v2Str = padWithAnsi(m.v2.toString(), 27);
      console.log(`║ ${label}║ ${v1Str}║ ${v2Str}║`);
    });
    
    console.log(chalk.bold('╚═════════════════════╩═══════════════════════════╩════════════════════════════╝'));

    // Determine winner
    console.log('\n' + chalk.bold('🏆 Performance Analysis:'));
    if ((s1.trades_executed || 0) > (s2.trades_executed || 0)) {
      console.log(chalk.green(`  ${branch1} has executed more trades`));
    } else if ((s2.trades_executed || 0) > (s1.trades_executed || 0)) {
      console.log(chalk.green(`  ${branch2} has executed more trades`));
    } else {
      console.log(chalk.yellow(`  Both strategies show similar trade execution patterns`));
    }

    if (s1.total_decisions && s2.total_decisions) {
      const rate1 = (s1.trades_executed / s1.total_decisions) * 100;
      const rate2 = (s2.trades_executed / s2.total_decisions) * 100;
      if (rate1 > rate2) {
        console.log(chalk.green(`  ${branch1} has better success rate (${rate1.toFixed(1)}% vs ${rate2.toFixed(1)}%)`));
      } else if (rate2 > rate1) {
        console.log(chalk.green(`  ${branch2} has better success rate (${rate2.toFixed(1)}% vs ${rate1.toFixed(1)}%)`));
      }
    }
  });

// --- Parse and Run ---
program.parse(process.argv);
