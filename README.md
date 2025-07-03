# claude-code-keepalive

Maximize your Claude usage! `claude-code-keepalive` automatically refreshes your session, guaranteeing you maximize every 5-hour usage window.

## 🤔 Why claude-code-keepalive?

Claude provides allocation for exactly 5 hours from the first message you send. All messages sent within this 5-hour window are included in the same session and are not counted as separate sessions. After 5 hours, you need to manually send a message to start a new session and access refreshed tokens.

This is a smart automation tool that perfectly aligns Claude's 5-hour sessions with your usage patterns.

### ❌ Problem Scenario
- 9:00 AM: Work starts (session begins)
- 12:00 PM: All usage quota exhausted
- 2:00 PM: Wait until token reset, then resume session

### ✅ `claude-code-keepalive` Solution
- 7:00 AM: Session automatically started **(claude-code-keepalive)**
- 9:00 AM: Work begins
- 12:00 PM: All usage quota exhausted
- 12:00 PM: Session automatically started **(claude-code-keepalive)**
- 1:00 PM: 🍽️😋 After lunch, afternoon work begins with fresh token allocation

## Installation

### Prerequisites
- **Node.js 18.0.0 or higher**
- **Claude Code CLI installed and authenticated**
  ```bash
  npm install -g @anthropic-ai/claude-code
  claude auth
  ```

### Quick Start
```bash
npm install -g claude-code-keepalive
```

## Usage

### Starting the Service

```bash
# Start with default settings (5-hour interval, continuous)
claude-code-keepalive start

# Start with custom interval (3 hours)
claude-code-keepalive start --interval 3

# Start in foreground mode to see logs
claude-code-keepalive start --foreground

# Manual mode: 3 calls starting at 7 AM with 5-hour intervals
claude-code-keepalive start --from "07:00" --interval 5 --count 3

# Preview schedule without execution
claude-code-keepalive start --dry-run
```

### Checking Status

```bash
claude-code-keepalive status
```

### Testing Connection

```bash
claude-code-keepalive test
```

### Viewing Logs

```bash
claude-code-keepalive logs
```

### Viewing Configuration

```bash
claude-code-keepalive config
```

### Stopping the Service

```bash
claude-code-keepalive stop
```

## Command Options

### Start Command Options

- `--from <HH:MM>`: First call start time (manual mode, default: "07:00")
- `--interval <hours>`: Call interval in hours (default: 5)
- `--count <number>`: Total daily calls (manual mode, default: 3)
- `--burst <number>`: Consecutive call count (default: 3)
- `--burst-interval <minutes>`: Minutes between burst calls (default: 2)
- `--foreground`: Run in foreground mode with visible logs
- `--dry-run`: Show schedule without execution

## Configuration

Configuration is stored in `~/.claude-code-keepalive/config.json` and can be modified directly:

```json
{
  "intervalHours": 5,
  "timeout": 30000,
  "burstCount": 3,
  "burstInterval": 2,
  "question": "What time is it now?",
  "logLevel": "info",
  "autoRestart": true,
  "timezone": "America/New_York",
  "from": "07:00",
  "count": 3
}
```

## Auto-Start on Boot

The service will automatically offer to set up auto-start on boot when first started. This works on:

- **macOS**: launchd User Agent (no admin privileges required)
- **Linux**: systemd user service (no admin privileges required)  
- **Windows**: Task Scheduler user task (no admin privileges required)

## Troubleshooting

### Logs

Logs are stored in:
- `~/.claude-code-keepalive/output.log` - General activity logs
- `~/.claude-code-keepalive/error.log` - Error logs

### Common Issues

**Claude CLI not found**
```bash
npm install -g @anthropic-ai/claude-code
```

**Authentication Issues**
```bash
claude auth
```

**Process Not Starting**
```bash
# Check for errors
claude-code-keepalive logs
```

**View Recent Activity**
```bash
# Real-time log monitoring
tail -f ~/.claude-code-keepalive/output.log
```

## Features

- ✅ **Token Optimization**: Automatically resets tokens every 5 hours
- ✅ **Unattended Operation**: Runs in the background, starts on boot
- ✅ **Cross-Platform**: Works on macOS, Linux, and Windows
- ✅ **No Admin Rights**: Runs without sudo/administrator privileges
- ✅ **Burst Execution**: Multiple attempts per trigger for reliability
- ✅ **Flexible Scheduling**: Auto mode or manual scheduling
- ✅ **Comprehensive Logging**: Detailed activity and error logging
- ✅ **Easy Management**: Simple CLI commands for all operations

## License

MIT

## 🤝 Contributing

If you'd like to contribute to this project:
1. Fork this repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request