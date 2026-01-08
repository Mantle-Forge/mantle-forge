#!/usr/bin/env node

const { Command } = require('commander');
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
    console.log(`   ${chalk.cyan('git push origin main')}`);
    console.log(`   Your agent will be deployed automatically!`);
  });

// --- Parse and Run ---
program.parse(process.argv);
