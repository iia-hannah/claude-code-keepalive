const chalk = require('chalk');
const { getPid, isRunning, removePid, stopProcess } = require('../services/process-manager');

module.exports = function() {
  const pid = getPid();
  
  if (!pid) {
    console.log(chalk.yellow('⚠️ No running process found'));
    return;
  }
  
  if (isRunning(pid)) {
    console.log(chalk.blue(`🛑 Stopping claude-code-keepalive (PID: ${pid})...`));
    
    if (stopProcess(pid)) {
      console.log(chalk.green('✅ Process stopped successfully'));
      removePid();
    } else {
      console.log(chalk.red(`❌ Failed to stop process`));
      console.log(chalk.yellow('Removing stale PID file...'));
      removePid();
    }
  } else {
    console.log(chalk.yellow(`⚠️ Process with PID ${pid} is not running`));
    console.log(chalk.blue('Removing stale PID file...'));
    removePid();
  }
};