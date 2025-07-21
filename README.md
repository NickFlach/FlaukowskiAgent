# Flaukowski - Autonomous Crypto Trading Agent

A sophisticated autonomous cryptocurrency trading agent with Web3 authentication and real-time market analysis. Built with React, Express.js, and PostgreSQL.

## Features

- **Web3 Authentication**: Secure wallet-based login with MetaMask integration
- **Autonomous Trading**: Multiple trading strategies (DCA, Momentum, Arbitrage)
- **Risk Management**: Circuit breakers and configurable risk parameters
- **Real-time Updates**: WebSocket-powered live market data and trading activity
- **Portfolio Analytics**: Comprehensive performance tracking and visualization
- **Activity Logging**: Complete audit trail of all trading actions

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast builds
- TanStack Query for state management
- Radix UI + Tailwind CSS
- Web3 integration with ethers.js

### Backend
- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- WebSocket for real-time updates
- Node.js 20

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- MetaMask wallet

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/flaukowski.git
cd flaukowski
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your database URL and other configurations
```

4. Run database migrations
```bash
npm run db:push
```

5. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Production Deployment

1. Build the application
```bash
npm run build
```

2. Start the production server
```bash
npm start
```

## Configuration

See `.env.example` for all available configuration options including:
- Database connection
- Trading parameters
- Risk management settings
- WebSocket configuration

## License

MIT License - see LICENSE file for details