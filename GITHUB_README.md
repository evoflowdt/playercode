# EvoFlow - Digital Signage Management Platform

> Cloud-based digital signage management platform with multi-tenant architecture, RBAC, and multi-OS player support

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)

## 🚀 Overview

EvoFlow is a comprehensive cloud-based digital signage management platform designed for remote control and monitoring of various digital display types including LG webOS, Samsung Tizen, Android, Raspberry Pi, Windows/macOS/Linux desktops, and more.

### Key Features

- 🎯 **Multi-Tenant Architecture** - Complete data isolation with RBAC (Owner/Admin/Editor/Viewer roles)
- 🖥️ **Display Management** - Real-time monitoring, remote control, geocoding, and grouping
- 📁 **Content Library** - Upload, search, filter media with object storage integration
- 📅 **Advanced Scheduling** - Time-based, recurring, and conditional scheduling with dayparting
- 📊 **Analytics Dashboard** - Real-time insights and playback tracking
- 🔄 **Auto-Update System** - Custom HTTPS-based player updates with version management
- 🌐 **Multi-Language** - Full internationalization support (EN/IT)
- 📱 **PWA Ready** - Progressive Web App support for mobile devices
- 🔒 **2FA Authentication** - TOTP-based two-factor authentication with backup codes
- 🚨 **Smart Alerts** - Intelligent monitoring with configurable alert rules
- 🎨 **Multi-Zone Layouts** - Zone-based content display with synchronized playback

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher
- **npm** or **yarn**
- **PostgreSQL** 14+ database
- **Replit** account (for deployment) or configure your own object storage

## 🛠️ Installation

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/evoflowdt/evoflow.git
cd evoflow
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Environment Configuration

Create a \`.env\` file in the root directory (not tracked in git):

\`\`\`env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/evoflow
PGHOST=localhost
PGPORT=5432
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGDATABASE=evoflow

# Session Secret (generate a random string)
SESSION_SECRET=your-super-secret-session-key-min-32-chars

# Object Storage (if using Replit Object Storage)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your-bucket-id
PUBLIC_OBJECT_SEARCH_PATHS=public
PRIVATE_OBJECT_DIR=.private

# Optional: GitHub Integration for Player Releases
# (Configure via Replit GitHub connector if deploying on Replit)
\`\`\`

### 4. Database Setup

Initialize the database schema:

\`\`\`bash
# Push database schema (creates tables)
npm run db:push

# Optional: Seed with sample data
npm run db:seed
\`\`\`

### 5. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

The application will be available at:
- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:5000/api

## 📁 Project Structure

\`\`\`
evoflow/
├── client/                # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── lib/          # Utilities and helpers
│   │   └── hooks/        # Custom React hooks
├── server/               # Express.js backend
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Database storage layer
│   ├── github.ts         # GitHub integration
│   └── objectStorage.ts  # Object storage handling
├── shared/               # Shared types and schemas
│   └── schema.ts         # Drizzle ORM database schema
├── public/               # Static assets
├── package.json          # Project dependencies
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── drizzle.config.ts     # Drizzle ORM configuration
\`\`\`

## 🎮 Desktop Player

The EvoFlow Desktop Player is available in a separate repository:

👉 **[evoflow-player](https://github.com/evoflowdt/playercode)** - Electron-based player for Windows, macOS, and Linux

## 🚀 Deployment

### Deploy on Replit

1. Import this repository to Replit
2. Configure PostgreSQL database (automatically provisioned)
3. Set up Object Storage integration
4. Configure environment secrets
5. Click "Run" to start the application
6. Use "Publish" to deploy to production

### Deploy Elsewhere

EvoFlow can be deployed to any Node.js hosting platform:

1. Build the application:
   \`\`\`bash
   npm run build
   \`\`\`

2. Set environment variables on your hosting platform

3. Start the production server:
   \`\`\`bash
   npm start
   \`\`\`

## 🔧 Available Scripts

- \`npm run dev\` - Start development server with hot reload
- \`npm run build\` - Build for production
- \`npm run db:push\` - Sync database schema
- \`npm run db:seed\` - Seed database with sample data
- \`npm start\` - Start production server

## 🏗️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Shadcn UI** - Component library
- **TanStack Query** - Data fetching and caching
- **Wouter** - Lightweight routing
- **Uppy** - File upload handling
- **Leaflet** - Interactive maps

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **Drizzle ORM** - Type-safe ORM
- **WebSockets** - Real-time communication
- **bcrypt** - Password hashing

### Infrastructure
- **Vite** - Build tool and dev server
- **Replit** - Deployment platform (optional)
- **Neon/PostgreSQL** - Database hosting
- **Object Storage** - Media file storage

## 📖 Documentation

For more detailed documentation, see:

- [API Documentation](docs/API.md) - REST API endpoints
- [Database Schema](docs/DATABASE.md) - Database structure
- [Authentication](docs/AUTH.md) - Authentication flow
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

**Digital Town Srl**
- Website: https://evoflow.digital
- P.IVA: 03802320139
- REA: CO.333859

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Inspired by the need for flexible, powerful digital signage solutions
- Thanks to the open-source community for amazing tools and libraries

## 📞 Support

For support, please:
- Open an issue on GitHub
- Contact us at support@evoflow.digital
- Visit our documentation at https://docs.evoflow.digital

---

Made with ❤️ by Digital Town Srl | Copyright © 2025
