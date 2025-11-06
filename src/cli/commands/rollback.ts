/**
 * FILE PURPOSE: Rollback command - Undo applied fixes
 *
 * CONTEXT: Restores files from .llm-guardian-backup files
 *
 * DEPENDENCIES:
 * - fs: File operations
 * - ora: Terminal spinners
 * - chalk: Terminal colors
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

import chalk from 'chalk';
import ora from 'ora';
import { readdirSync, copyFileSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Rollback command options
 */
export interface RollbackOptions {
  /** Delete backup files after restore (default: false) */
  cleanup?: boolean;

  /** Show list of backups without restoring (default: false) */
  list?: boolean;

  /** Specific file to rollback (default: all) */
  file?: string;
}

/**
 * Run rollback command
 *
 * WHY: Allow users to undo applied fixes if they cause issues
 * HOW: Find .llm-guardian-backup files and restore them
 *
 * @param options - Command-line options
 *
 * FLOW:
 * 1. Find all .llm-guardian-backup files
 * 2. If --list, show list and exit
 * 3. If --file, restore specific file only
 * 4. Otherwise, restore all backups
 * 5. If --cleanup, delete backup files after restore
 *
 * EXIT CODES:
 * - 0: Success
 * - 1: No backups found
 * - 2: Restore error
 */
export async function rollbackCommand(options: RollbackOptions): Promise<void> {
  try {
    // STEP 1: Find all backup files
    const backups = findBackupFiles(process.cwd());

    if (backups.length === 0) {
      console.log(chalk.yellow('⚠️  No backup files found'));
      console.log(chalk.dim('Tip: Run `llm-guardian check --fix` to create backups'));
      process.exit(0);
    }

    // STEP 2: List mode - show backups and exit
    if (options.list) {
      displayBackupList(backups);
      process.exit(0);
    }

    // STEP 3: Filter by specific file (if --file provided)
    let backupsToRestore = backups;

    if (options.file) {
      const targetFile = options.file; // Capture for closure
      backupsToRestore = backups.filter(b =>
        b.original === targetFile || b.original.endsWith(targetFile)
      );

      if (backupsToRestore.length === 0) {
        console.log(chalk.yellow(`⚠️  No backup found for: ${targetFile}`));
        process.exit(1);
      }
    }

    // STEP 4: Restore backups
    const spinner = ora({
      text: `Restoring ${backupsToRestore.length} file(s) from backup...`,
      color: 'cyan',
    }).start();

    let restored = 0;
    let failed = 0;

    for (const backup of backupsToRestore) {
      try {
        // Restore file from backup
        copyFileSync(backup.backup, backup.original);
        restored++;

        // Delete backup if --cleanup
        if (options.cleanup) {
          unlinkSync(backup.backup);
        }
      } catch (error) {
        failed++;
        console.error(chalk.red(`Failed to restore ${backup.original}:`), error);
      }
    }

    if (restored > 0) {
      spinner.succeed(
        chalk.green(`✅ Restored ${restored} file(s) from backup`)
      );

      if (options.cleanup) {
        console.log(chalk.dim(`   Cleanup: Deleted ${restored} backup file(s)`));
      } else {
        console.log(chalk.dim(`   Backups preserved (use --cleanup to delete)`));
      }
    } else {
      spinner.fail(chalk.red(`❌ Failed to restore files`));
    }

    if (failed > 0) {
      console.log(chalk.yellow(`⚠️  ${failed} file(s) failed to restore`));
    }

    // Summary
    console.log('');
    console.log(chalk.bold('📊 Rollback Summary'));
    console.log(chalk.dim('━'.repeat(50)));
    console.log(chalk.dim(`Restored: ${restored} file(s)`));
    console.log(chalk.dim(`Failed: ${failed} file(s)`));
    console.log(chalk.dim(`Backups ${options.cleanup ? 'deleted' : 'preserved'}`));
    console.log('');

    process.exit(failed > 0 ? 2 : 0);

  } catch (error) {
    console.error(chalk.red('\n❌ Error during rollback:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(2);
  }
}

/**
 * Find all backup files recursively
 *
 * WHY: Locate .llm-guardian-backup files in project
 * HOW: Recursive directory traversal
 *
 * @param dir - Directory to search
 * @returns Array of backup file info
 */
function findBackupFiles(dir: string): BackupFile[] {
  const backups: BackupFile[] = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      // Skip node_modules, .git, dist, etc.
      if (entry.isDirectory()) {
        if (shouldSkipDirectory(entry.name)) {
          continue;
        }
        backups.push(...findBackupFiles(fullPath));
      }

      // Check if file is a backup
      if (entry.isFile() && entry.name.endsWith('.llm-guardian-backup')) {
        const original = fullPath.replace('.llm-guardian-backup', '');
        const stats = statSync(fullPath);

        backups.push({
          original,
          backup: fullPath,
          size: stats.size,
          modified: stats.mtime,
        });
      }
    }

    return backups;

  } catch (error) {
    console.error(chalk.yellow(`Warning: Could not read directory ${dir}`));
    return backups;
  }
}

/**
 * Check if directory should be skipped
 *
 * @param dirName - Directory name
 * @returns true if should skip
 */
function shouldSkipDirectory(dirName: string): boolean {
  const skipDirs = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.next',
    '.cache',
    'out',
  ];

  return skipDirs.includes(dirName);
}

/**
 * Display list of backup files
 *
 * @param backups - Backup file info
 */
function displayBackupList(backups: BackupFile[]): void {
  console.log(chalk.bold('\n📋 Backup Files\n'));

  for (const backup of backups) {
    const relPath = backup.original.replace(process.cwd() + '/', '');
    const sizeKb = (backup.size / 1024).toFixed(2);
    const modified = backup.modified.toLocaleString();

    console.log(chalk.cyan('📄 ') + chalk.bold(relPath));
    console.log(chalk.dim(`   Size: ${sizeKb} KB`));
    console.log(chalk.dim(`   Modified: ${modified}`));
    console.log('');
  }

  console.log(chalk.dim(`Total: ${backups.length} backup file(s)`));
  console.log(chalk.dim(`\nUse \`llm-guardian rollback\` to restore all`));
  console.log(chalk.dim(`Use \`llm-guardian rollback --file <path>\` to restore specific file`));
  console.log('');
}

/**
 * Backup file information
 */
interface BackupFile {
  /** Original file path */
  original: string;

  /** Backup file path */
  backup: string;

  /** File size in bytes */
  size: number;

  /** Last modified date */
  modified: Date;
}
