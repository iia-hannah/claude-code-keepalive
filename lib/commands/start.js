const chalk = require('chalk');
const { fork } = require('child_process');
const path = require('path');
const { getPid, isRunning } = require('../services/process-manager');
const { validateConfig, getConfig, updateConfig } = require('../utils/config-manager');
const { checkClaudeInstallation } = require('../services/claude-service');
const { showDryRun } = require('../services/scheduler');

module.exports = async function(options) {
  try {
    // Check if already running
    const pid = getPid();
    if (pid && isRunning(pid)) {
      console.log(chalk.yellow(`⚠️ claude-code-keepalive is already running (PID: ${pid})`));
      console.log(chalk.blue('Use "claude-code-keepalive status" to check or "claude-code-keepalive stop" to stop.'));
      return;
    }
    
    // Validate Claude CLI installation
    console.log(chalk.blue('🔍 Checking Claude CLI installation...'));
    const isClaudeInstalled = await checkClaudeInstallation();
    if (!isClaudeInstalled) {
      console.log(chalk.red('❌ Claude CLI is not installed or not accessible'));
      console.log(chalk.yellow('Please install Claude CLI first:'));
      console.log('  npm install -g @anthropic-ai/claude-code');
      console.log('  claude auth');
      return;
    }
    console.log(chalk.green('✅ Claude CLI is ready'));
    
    // Validate and update configuration
    const configUpdates = {};
    if (options.interval) configUpdates.intervalHours = parseInt(options.interval);
    if (options.burst) configUpdates.burstCount = parseInt(options.burst);
    if (options.burstInterval) configUpdates.burstInterval = parseInt(options.burstInterval);
    if (options.from) configUpdates.from = options.from;
    if (options.count) configUpdates.count = parseInt(options.count);
    
    if (Object.keys(configUpdates).length > 0) {
      const errors = validateConfig({ ...getConfig(), ...configUpdates });
      if (errors.length > 0) {
        console.log(chalk.red('❌ Configuration validation failed:'));
        errors.forEach(error => console.log(chalk.red(`  - ${error}`)));
        return;
      }
      updateConfig(configUpdates);
    }
    
    // Show dry run if requested
    if (options.dryRun) {
      showDryRun(options);
      return;
    }
    
    const config = getConfig();
    const intervalHours = parseInt(options.interval) || config.intervalHours;
    const burstCount = parseInt(options.burst) || config.burstCount;
    
    // Start in foreground or background
    if (options.foreground) {
      console.log(chalk.blue(`🚀 Starting claude-code-keepalive in foreground mode...`));
      console.log(chalk.gray(`Interval: ${intervalHours}h, Burst: ${burstCount} attempts`));
      
      // Start scheduler directly
      const { startDaemon } = require('../services/scheduler');
      startDaemon(options);
    } else {
      console.log(chalk.blue(`🚀 Starting claude-code-keepalive in background mode...`));
      console.log(chalk.gray(`Interval: ${intervalHours}h, Burst: ${burstCount} attempts`));
      
      // Fork a new process and detach
      const child = fork(path.join(__dirname, '../services/scheduler.js'), [], {
        detached: true,
        stdio: 'ignore',
        env: { ...process.env, ...options }
      });
      
      // Detach from parent
      child.unref();
      
      console.log(chalk.green(`✅ Service started successfully (PID: ${child.pid})`));
      
      // Calculate next ping time
      const nextPingTime = new Date(Date.now() + intervalHours * 60 * 60 * 1000);
      console.log(chalk.blue(`📅 Next ping scheduled: ${nextPingTime.toLocaleString()}`));
      console.log(chalk.gray('\\nUse "claude-code-keepalive status" to check status.'));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Failed to start: ${error.message}`));
    process.exit(1);
  }
};