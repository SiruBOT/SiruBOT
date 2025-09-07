<h1 align="center">
SiruBOT GitHub Repository

![Node version](https://img.shields.io/badge/node-%3E%3D22.0-brightgreen)
![GitHub](https://img.shields.io/github/license/SiruBOT/SiruBOT)
[![Run eslint](https://github.com/SiruBOT/SiruBOT/actions/workflows/lint.yml/badge.svg?branch=main)](https://github.com/SiruBOT/SiruBOT/actions/workflows/lint.yml)
[![Typescript build](https://github.com/SiruBOT/SiruBOT/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/SiruBOT/SiruBOT/actions/workflows/node.js.yml)

</h1>

A modern Discord music bot built with Discord.js and Lavalink, featuring a monorepo architecture with Turbo and Yarn workspaces.

## 🏗️ Project Structure

```
sirubot/
├── apps/
│   ├── bot/           # Discord bot application
│   └── dashboard/     # Next.js web dashboard
├── packages/
│   ├── prisma/        # Database schema and client
│   └── utils/         # Shared utility functions
└── docker/            # Docker configuration for services
```

## 🚀 Getting Started

### Prerequisites

- Node.js 22+ 
- Yarn 4.6.0+
- A Discord bot token
- Lavalink server

## 📦 Applications

### Bot (`apps/bot`)
The main Discord bot application built with:
- **Discord.js v14** - Discord API wrapper
- **Sapphire Framework** - Command and event handling
- **Lavalink Client** - Audio streaming
- **Prisma** - Database ORM

### Dashboard (`apps/dashboard`)
A Next.js web dashboard for bot management:
- **Next.js 15** - React framework
- **Tailwind CSS v4** - Styling
- **TypeScript** - Type safety

## 📚 Packages

### Utils (`packages/utils`)
Shared utility functions including:
- Array manipulation helpers
- Time formatting functions
- YouTube search functionality
- Discord embed builders

### Prisma (`packages/prisma`)
Database schema and client configuration for data persistence.

## 🎵 Features

- **Music Playback**: High-quality audio streaming via Lavalink
- **Queue Management**: Add, skip, and manage music queues
- **Voice Controls**: Volume control and playback commands
- **Auto-complete**: Smart search suggestions for tracks
- **Playlist Support**: Create and manage playlists

## 🛠️ Development

### Available Scripts

```bash
# Development
yarn dev          # Start all apps in development mode
yarn watch        # Build and watch for changes

# Building
yarn build        # Build all packages and apps
yarn generate     # Generate Prisma client

# Testing & Linting
yarn lint         # Lint all packages
yarn test         # Run tests
```

### Project Commands

Individual app commands can be run using turbo filters:

```bash
# Bot-specific commands
turbo build --filter=@sirubot/bot
turbo start --filter=@sirubot/bot
turbo dev --filter=@sirubot/bot

# Dashboard-specific commands  
turbo dev --filter=@sirubot/dashboard
turbo build --filter=@sirubot/dashboard

# Utils package commands
turbo build --filter=@sirubot/utils
turbo watch --filter=@sirubot/utils
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Discord.js](https://discord.js.org/) - Discord API wrapper
- [Sapphire Framework](https://sapphirejs.dev/) - Discord bot framework
- [Lavalink](https://lavalink.dev/) - Audio server
- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://prisma.io/) - Database toolkit