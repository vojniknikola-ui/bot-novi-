# 🤖 Vacation Tracker Discord Bot

Full-featured Discord bot for time tracking, vacation management, and team coordination. Built with Cloudflare Workers & Neon PostgreSQL.

## ✨ Features

### 🕐 Time Tracking
- `/clock-in [location]` – Start work session (office/home)
- `/clock-out` – End work session with duration
- `/pauza-start` & `/pauza-end` – Break management (counts as work time)
- `/off` – Mark as not working (doesn't count as work time)
- `/wfh` – Clock in for work from home
- `/wfo` – Clock in for work from office
- `/time-log [days]` – View recent time entries

### 🌴 Vacation Management
- 2-Layer Approval System: PM → Admin approval
- `/vacation-request` – Request vacation (specify working days)
- `/sick-leave` – Report sick leave (automatic approval, logged)
- `/vacation-status` – View vacation balance & history
- PM Notifications: Automatic DMs for pending requests
- Automatic balance tracking & validation

### 👑 Role-Based Administration
**Admin Commands**
- `/admin-set-balance`
- `/admin-add-days`
- `/admin-remove-days`
- `/admin-approve`

**PM Commands**
- `/pm-pending`
- `/pm-approve`
- `/pm-deny`

### 📊 Reporting & Analytics
- `/report time-today`
- `/report vacation-pending`
- `/report user-activity`
- `/report vacation-usage`
- `/report work-hours`

### ⚙️ Server Configuration
- `/settings` – Configure roles and work hours
- Custom admin/PM roles per server
- Work hour definitions
- Timezone settings

### 🔔 Notifications & Automation
- PM Notifications
- Role-based alerts
- Auto-approval for sick leave
- Status updates in real time

### 👁️ Team Intelligence & Monitoring
- `/status` – Who's online, on break, or on vacation
- `/schedule` – View team calendars and vacation plans
- `/remind` – Automated reminders for team members
- Team overview dashboards

## 🚀 Quick Start

### 1. Prerequisites
- Discord Developer Account
- Cloudflare Account
- Neon PostgreSQL Database

### 2. Discord Bot Setup
1. Create bot at [Discord Developer Portal](https://discord.com/developers/applications)
2. Get `APPLICATION ID`, `PUBLIC KEY`, `BOT TOKEN`

### 3. Database Setup
```bash
# Create Neon database at https://neon.tech
# Initialize schema
npm run db:init
```

### 4. Environment Variables
```bash
# .env or wrangler secrets
DISCORD_PUBLIC_KEY=your_public_key
DISCORD_APPLICATION_ID=your_app_id
DISCORD_TOKEN=your_bot_token
NEON_DATABASE_URL=your_neon_connection_string
```

### 5. Deploy
```bash
# Register slash commands
npm run register-commands

# Deploy to Cloudflare
npm run deploy
```

## 📋 Slash Commands Overview

### 👤 User Commands
```
/clock-in [location]     # Start work (office/home)
/clock-out               # End work with summary
/pauza-start             # Start break (counts as work time)
/pauza-end               # End break
/off                     # Mark as not working (doesn't count)
/wfh                     # Clock in - work from home
/wfo                     # Clock in - work from office
/time-log [days]         # View time entries
/vacation-request        # Request vacation (specify working days)
/sick-leave              # Report sick leave (auto-approved)
/vacation-status         # View vacation balance
/status [type]           # Check team status (online/break/vacation)
/schedule [type]         # View team schedules and calendars
/remind @user [msg]      # Set reminders for team members
```

### 👨‍💼 PM Commands
```
/pm-pending              # View pending requests
/pm-approve <id>         # Approve vacation
/pm-deny <id> <reason>   # Deny vacation
```

### 👑 Admin Commands
```
/admin-set-balance @user <days>    # Set vacation days
/admin-add-days @user <days>       # Add vacation days
/admin-remove-days @user <days>    # Remove vacation days
/admin-approve <id>                # Final approval
/settings                          # Server configuration
```

### 📊 Reporting Commands
```
/report time-today           # Today's time entries
/report vacation-pending     # Pending vacations
/report user-activity        # Active users (7 days)
/report vacation-usage       # Vacation usage stats
/report work-hours           # Work hours summary
```

## 🗄️ Database Schema

Core Tables
- `users` – Discord user profiles
- `user_vacation_balance` – Vacation entitlements
- `time_entries` – Clock in/out records
- `active_sessions` – Current work sessions
- `vacation_requests` – Vacation approval workflow
- `server_settings` – Guild-specific configuration
- `audit_log` – All system actions

Key Features
- Automatic user registration on first command
- 2-layer vacation approval (PM → Admin)
- Real-time session tracking
- Comprehensive audit logging
- Role-based permissions

## 🔧 Technical Architecture

### Cloudflare Workers
- Serverless Discord interaction handling
- Sub-3-second response requirement
- Global CDN deployment
- 100k requests/day free tier

### Neon PostgreSQL
- Serverless PostgreSQL
- 512MB free storage
- Automatic scaling
- Connection pooling

### Security
- Discord signature verification
- Role-based command access
- Input validation & sanitization
- Audit logging for all actions

## 📊 Business Logic

### Time Tracking
- Session-based tracking (work/break)
- Location awareness (office/home)
- Automatic overtime calculation
- Break time deduction

### Vacation Workflow
- User Request → PM Review → PM Approval → Admin Review → Admin Approval → Confirmed

### Balance Management
- Annual vacation allocation
- Carry-over tracking
- Usage validation
- Automatic updates

## 🚀 Deployment Guide

### 1. Discord Setup
```
# Create application
# Add bot to server with permissions:
# - Use Slash Commands
# - Send Messages
# - Embed Links
# - Read Message History
```

### 2. Cloudflare Setup
```
npm install -g wrangler
wrangler auth login
wrangler secret put DISCORD_PUBLIC_KEY
wrangler secret put DISCORD_TOKEN
wrangler secret put NEON_DATABASE_URL
```

### 3. Database Setup
```
psql $NEON_DATABASE_URL -f sql/schema.sql
```

### 4. Command Registration
```
npm run register-commands
```

### 5. Deploy
```
wrangler deploy
```

## 🎯 Usage Examples

### Daily Workflow
```
/clock-in location:office -> ✅ Clocked in at 09:00
/pauza-start -> 🕐 Pauza started
/pauza-end -> ✅ Pauza ended (30 min)
/clock-out -> ✅ Clocked out - Worked: 8h 30min
```

### Vacation Request
```
/vacation-request start:2024-07-15 end:2024-07-20 days:5 reason:"Family vacation"
```

### Sick Leave (Auto-Approved)
```
/sick-leave start:2024-07-15 end:2024-07-17 days:3 reason:"Flu"
```

### Team Status Monitoring
```
/status online
/status on-break
/status on-vacation
/status team-overview
```

### Team Scheduling
```
/schedule today
/schedule week
/schedule vacation-calendar
```

### Smart Reminders
```
/remind @john "Don't forget the client meeting at 3 PM" when:60
```

### Admin Management
```
/admin-set-balance @john 25
/admin-add-days @jane 3
```

## 🔧 Development

### Local Development
```
npm install
npm run dev
npm run register-commands
```

### Testing
```
psql $NEON_DATABASE_URL -c "SELECT version();"
```

## 📈 Scaling & Performance
- Cloudflare Workers: Auto-scaling, global distribution
- Neon Database: Connection pooling, query optimization
- Caching for reports
- Rate limiting via Discord

## 🛡️ Security & Compliance
- Data encryption at rest
- Role-based command permissions
- Audit trail
- GDPR ready (export/deletion)

## 🎉 Ready for Production
This Discord bot provides enterprise-grade time tracking and vacation management with:
- ✅ Free hosting (Cloudflare Workers + Neon)
- ✅ Real-time interactions via Discord
- ✅ Professional workflow with approvals
- ✅ Comprehensive reporting and analytics
- ✅ Role-based permissions and security
- ✅ Scalable architecture for growing teams

Deploy in minutes, manage vacations effortlessly! 🚀
