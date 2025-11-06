#!/usr/bin/env node

/**
 * FILE PURPOSE: CLI entry point for LLM Guardian
 *
 * CONTEXT: Provides command-line interface for running detectors,
 * installing git hooks, and managing configuration.
 *
 * DEPENDENCIES:
 * - commander: CLI framework
 * - chalk: Terminal colors
 * - package.json: Version info
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Commands
import { checkCommand } from './commands/check.js';
import { initCommand } from './commands/init.js';
import { configCommand } from './commands/config.js';

/**
 * Get package version from package.json
 *
 * WHY: Display version in CLI help
 * HOW: Read package.json from project root
 */
function getVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packagePath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return packageJson.version || '0.0.0';
  } catch (error) {
    return '0.0.0';
  }
}

/**
 * Main CLI program
 *
 * WHY: Entry point for all LLM Guardian CLI commands
 * HOW: Uses Commander.js for command parsing and routing
 *
 * COMMANDS:
 * - check: Run detectors on staged files
 * - init: Install git pre-commit hook
 * - config: Show/modify configuration
 */
const program = new Command();

program
  .name('llm-guardian')
  .description(chalk.bold('🛡️  LLM Guardian - Catch LLM mistakes before they reach prod'))
  .version(getVersion(), '-v, --version', 'Display version number')
  .helpOption('-h, --help', 'Display help information');

// Check command: Run detectors manually
program
  .command('check')
  .description('Run detectors on staged files (or all files with --all)')
  .option('-a, --all', 'Check all files in project (not just staged)')
  .option('--detectors <names>', 'Comma-separated list of detectors to run (default: all)')
  .option('--json', 'Output results as JSON')
  .option('--no-color', 'Disable colored output')
  .action(checkCommand);

// Init command: Install git hook
program
  .command('init')
  .description('Install LLM Guardian as a git pre-commit hook')
  .option('-f, --force', 'Overwrite existing hook if present')
  .option('--blocking', 'Make hook blocking (prevents commit on issues)')
  .action(initCommand);

// Config command: Show/modify configuration
program
  .command('config')
  .description('Show or modify LLM Guardian configuration')
  .argument('[key]', 'Configuration key to get/set')
  .argument('[value]', 'Value to set (omit to get current value)')
  .option('--list', 'List all configuration options')
  .option('--reset', 'Reset configuration to defaults')
  .action(configCommand);

/**
 * Error handler for uncaught errors
 *
 * WHY: Provide user-friendly error messages
 * HOW: Catch errors, format, exit with code 1
 */
program.exitOverride((err) => {
  if (err.code === 'commander.version') {
    console.log(getVersion());
    process.exit(0);
  }
  if (err.code === 'commander.helpDisplayed') {
    process.exit(0);
  }
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});

// Parse command-line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
