# Workspace Management System

A full-stack web application for managing shared workspace business with a loyalty system. Built with Next.js, TailwindCSS, and MySQL.

## Features

### User Roles
- **Client**: Phone-based authentication, booking management, loyalty points
- **Cashier**: PIN-based login, QR code scanning, payment processing
- **Admin**: Full system management with dashboard and analytics

### Core Functionality
- **Booking System**: One-time office bookings with unique codes
- **Subscription Management**: Recurring office rentals
- **Loyalty Program**: Points-based rewards with QR code redemption
- **Office Management**: Admin control over workspace availability and pricing
- **Real-time Dashboard**: Statistics and recent activity tracking

## Tech Stack

- **Frontend**: Next.js 15 with App Router, React 19, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL
- **Authentication**: JWT tokens with role-based access control
- **QR Codes**: react-qr-code for generation and scanning

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd desk
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials and secrets:
```env
DATABASE_URL="mysql://username:password@localhost:3306/workspace_management"
JWT_SECRET="your-super-secret-jwt-key"
CASHIER_PIN="1234"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"
```

4. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## Default Credentials

### Admin
- Username: `admin`
- Password: `admin123`

### Cashier
- PIN: `1234`

### Sample Client
- Phone: `+1234567890`
- Loyalty Points: 150

## Database Schema

The system uses the following main models:
- **User**: Handles all user types (CLIENT, CASHIER, ADMIN)
- **Office**: Workspace definitions with pricing
- **Booking**: One-time office reservations
- **Subscription**: Recurring office rentals
- **LoyaltyReward**: Available rewards for points
- **Redemption**: Tracking of reward redemptions

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Client APIs
- `GET /api/client/subscription` - Get current subscription
- `GET /api/client/offices` - List available offices
- `POST /api/client/booking` - Create new booking
- `GET /api/client/rewards` - List loyalty rewards
- `POST /api/client/redeem` - Redeem loyalty points

### Cashier APIs
- `POST /api/cashier/redeem-qr` - Scan QR code for redemption
- `PUT /api/cashier/redeem-qr` - Confirm redemption
- `POST /api/cashier/booking` - Check booking by code
- `PUT /api/cashier/booking` - Mark booking as paid
- `GET /api/cashier/current-bookings` - View active bookings

### Admin APIs
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET/POST/PUT/DELETE /api/admin/offices` - Office management
- `GET/POST/PUT/DELETE /api/admin/rewards` - Reward management
- `GET/PUT /api/admin/clients` - Client management

## User Flows

### Client Flow
1. Login with phone number
2. View current subscription and loyalty points
3. Create new bookings or renew subscriptions
4. Redeem loyalty points for rewards (generates QR code)

### Cashier Flow
1. Login with PIN
2. Scan QR codes to process reward redemptions
3. Enter booking codes to mark payments
4. View currently active bookings and subscriptions

### Admin Flow
1. Login with username/password
2. View dashboard with business statistics
3. Manage offices (add/edit/delete)
4. Manage loyalty rewards
5. View and manage client accounts

## Deployment

### Database Setup
Ensure your MySQL database is running and accessible. The application will create tables automatically when you run `npm run db:push`.

### Environment Variables
Make sure all environment variables are properly set in production:
- Use strong JWT secrets
- Change default admin credentials
- Use secure database connections

### Build and Deploy
```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
