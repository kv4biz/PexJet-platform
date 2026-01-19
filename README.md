# PexJet Platform

A comprehensive private jet charter platform built with Next.js, featuring a public website, admin dashboard, and operator dashboard.

## 🏗️ Project Structure

This is a **Turborepo monorepo** containing:

```
pexjet-platform/
├── apps/
│   ├── website/          # Public website (pexjet.com)
│   ├── admin/            # Admin dashboard (admin.pexjet.com)
│   └── operator/         # Operator dashboard (operator.pexjet.com)
├── packages/
│   ├── database/         # Prisma schema & database client
│   ├── ui/               # Shared UI components (shadcn/ui)
│   ├── lib/              # Shared utilities
│   └── types/            # Shared TypeScript types
└── ...config files
```

## 🚀 Apps Overview

### Website (Public)

The client-facing website where users can:

- View and search empty leg deals
- Request quotes for charter flights
- Subscribe for empty leg alerts via WhatsApp
- Browse available aircraft
- Contact PexJet
- Learn about services and company

**Tech Stack:** Next.js 14, React, Tailwind CSS, shadcn/ui, Framer Motion

### Admin Dashboard

Internal dashboard for PexJet staff to:

- Manage charter and empty leg quotes
- Create/update empty leg deals
- Manage aircraft fleet
- View client subscriptions
- Handle payments and transactions
- View analytics and logs

**Tech Stack:** Next.js 14, React, Tailwind CSS, shadcn/ui

### Operator Dashboard

Dashboard for aircraft operators to:

- Manage their fleet (up to 10 aircraft)
- Create and manage empty leg deals
- Handle booking quote requests (approve/reject)
- Track payments and earnings history
- View commission structure

**Tech Stack:** Next.js 14, React, Tailwind CSS, shadcn/ui

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **Monorepo:** Turborepo
- **Notifications:** Twilio (WhatsApp)
- **Payments:** Paystack
- **Email:** Nodemailer
- **PDF Generation:** PDFKit

## 📦 Installation

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/pexjet-platform.git
   cd pexjet-platform
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example env files:

   ```bash
   cp .env.example .env
   cp apps/website/.env.example apps/website/.env
   cp apps/admin/.env.example apps/admin/.env
   ```

4. **Configure your `.env` files** with:

   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/pexjet"

   # Twilio (WhatsApp)
   TWILIO_ACCOUNT_SID="your_account_sid"
   TWILIO_AUTH_TOKEN="your_auth_token"
   TWILIO_WHATSAPP_NUMBER="whatsapp:+1234567890"

   # Paystack
   PAYSTACK_SECRET_KEY="your_secret_key"
   PAYSTACK_PUBLIC_KEY="your_public_key"

   # Email (Nodemailer)
   SMTP_HOST="smtp.example.com"
   SMTP_PORT="587"
   SMTP_USER="your_email"
   SMTP_PASS="your_password"
   ```

5. **Set up the database**

   ```bash
   cd packages/database
   npx prisma generate
   npx prisma db push
   ```

6. **Import airport data** (optional)
   ```bash
   # The airports.csv, countries.csv, and regions.csv files are from OurAirports.com
   # Import them using the provided SQL scripts or Prisma seed
   ```

## 🏃 Development

### Run all apps

```bash
npm run dev
```

### Run specific app

```bash
# Website only
npm run dev --filter=website

# Admin only
npm run dev --filter=admin
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## 🚢 Deployment

### Vercel (Recommended)

#### Deploy Website

1. Import repo to Vercel
2. Set **Root Directory:** `apps/website`
3. Add environment variables
4. Deploy

#### Deploy Admin Dashboard

1. Create new Vercel project
2. Import same repo
3. Set **Root Directory:** `apps/admin`
4. Add environment variables
5. Deploy

#### Deploy Operator Dashboard

1. Create new Vercel project
2. Import same repo
3. Set **Root Directory:** `apps/operator`
4. Add environment variables
5. Deploy

### Environment Variables for Production

Ensure all environment variables are set in your Vercel project settings.

## 📁 Key Files & Directories

### Website (`apps/website/`)

```
src/
├── app/                  # Next.js App Router pages
│   ├── api/              # API routes
│   │   ├── quotes/       # Charter & empty leg quote endpoints
│   │   ├── subscriptions/# Newsletter subscription endpoints
│   │   └── ...
│   ├── charter/          # Charter page
│   ├── empty-legs/       # Empty legs page
│   ├── aircraft/         # Aircraft fleet page
│   ├── contact/          # Contact page
│   ├── services/         # Services page
│   └── about/            # About pages
├── components/           # React components
├── data/                 # Static content data
└── lib/                  # Utilities
```

### Database (`packages/database/`)

```
prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Database seeding
```

## 🎨 UI Guidelines

- **Components:** Use only shadcn/ui components
- **Styling:** Tailwind CSS with no rounded corners
- **Colors:** Metallic gold (#D4AF37), black, white, grays
- **Icons:** Lucide React
- **Animations:** Framer Motion (subtle)

## 🔔 Notifications

### WhatsApp Notifications (via Twilio)

- Admin notifications for new quote requests
- Admin notifications for new subscriptions
- Client notifications for quote status updates
- Payment confirmations

### Email Notifications (via Nodemailer)

- Payment receipts
- Flight confirmation documents

## 💳 Payments

Payments are processed via **Paystack**:

- Direct payments for charter quotes
- Split payments for operator empty legs (admin cut + operator cut)

## 📊 Database Schema

Key models:

- `Admin` - Admin/staff users
- `Operator` - Aircraft operators
- `Aircraft` - Fleet aircraft
- `EmptyLeg` - Empty leg deals
- `CharterQuote` - Charter flight quotes
- `EmptyLegQuote` - Empty leg quotes
- `EmptyLegSubscription` - Alert subscriptions
- `Airport` - Airport data (from OurAirports)
- `Payment` - Transaction records
- `AuditLog` - Action logging

## 🔐 Security

- No public registration (admin creates all accounts)
- Password hashing with bcrypt
- JWT authentication
- Role-based access control
- Audit logging for all actions

## 📝 License

Proprietary - All rights reserved.

## 👥 Contact

For questions or support, contact the PexJet team.

---

Built with ❤️ for PexJet
