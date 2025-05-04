# AI Moderation Platform

A Next.js application featuring real-time content moderation with Supabase authentication and WebSockets.

## Features

- **User Page**: Anonymous users can create text and image posts
- **Admin Dashboard**: Authenticated administrators can review and moderate posts
- **Real-time Updates**: WebSocket integration for instant updates between users and admins
- **Authentication**: Supabase authentication with anonymous sign-in for users and email/password for admins

## Setup Instructions

### 1. Supabase Setup

1. Create a Supabase account at [https://supabase.com](https://supabase.com) and create a new project
2. From your Supabase dashboard, get your project URL and API keys
3. Copy the `.env.example` file to `.env.local` and update with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Create Admin Account

Use the provided script to create an admin account:

```bash
npx tsx scripts/create-admin.ts
```

Follow the prompts to create an admin user (recommended email: admin@admin.com).

### 4. Start the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

- **User Access**: Navigate to `/user` to access the user interface where you can create posts anonymously
- **Admin Access**: Navigate to `/login` to log in with your admin credentials, then access the admin dashboard at `/admin`

## How It Works

1. **Anonymous Authentication**: Regular users are automatically signed in anonymously when they visit the `/user` page
2. **Real-time Communication**: WebSockets enable instant updates between users and administrators
3. **Admin Authentication**: Administrators must log in with their credentials to access the moderation dashboard
4. **Post Moderation**: Admins can remove posts or mark them as false positives, with real-time updates for users

## Technical Implementation

- **Frontend**: Next.js app router, React, TypeScript, Tailwind CSS
- **Authentication**: Supabase Auth with anonymous and email/password strategies
- **Real-time**: Socket.IO for WebSocket communication between users and admins
- **State Management**: React hooks for local state management

## Production Deployment

For production deployment, follow the [Next.js deployment documentation](https://nextjs.org/docs/deployment).

When deploying to production, ensure your environment variables are properly set in your hosting platform.
