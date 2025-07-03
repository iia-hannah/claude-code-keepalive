#!/usr/bin/env node

const { program } = require('commander');
const pkg = require('../package.json');

program
  .version(pkg.version)
  .description('Claude Code CLI token optimization automation tool');

program
  .command('start')
  .description('Start the background service')
  .option('--from <HH:MM>', 'First call start time (manual mode)', '07:00')
  .option('--interval <hours>', 'Call interval in hours', '5')
  .option('--count <number>', 'Total daily calls (manual mode)', '3')
  .option('--burst <number>', 'Consecutive call count', '3')
  .option('--burst-interval <minutes>', 'Minutes between burst calls', '2')
  .option('--foreground', 'Run in foreground mode')
  .option('--dry-run', 'Show schedule without execution')
  .action(require('../lib/commands/start'));

program
  .command('stop')
  .description('Stop the running service')
  .action(require('../lib/commands/stop'));

program
  .command('status')
  .description('Check current service status')
  .action(require('../lib/commands/status'));

program
  .command('logs')
  .description('Show recent logs')
  .action(require('../lib/commands/logs'));

program
  .command('test')
  .description('Test Claude CLI connection')
  .action(require('../lib/commands/test'));

program
  .command('config')
  .description('Show configuration')
  .action(require('../lib/commands/config'));

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}