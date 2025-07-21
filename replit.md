# Flaukowski - Autonomous Crypto Trading Agent

## Overview

Flaukowski is a full-stack web application that provides an autonomous cryptocurrency trading agent with Ethereum wallet authentication and a 0.001 ETH payment requirement for account creation. The system features a React-based frontend with Web3 wallet integration and an Express.js backend that manages trading operations, user authentication, data persistence, and WebSocket communications.

**Current Status (July 21, 2025)**: All major bugs have been resolved. The application is fully operational with:
- Working authentication system with MetaMask integration
- Functional trading agent with strategy execution
- Real-time portfolio tracking and risk management
- Complete API ecosystem with all endpoints operational
- TypeScript errors resolved and type-safe data handling implemented

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with Tailwind CSS styling
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds
- **Component System**: Shadcn/ui design system with custom dark theme

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js 20 with ES modules
- **Real-time Communication**: WebSocket server for live updates
- **Development**: TSX for TypeScript execution during development
- **Production Build**: ESBuild for backend bundling

### Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL 16 (configured for both local and cloud deployment)
- **Migration**: Drizzle Kit for schema migrations
- **Connection**: Neon Database serverless driver for cloud deployment

## Key Components

### Trading Engine
- **Agent Engine**: Core autonomous trading logic with configurable execution cycles
- **Strategy Service**: Supports multiple trading strategies (DCA, Momentum, Arbitrage)
- **Risk Manager**: Real-time risk assessment and circuit breaker functionality
- **Market Data Service**: Simulated market data with price movement algorithms

### Database Schema
- **Users**: Ethereum wallet addresses with payment verification and authentication
- **Agents**: Trading agent configuration and status tracking (linked to users)
- **Strategies**: Individual strategy definitions with performance metrics
- **Activities**: Comprehensive audit trail of all trading actions
- **Portfolios**: Real-time portfolio valuation and performance tracking
- **Risk Parameters**: Configurable risk limits and safety controls
- **Market Data**: Historical and real-time market information storage

### User Interface
- **Dashboard**: Real-time overview with metrics, charts, and activity feeds
- **Strategy Management**: Create, configure, and monitor trading strategies
- **Portfolio Analytics**: Portfolio performance and asset allocation views
- **Risk Controls**: Risk parameter configuration and monitoring
- **Activity Log**: Complete audit trail of trading activities
- **Configuration**: Agent settings and system preferences

## Data Flow

1. **Market Data Ingestion**: The Market Data Service simulates real-time price feeds and stores them in the database
2. **Agent Execution Cycle**: The Agent Engine runs periodic checks (every 30 seconds) to evaluate market conditions
3. **Strategy Evaluation**: Active strategies are assessed based on their configuration and market signals
4. **Risk Assessment**: The Risk Manager validates all potential trades against configured limits
5. **Trade Execution**: Approved trades are simulated and logged with full audit trails
6. **Real-time Updates**: WebSocket connections push live updates to connected clients
7. **Data Persistence**: All activities, portfolio changes, and market data are stored in PostgreSQL

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL with Neon serverless driver for cloud deployment
- **UI Components**: Radix UI primitives for accessible component foundations
- **Styling**: Tailwind CSS for utility-first styling approach
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns for date manipulation and formatting

### Development Dependencies
- **TypeScript**: Full type safety across frontend and backend
- **ESLint/Prettier**: Code quality and formatting enforcement
- **Vite Plugins**: Development optimizations and Replit integration

## Deployment Strategy

### Development Environment
- **Platform**: Replit with integrated PostgreSQL database
- **Hot Reload**: Vite HMR for frontend, TSX watch mode for backend
- **Port Configuration**: Frontend on port 5000, WebSocket on same port
- **Database**: Local PostgreSQL instance with automatic migrations

### Production Deployment
- **Build Process**: Vite builds frontend to `dist/public`, ESBuild bundles backend to `dist/index.js`
- **Runtime**: Node.js production server serving static files and API endpoints
- **Database**: Cloud PostgreSQL with connection pooling
- **Scaling**: Configured for autoscaling deployment target

### Environment Configuration
- **Database URL**: Environment variable for flexible database connections
- **Build Commands**: Separate build and start scripts for production deployment
- **Static Assets**: Frontend builds to backend's public directory for unified serving

## Changelog

```
Changelog:
- June 25, 2025. Initial setup with in-memory storage
- June 25, 2025. Database migration - Successfully migrated from in-memory storage to PostgreSQL
  * Added Drizzle ORM with type-safe database operations
  * Implemented database relations for all entities
  * Created production-ready data persistence layer
  * Initialized default agent, portfolio, and risk parameters
- June 25, 2025. Web3 Authentication System - Implemented complete Ethereum wallet authentication
  * Added users table with wallet address and payment tracking
  * Integrated MetaMask wallet connection with ethers, wagmi, viem, and RainbowKit
  * Created login/registration flow requiring 0.001 ETH payment for account creation
  * Implemented protected routes and authentication context
  * Added user wallet information and logout functionality to sidebar
  * Evolved from single-user to multi-user platform with payment gates
- July 21, 2025. Payment Adjustment - Reduced registration payment requirement
  * Changed payment amount from 1 ETH to 0.001 ETH for easier onboarding
  * Updated all UI references and server-side validation
- July 21, 2025. Critical Bug Fixes and System Stabilization
  * Fixed TypeScript errors causing "Filter is not a function" crashes in Activity Log and Configuration pages
  * Corrected API endpoint mismatches (Portfolio requesting /ETH/USD instead of /ETH)
  * Fixed agent engine database update errors preventing strategy execution
  * Resolved inactive agent status issues blocking all API endpoints
  * Added proper TypeScript typing for all API responses
  * Initialized demo data for testing and development
  * Fixed risk manager performance calculation causing excessive violation warnings
  * All APIs now functional: /api/portfolio, /api/activities, /api/strategies, /api/agent/status, /api/market-data/ETH
  * Agent engine running stable with active strategies and risk management
  * WebSocket connections operational for real-time updates
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```