# Padel League Platform

A scalable, professional MERN-based Padel League Platform with a premium Glassmorphism UI, real-time matchmaking, and comprehensive league management features.

## Project Structure
- **/server**: Node.js & Express backend with MongoDB (Mongoose), featuring cron jobs for automated league management.
- **/client**: React (Vite) frontend with Tailwind CSS, Framer Motion for animations, and Lucide for iconography.

## Prerequisites
- **Node.js**: v18+ recommended
- **MongoDB**: A running instance (local or Cloud Atlas)

## Getting Started

### 1. Server Setup
Go to the server directory:
```bash
cd server
```

Install dependencies:
```bash
npm install
```

Configure Environment:
Create a `.env` file in the `server` folder (refer to the existing `.env` or create one) with:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/padel-league
JWT_SECRET=your_jwt_secret_here
```

Start the server:
```bash
# For development (with nodemon)
npm run dev

# For production
npm start
```

### 2. Client Setup
Go to the client directory:
```bash
cd client
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

The application should now be accessible at `http://localhost:5173` (Vite's default port).

## Core Features
1. **Premium Dashboard**: Real-time stats, matchmaking toggles, and active match tracking.
2. **Intelligent Matchmaking**: Filters opponents by rank, distance, and "last opponent" logic to prevent repeats.
3. **Automated League Management**:
   - 48-hour auto-confirmation of match results.
   - 7-day cooldown periods after matches.
   - 30-day inactivity protection (squads move to Inactive if no play).
4. **Solo Pool (Friendly Mode)**: Allows players to find matches regardless of ranking for casual play.
5. **Mobile First Design**: Fully responsive across all devices (Smartphones, Tablets, Desktop).

## Admin Controls
Access `/admin` to:
- Force match specific squads.
- Manage squad statuses (Enable/Disable).
- Override disputed results.

## License
ISC
