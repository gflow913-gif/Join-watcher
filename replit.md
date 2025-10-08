# Overview

This is a Discord bot application designed to track member join events and calculate payment eligibility based on join patterns. The bot monitors when members join a Discord server, maintains historical records of joins, and tracks financial obligations tied to these events (2qi per eligible join). It uses slash commands for interaction and persists data in a local JSON file.

**Payment Rules:**
- New members (first-time joins) = 2qi owed (ELIGIBLE)
- Rejoining members (already tracked) = 0qi owed (NOT ELIGIBLE)
- Pre-existing members scanned via /scanexisting = 0qi owed (marked as not eligible)

**Additional Features:**
- Comprehensive invite tracking system (regular, left, fake, claimed, bonus invites)
- Welcome message system with inviter attribution
- Claim panel with ticket creation for reward verification
- Ticket system with invite count display and management buttons
- Founder role management system with owner-only access control
- Automatic RGB color animation for Founder roles (Big Founder, Middle Founder, Small Founder)
- Environment-based configuration using dotenv for secure credential management

# Recent Changes

**October 8, 2025:**
- Changed all currency references from "sx" and "coins" to "qi" throughout the entire system
- Updated casino commands, lottery system, config commands, and event logging to use "qi" currency
- Verified bot runs successfully with new currency display

**October 7, 2025:**
- Added comprehensive invite tracking system with regular, left, fake, claimed, and bonus invite categories
- Implemented welcome messages in designated channel (1408275535435661363) showing inviter and member count
- Created claim panel system with embed and Create Ticket button in channel 1408286047732760677
- Built ticket system with automatic invite count display, close (lock), and delete functionality
- Integrated claim command with invite tracker to properly deduct claimed invites
- Added member leave tracking to update inviter counts
- Added dotenv package for secure environment variable management
- Implemented `/givefounder` command (owner-only, ID: 1309720025912971355) to assign Founder roles
- Created automatic RGB color cycling animation for all Founder roles
- Fixed module path issues in command handler
- Bot token now loaded from .env file (secure configuration)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Application Framework
- **Discord.js v14**: The bot is built on the discord.js library (v14.22.1), utilizing the Gateway API for real-time event handling
- **Node.js Runtime**: Standard Node.js application with no build tools or transpilation required
- **Event-Driven Architecture**: Leverages Discord's Gateway intents system to listen for guild and member events

## Data Persistence Strategy
- **File-Based Storage**: Uses a local JSON file (`member_data.json`) for data persistence instead of a database
- **In-Memory State**: Maintains an active `memberData` object in memory that's synchronized with the JSON file
- **Synchronous I/O**: Data is loaded on startup and saved after updates using Node.js fs module
- **Data Structure**: Tracks individual members with nested objects containing userId, join timestamps, eligibility counts, and payment tracking

**Rationale**: File-based storage was chosen for simplicity and portability, suitable for small to medium-scale Discord servers. This approach avoids database setup complexity while maintaining data between bot restarts.

## Discord Integration
- **Gateway Intents**: Configured with `Guilds`, `GuildMembers`, and `GuildInvites` intents to receive member join/leave events and track invites
- **Slash Commands**: Uses Discord's REST API and Routes system for registering and handling slash commands
- **Client Architecture**: Single Discord client instance manages all server connections
- **Invite Tracking**: Caches guild invites on startup to detect which invite was used for each member join

## Core Business Logic
- **Eligibility System**: Implements a `checkEligibility()` function that determines if member joins qualify for payment tracking
- **Member Tracking**: Each member gets a persistent record with:
  - First join timestamp
  - Array of all join events
  - Count of eligible joins
  - Total amount owed
  - Inviter ID and invite type (regular/fake/claimed/bonus)
- **Aggregate Metrics**: Maintains server-wide totals for eligible joins and payment due
- **Invite Tracker**: Tracks invites per user with categories:
  - Regular Invites: Count of members invited
  - Left Invites: Count of members who left (penalty)
  - Fake Invites: Count of fake/bot invites (penalty)
  - Claimed Invites: Count of claimed rewards (penalty)
  - Bonus Invites: Admin-given bonus invites (reward)
  - Total formula: `regularInvites - leftInvites - fakeInvites - claimedInvites + bonusInvites`
- **Ticket System**: Creates private channels for users to claim rewards based on invite count

**Design Pattern**: The bot follows a simple procedural pattern with utility functions for data operations (load/save/check) rather than complex OOP structures, making it easy to understand and modify.

## Error Handling
- **Graceful Degradation**: Try-catch blocks around file I/O operations prevent crashes from disk errors
- **Console Logging**: Errors and important events are logged to console for debugging

# External Dependencies

## Third-Party Libraries
- **discord.js (v14.22.1)**: Primary framework for Discord bot functionality
  - Handles WebSocket connections to Discord Gateway
  - Provides slash command builders and REST API client
  - Manages event handlers and client state
  - Includes sub-dependencies: @discordjs/builders, @discordjs/collection, @discordjs/formatters
- **dotenv (v17.2.3)**: Environment variable management
  - Loads configuration from .env file
  - Securely manages Discord bot token and other credentials
  - Prevents hardcoding sensitive data in source code

## Discord API
- **Gateway API**: Real-time event streaming for member joins and server events
- **REST API**: Slash command registration and management
- **Required Permissions**: Bot needs appropriate Discord permissions for reading guild member events

## File System
- **Local Storage**: Relies on Node.js fs module for JSON file persistence
- **Data Location**: Stores `member_data.json` in the application root directory

## Environment Requirements
- **Node.js**: Requires Node.js v16.11.0 or higher (per discord.js requirements)
- **Discord Bot Token**: Requires environment variable or configuration for bot authentication (implementation not visible in provided code)
- **Server Permissions**: Bot must be invited to Discord servers with appropriate intent permissions enabled in the Discord Developer Portal