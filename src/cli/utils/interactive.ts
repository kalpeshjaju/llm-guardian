/**
 * FILE PURPOSE: Interactive mode utilities
 *
 * CONTEXT: Provides user prompts for reviewing and confirming fixes
 *
 * DEPENDENCIES:
 * - prompts: Interactive CLI prompts
 * - chalk: Terminal colors
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

import prompts from 'prompts';
import chalk from 'chalk';
import type { Issue } from '../../detectors/types.js';

/**
 * Interactive review result
 */
export interface ReviewResult {
  /** Issues approved for fixing */
  approved: Issue[];

  /** Issues rejected (not fixed) */
  rejected: Issue[];

  /** Whether user cancelled */
  cancelled: boolean;
}

/**
 * Review issues interactively before applying fixes
 *
 * WHY: Give users control over which fixes to apply
 * HOW: Show each issue with fix preview, ask user to approve/reject
 *
 * @param issues - Issues with fixes to review
 * @returns Review result (approved, rejected, cancelled)
 *
 * FLOW:
 * 1. Show summary of issues
 * 2. For each issue:
 *    a. Display issue details
 *    b. Show fix preview (search → replace)
 *    c. Ask user: Apply fix? (yes/no/all/none)
 * 3. Return approved and rejected issues
 *
 * USER INTERACTIONS:
 * - 'y' or 'yes': Apply this fix
 * - 'n' or 'no': Skip this fix
 * - 'a' or 'all': Apply this and all remaining fixes
 * - 'q' or 'none': Skip this and all remaining fixes
 *
 * EXAMPLE:
 * ```typescript
 * const result = await reviewFixes(issues);
 * if (!result.cancelled) {
 *   await solver.applyFixes(result.approved);
 * }
 * ```
 */
export async function reviewFixes(issues: Issue[]): Promise<ReviewResult> {
  const approved: Issue[] = [];
  const rejected: Issue[] = [];

  try {
    // Filter issues that have fixes
    const fixableIssues = issues.filter(i => i.fix && i.fix.search && i.fix.replace);

    if (fixableIssues.length === 0) {
      console.log(chalk.yellow('⚠️  No fixable issues found'));
      return { approved, rejected, cancelled: false };
    }

    // Show summary
    console.log('\n' + chalk.bold('🔍 Interactive Fix Review'));
    console.log(chalk.dim('━'.repeat(50)));
    console.log(chalk.dim(`Found ${fixableIssues.length} fixable issue(s)`));
    console.log(chalk.dim(`Review each fix before applying\n`));

    let applyAll = false;
    let skipAll = false;

    // Review each issue
    for (let i = 0; i < fixableIssues.length; i++) {
      const issue = fixableIssues[i];

      // Safety check (should never happen in valid for loop)
      if (!issue) continue;

      // Skip if user chose "apply all" or "skip all"
      if (applyAll) {
        approved.push(issue);
        continue;
      }

      if (skipAll) {
        rejected.push(issue);
        continue;
      }

      // Display issue
      console.log(chalk.bold(`\n[${i + 1}/${fixableIssues.length}] ${getSeverityIcon(issue.severity)} ${issue.message}`));
      console.log(chalk.dim(`  File: ${issue.filePath}:${issue.line}`));
      console.log(chalk.dim(`  Category: ${issue.category}`));

      // Show fix details
      if (issue.fix) {
        const confidencePercent = issue.fix.confidence
          ? Math.round(issue.fix.confidence * 100)
          : 100;

        console.log(chalk.dim(`  Confidence: ${confidencePercent}%`));

        if (issue.fix.explanation) {
          console.log(chalk.cyan(`  💡 ${issue.fix.explanation}`));
        }

        // Show fix preview
        const searchStr = typeof issue.fix.search === 'string'
          ? issue.fix.search
          : issue.fix.search.source;

        const searchPreview = searchStr.length > 80
          ? searchStr.substring(0, 77) + '...'
          : searchStr;

        const replacePreview = issue.fix.replace.length > 80
          ? issue.fix.replace.substring(0, 77) + '...'
          : issue.fix.replace;

        console.log(chalk.red(`  - ${searchPreview}`));
        console.log(chalk.green(`  + ${replacePreview}`));
      }

      // Ask user
      const response = await prompts({
        type: 'select',
        name: 'action',
        message: 'Apply this fix?',
        choices: [
          { title: 'Yes', value: 'yes', description: 'Apply this fix' },
          { title: 'No', value: 'no', description: 'Skip this fix' },
          { title: 'All', value: 'all', description: 'Apply this and all remaining fixes' },
          { title: 'None', value: 'none', description: 'Skip this and all remaining fixes' },
          { title: 'Quit', value: 'quit', description: 'Cancel and exit' },
        ],
        initial: 0,
      });

      // Handle response
      if (!response.action || response.action === 'quit') {
        console.log(chalk.yellow('\n⚠️  Interactive review cancelled'));
        return { approved, rejected, cancelled: true };
      }

      switch (response.action) {
        case 'yes':
          approved.push(issue);
          console.log(chalk.green('  ✓ Fix approved'));
          break;

        case 'no':
          rejected.push(issue);
          console.log(chalk.dim('  ⨯ Fix skipped'));
          break;

        case 'all':
          approved.push(issue);
          applyAll = true;
          console.log(chalk.green('  ✓ Fix approved (applying all remaining)'));
          break;

        case 'none':
          rejected.push(issue);
          skipAll = true;
          console.log(chalk.dim('  ⨯ Fix skipped (skipping all remaining)'));
          break;
      }
    }

    // Summary
    console.log('\n' + chalk.bold('📊 Review Summary'));
    console.log(chalk.dim('━'.repeat(50)));
    console.log(chalk.green(`  Approved: ${approved.length} fix(es)`));
    console.log(chalk.yellow(`  Rejected: ${rejected.length} fix(es)`));
    console.log('');

    return { approved, rejected, cancelled: false };

  } catch (error) {
    console.error(chalk.red('Interactive review error:'), error);
    return { approved, rejected, cancelled: true };
  }
}

/**
 * Get severity icon
 *
 * @param severity - Issue severity
 * @returns Emoji icon
 */
function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'critical':
      return '❌';
    case 'high':
      return '⚠️';
    case 'medium':
      return '⚡';
    case 'low':
      return '💡';
    default:
      return '•';
  }
}

/**
 * Confirm action with user
 *
 * WHY: Get user confirmation before destructive operations
 * HOW: Simple yes/no prompt
 *
 * @param message - Confirmation message
 * @param defaultValue - Default answer (default: false)
 * @returns true if user confirmed
 *
 * EXAMPLE:
 * ```typescript
 * const confirmed = await confirmAction('Delete all backups?');
 * if (confirmed) {
 *   deleteBackups();
 * }
 * ```
 */
export async function confirmAction(
  message: string,
  defaultValue: boolean = false
): Promise<boolean> {
  try {
    const response = await prompts({
      type: 'confirm',
      name: 'confirmed',
      message,
      initial: defaultValue,
    });

    return response.confirmed || false;

  } catch (error) {
    return false;
  }
}
