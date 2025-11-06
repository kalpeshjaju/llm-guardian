/**
 * FILE PURPOSE: Config command - Manage configuration
 *
 * CONTEXT: Show and modify LLM Guardian configuration.
 * Configuration stored in .llm-guardian.json in project root.
 *
 * DEPENDENCIES:
 * - fs: Read/write config file
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

import chalk from 'chalk';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getGitRoot, isGitRepository } from '../utils/git.js';

/**
 * Config command options
 */
interface ConfigOptions {
  list?: boolean;
  reset?: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  detectors: {
    hallucination: {
      enabled: true,
      severity: 'critical',
    },
    'code-quality': {
      enabled: true,
      maxFileLines: 600,
      maxFunctionLines: 150,
      warnAnyCount: 3,
    },
  },
  output: {
    colorize: true,
    verbose: false,
  },
  git: {
    hookMode: 'non-blocking',
  },
};

/**
 * Run config command
 *
 * WHY: Allow users to customize LLM Guardian behavior
 * HOW: Read/write .llm-guardian.json config file
 *
 * @param key - Config key to get/set (e.g., 'detectors.hallucination.enabled')
 * @param value - Value to set (omit to get)
 * @param options - Command options
 *
 * USAGE:
 * ```bash
 * llm-guardian config --list                              # List all config
 * llm-guardian config detectors.hallucination.enabled     # Get value
 * llm-guardian config detectors.hallucination.enabled false  # Set value
 * llm-guardian config --reset                            # Reset to defaults
 * ```
 */
export async function configCommand(
  key?: string,
  value?: string,
  options?: ConfigOptions
): Promise<void> {
  try {
    // Verify git repository
    if (!isGitRepository()) {
      console.error(chalk.red('❌ Not a git repository'));
      console.error(chalk.dim('LLM Guardian requires git for configuration'));
      process.exit(1);
    }

    const gitRoot = getGitRoot();
    const configPath = join(gitRoot, '.llm-guardian.json');

    // Load existing config or use defaults
    let config = DEFAULT_CONFIG;
    if (existsSync(configPath)) {
      try {
        const configContent = readFileSync(configPath, 'utf-8');
        config = JSON.parse(configContent);
      } catch (error) {
        console.error(chalk.red('❌ Failed to parse config file'));
        console.error(chalk.dim(`Path: ${configPath}`));
        process.exit(1);
      }
    }

    // Handle --reset flag
    if (options?.reset) {
      writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
      console.log(chalk.green('✅ Configuration reset to defaults'));
      console.log(chalk.dim(`Path: ${configPath}\n`));
      return;
    }

    // Handle --list flag
    if (options?.list || (!key && !value)) {
      console.log(chalk.bold('🛡️  LLM Guardian Configuration'));
      console.log(chalk.dim('━'.repeat(50)));
      console.log(JSON.stringify(config, null, 2));
      console.log('');
      console.log(chalk.dim(`Path: ${configPath}`));
      console.log(chalk.dim('Edit file directly or use: llm-guardian config <key> <value>\n'));
      return;
    }

    // Get specific key
    if (key && !value) {
      const val = getConfigValue(config, key);
      if (val === undefined) {
        console.error(chalk.red(`❌ Config key not found: ${key}`));
        process.exit(1);
      }
      console.log(chalk.dim(`${key}:`), val);
      return;
    }

    // Set specific key
    if (key && value) {
      setConfigValue(config, key, parseConfigValue(value));
      writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      console.log(chalk.green(`✅ Updated ${key} = ${value}`));
      console.log(chalk.dim(`Path: ${configPath}\n`));
      return;
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Config command failed:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

/**
 * Get config value by dot-notation key
 *
 * WHY: Support nested config keys (e.g., 'detectors.hallucination.enabled')
 * HOW: Split key by dots, traverse object
 *
 * @param config - Config object
 * @param key - Dot-notation key
 * @returns Value or undefined
 */
function getConfigValue(config: any, key: string): any {
  const parts = key.split('.');
  let current = config;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Set config value by dot-notation key
 *
 * WHY: Support nested config keys
 * HOW: Split key by dots, create intermediate objects if needed
 *
 * @param config - Config object (mutated in place)
 * @param key - Dot-notation key
 * @param value - Value to set
 */
function setConfigValue(config: any, key: string, value: any): void {
  const parts = key.split('.');
  let current = config;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!part) continue;

    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }

  const lastPart = parts[parts.length - 1];
  if (lastPart) {
    current[lastPart] = value;
  }
}

/**
 * Parse config value from string
 *
 * WHY: CLI arguments are strings, need to parse booleans/numbers
 * HOW: Try parsing as JSON, fallback to string
 *
 * @param value - String value from CLI
 * @returns Parsed value
 *
 * EXAMPLES:
 * - "true" → true
 * - "false" → false
 * - "123" → 123
 * - "foo" → "foo"
 */
function parseConfigValue(value: string): any {
  // Try parsing as JSON (handles booleans, numbers, etc.)
  try {
    return JSON.parse(value);
  } catch {
    // Fallback to string
    return value;
  }
}
