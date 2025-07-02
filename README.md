# claude-code-keepalive
Maximize your Claude usage! `claude-code-keepalive` automatically refreshes your session, guaranteeing you maximize every 5-hour usage window.

## 🤔Why claude-code-keepalive?
Claude provides allocation for exactly 5 hours from the first message you send. All messages sent within this 5-hour window are included in the same session and are not counted as separate sessions. After 5 hours, you need to manually send a message to start a new session and access refreshed tokens.
This is a smart automation tool that perfectly aligns Claude's 5-hour sessions with your usage patterns.

##### ❌ Problem Scenario
- 9:00 AM: Work starts (session begins)
- 12:00 PM: All usage quota exhausted
- 2:00 PM: Wait until token reset, then resume session

##### ✅`claude-code-keepalive` Solution
- 7:00 AM: Session automatically started (claude-code-keepalive)
- 9:00 AM: Work begins
- 12:00 PM: All usage quota exhausted
- 12:00 PM: Session automatically started (claude-code-keepalive)
- 1:00 PM: 🍽️😋 After lunch, afternoon work begins with fresh token allocation


## Installation
### Pre-requisites
- Node.js 18+
- Claude Code CLI installed and authenticated 

### Quick Start
```bash
npm install -g claude-code-keepalive
```

Start Option 1: Call 3 times starting at 7 AM with 5-hour intervals
```bash
claude-code-keepalive start --mode manual --from "07:00" --interval 5 --count 3
```
Start Option 2: Auto-call every 5 hours starting now
```bash
claude-code-keepalive start
```

## Command Usage
Basic Commands
```bash
claude-code-keepalive start           # Start service
claude-code-keepalive stop            # Stop service
claude-code-keepalive status          # Check current status
claude-code-keepalive logs            # View logs
```

## 🤝 Contributing
If you'd like to contribute to this project,
Fork this repository and create a pull request.