const { CronJob } = require('cron');
const { getConfig, updateConfig } = require('../utils/config-manager');
const { executeBurstSequence } = require('./claude-service');
const { savePid, setupSignalHandlers } = require('./process-manager');
const logger = require('../utils/logger');

let mainJob = null;
let manualTimeouts = [];

/**
 * Start auto mode scheduling (continuous 5-hour intervals)
 */
function startAutoMode() {
  const config = getConfig();
  logger.info(`Starting auto mode (${config.intervalHours}h intervals)`);
  
  // Execute immediately on start
  executeScheduledTask();
  
  // Set up recurring execution
  const intervalMs = config.intervalHours * 60 * 60 * 1000;
  const interval = setInterval(() => {
    executeScheduledTask();
  }, intervalMs);
  
  // Store interval reference for cleanup
  mainJob = { type: 'interval', ref: interval };
  
  logger.info(`Next execution in ${config.intervalHours} hours`);
}

/**
 * Start manual mode scheduling (specific times and counts)
 */
function startManualMode(options) {
  const config = getConfig();
  const fromTime = options.from || config.from;
  const count = parseInt(options.count) || config.count;
  const intervalHours = parseInt(options.interval) || config.intervalHours;
  
  logger.info(`Starting manual mode: ${count} calls starting at ${fromTime}, ${intervalHours}h intervals`);
  
  const [hours, minutes] = fromTime.split(':').map(Number);
  const now = new Date();
  
  // Schedule each execution
  for (let i = 0; i < count; i++) {
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    // Add interval for subsequent executions
    if (i > 0) {
      scheduledTime.setHours(scheduledTime.getHours() + (intervalHours * i));
    }
    
    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const delay = scheduledTime.getTime() - now.getTime();
    logger.info(`Execution ${i + 1}/${count} scheduled for: ${scheduledTime.toLocaleString()}`);
    
    const timeout = setTimeout(() => {
      logger.info(`Executing scheduled task ${i + 1}/${count}`);
      executeScheduledTask();
    }, delay);
    
    manualTimeouts.push(timeout);
  }
  
  mainJob = { type: 'manual', timeouts: manualTimeouts };
}

/**
 * Execute the scheduled Claude burst sequence
 */
async function executeScheduledTask() {
  try {
    logger.info('Executing scheduled burst sequence...');
    const successCount = await executeBurstSequence();
    logger.info(`Scheduled execution completed with ${successCount} successful attempts`);
  } catch (error) {
    logger.error('Scheduled execution failed', error);
  }
}

/**
 * Stop all scheduled tasks
 */
function stopScheduler() {
  logger.info('Stopping scheduler...');
  
  if (mainJob) {
    if (mainJob.type === 'interval') {
      clearInterval(mainJob.ref);
    } else if (mainJob.type === 'manual') {
      mainJob.timeouts.forEach(timeout => clearTimeout(timeout));
    } else if (mainJob.type === 'cron') {
      mainJob.ref.stop();
    }
    mainJob = null;
  }
  
  // Clear any remaining manual timeouts
  manualTimeouts.forEach(timeout => clearTimeout(timeout));
  manualTimeouts = [];
  
  logger.info('Scheduler stopped');
}

/**
 * Start scheduler in daemon mode
 */
function startDaemon(options = {}) {
  // Save PID and setup signal handlers
  savePid(process.pid);
  setupSignalHandlers();
  
  // Handle cleanup on process termination
  process.on('exit', () => {
    stopScheduler();
  });
  
  const config = getConfig();
  
  // Update config with command line options
  const configUpdates = {};
  if (options.interval) configUpdates.intervalHours = parseInt(options.interval);
  if (options.burst) configUpdates.burstCount = parseInt(options.burst);
  if (options.burstInterval) configUpdates.burstInterval = parseInt(options.burstInterval);
  
  if (Object.keys(configUpdates).length > 0) {
    updateConfig(configUpdates);
  }
  
  // Start appropriate mode
  if (options.from || options.count) {
    startManualMode(options);
  } else {
    startAutoMode();
  }
  
  logger.info('Daemon started successfully');
}

/**
 * Show dry run schedule without execution
 */
function showDryRun(options) {
  const config = getConfig();
  console.log('📅 Schedule Preview (Dry Run):\n');
  
  if (options.from || options.count) {
    // Manual mode dry run
    const fromTime = options.from || config.from;
    const count = parseInt(options.count) || config.count;
    const intervalHours = parseInt(options.interval) || config.intervalHours;
    
    console.log(`Mode: Manual`);
    console.log(`Start time: ${fromTime}`);
    console.log(`Interval: ${intervalHours} hours`);
    console.log(`Total executions: ${count}\n`);
    
    const [hours, minutes] = fromTime.split(':').map(Number);
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      if (i > 0) {
        scheduledTime.setHours(scheduledTime.getHours() + (intervalHours * i));
      }
      
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      console.log(`${i + 1}. ${scheduledTime.toLocaleString()}`);
    }
  } else {
    // Auto mode dry run
    const intervalHours = parseInt(options.interval) || config.intervalHours;
    console.log(`Mode: Auto`);
    console.log(`Interval: ${intervalHours} hours`);
    console.log(`Continuous execution every ${intervalHours} hours\n`);
    
    const now = new Date();
    for (let i = 0; i < 5; i++) {
      const nextTime = new Date(now.getTime() + (intervalHours * 60 * 60 * 1000 * i));
      console.log(`${i + 1}. ${nextTime.toLocaleString()}`);
    }
    console.log('... (continues every ' + intervalHours + ' hours)');
  }
  
  console.log(`\nBurst configuration:`);
  console.log(`- ${config.burstCount} attempts per execution`);
  console.log(`- ${config.burstInterval} minute intervals between attempts`);
  console.log(`- Question: "${config.question}"`);
}

module.exports = {
  startDaemon,
  stopScheduler,
  showDryRun,
  startAutoMode,
  startManualMode
};

// Start daemon if this file is executed directly
if (require.main === module) {
  startDaemon();
}