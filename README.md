# MediStore Lite

A fully-functional MVP for a SaaS pharmacy management system.

## Setup Instructions

### 1. Supabase Setup
This project uses [Supabase](https://supabase.com) for Authentication and PostgreSQL database.

1. Create a new Supabase project.
2. In your Supabase dashboard, go to the SQL Editor and run the SQL provided in `database.sql` to create your tables and RLS policies.
3. Obtain your Project URL and Anon Key from the API settings.

### 2. Environment Variables
1. Copy `.env.example` to `.env.local`
```bash
cp .env.example .env.local
```
2. Add your Supabase credentials to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Locally
1. Install dependencies:
```bash
npm install
```
2. Start the development server:
```bash
npm run dev
```
3. Open [http://localhost:3000](http://localhost:3000)

### 4. Deployment
This project is configured for seamless deployment on Vercel:
1. Push to a GitHub repository.
2. Import the repository in Vercel.
3. Add the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as Environment Variables in your Vercel project settings.
4. Deploy!
