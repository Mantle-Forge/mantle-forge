#!/usr/bin/env node

const { Command } = require('commander');
const shell = require('shelljs');
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

// --- Parse and Run ---
program.parse(process.argv);
