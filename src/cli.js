import chalk from 'chalk';
import ora from 'ora';
import { 
  handleClaudeMarkdown,
  handleDirectoryMirror,
  handleSelectiveFileCopy,
  handleSingleFile
} from './fileManager.js';

/**
 * Format action result with appropriate colors and icons
 */
function formatResult(result) {
  const { action, details, filesAdded } = result;
  
  switch (action) {
    case 'created':
      return chalk.green(`✓ ${details}`);
    case 'updated':
      const fileInfo = filesAdded !== undefined ? ` (${filesAdded} files)` : '';
      return chalk.yellow(`↻ ${details}${fileInfo}`);
    case 'skipped':
      return chalk.gray(`- ${details}`);
    default:
      return details;
  }
}

/**
 * Main CLI function
 */
export async function cli() {
  const targetDir = process.cwd();
  
  console.log(chalk.blue.bold('🚀 Claude Environment Initializer'));
  console.log(chalk.gray(`Initializing in: ${targetDir}`));
  console.log();
  
  const tasks = [
    {
      name: 'CLAUDE.md',
      handler: () => handleClaudeMarkdown(targetDir)
    },
    {
      name: '.devcontainer',
      handler: () => handleDirectoryMirror(targetDir, '.devcontainer')
    },
    {
      name: '.claude/settings.json',
      handler: () => handleSingleFile(targetDir, '.claude/settings.json')
    },
    {
      name: '.claude/commands',
      handler: () => handleSelectiveFileCopy(targetDir, '.claude/commands')
    },
    {
      name: '.claude/agents',
      handler: () => handleSelectiveFileCopy(targetDir, '.claude/agents')
    }
  ];
  
  let totalActions = { created: 0, updated: 0, skipped: 0, filesAdded: 0 };
  
  for (const task of tasks) {
    const spinner = ora(`Processing ${task.name}...`).start();
    
    try {
      const result = await task.handler();
      spinner.succeed(formatResult(result));
      
      // Track statistics
      totalActions[result.action]++;
      if (result.filesAdded) {
        totalActions.filesAdded += result.filesAdded;
      }
      
    } catch (error) {
      spinner.fail(`Failed to process ${task.name}: ${error.message}`);
      throw error;
    }
  }
  
  // Summary
  console.log();
  console.log(chalk.blue.bold('📊 Summary:'));
  
  if (totalActions.created > 0) {
    console.log(chalk.green(`   Created: ${totalActions.created} items`));
  }
  
  if (totalActions.updated > 0) {
    console.log(chalk.yellow(`   Updated: ${totalActions.updated} items`));
  }
  
  if (totalActions.skipped > 0) {
    console.log(chalk.gray(`   Skipped: ${totalActions.skipped} items (already exist)`));
  }
  
  if (totalActions.filesAdded > 0) {
    console.log(chalk.cyan(`   Files added: ${totalActions.filesAdded}`));
  }
  
  console.log();
  
  if (totalActions.created > 0 || totalActions.updated > 0) {
    console.log(chalk.green.bold('✨ Claude environment is ready!'));
  } else {
    console.log(chalk.blue.bold('✅ Claude environment is already up to date!'));
  }
  
  console.log();
  console.log(chalk.gray('Next steps:'));
  console.log(chalk.gray('• Review CLAUDE.md for project-specific instructions'));
  console.log(chalk.gray('• Customize .claude/settings.json if needed'));
  console.log(chalk.gray('• Add custom commands to .claude/commands/'));
}