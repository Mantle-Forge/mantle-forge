#!/usr/bin/env node

const { Command } = require('commander');

const program = new Command();
program.name('mantle-forge');
program.version('0.1.0');

// --- Parse and Run ---
program.parse(process.argv);
