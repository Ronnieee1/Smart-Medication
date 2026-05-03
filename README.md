# 💊 Smart Medication - Automated Medication Management System

A full-stack web application that helps users manage their medications and receive automatic SMS reminders at scheduled times.

## ✨ Features

- 📱 **Medication Management**
  - Add, view, and delete medications
  - Organize by category (Maintenance, Prescription, Vitamins, Supplements)
  - 12-hour time format with AM/PM indicators
  - Calendar view with day-by-day schedule

- 🔔 **SMS Notifications**
  - Automatic SMS reminders at scheduled medication times
  - Reliable background scheduling (every minute check)
  - Duplicate prevention (one SMS per medication per day)
  - Works even when app is closed
  - Test SMS feature to verify setup

- 👤 **User Management**
  - Secure authentication with Supabase
  - User profiles with phone number registration
  - Email-based login/registration
  - Progress tracking and medicine intake history

- 📊 **Dashboard**
  - Calendar with medication overview
  - Day view with detailed schedule
  - Progress tracking with status filters
  - Medicine intake history

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type-safe code
- **Vite** - Lightning-fast build tool
- **Supabase JS Client** - Database & Auth
- **React Router** - Navigation

### Backend
- **Node.js + Express** - Server framework
- **node-cron** - Job scheduling
- **Twilio** - SMS service
- **Supabase** - Database
- **CORS** - Cross-origin requests

### Database
- **Supabase PostgreSQL** - Main database
- Tables: medications, users, notification_logs

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Supabase account (free at supabase.com)
- Twilio account (free at twilio.com)

### Installation

1. **Clone and install dependencies**
```bash
npm install
```

2. **Set up Twilio account**
   - Go to https://www.twilio.com/console
   - Get Account SID, Auth Token, and Phone Number

3. **Get Supabase credentials**
   - Go to your Supabase project dashboard
   - Settings > API > Copy Anon Key and Service Role Key

4. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your credentials
```

5. **Run database migration**
   - Open Supabase SQL Editor
   - Run all SQL from `database.migration.sql`

6. **Start development servers**
```bash
npm run dev:all
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 📖 Documentation

- **[Quick Start Guide](./QUICK_START_SMS.md)** - 5-minute setup
- **[SMS Setup Guide](./SMS_SETUP_GUIDE.md)** - Detailed documentation
- **[Database Schema](./database.migration.sql)** - Database structure

## 🎯 How It Works

### User Flow
1. User signs up/logs in
2. User enters phone number in Profile tab
3. User adds medications with times
4. Backend checks every minute if any medications are due
5. SMS reminder is sent at scheduled time
6. User receives notification on phone

### Architecture
```
React App (Frontend)
    ↓
Express Server (Backend)
    ↓ (Every minute)
Supabase Database Query
    ↓
Twilio SMS API
    ↓
User's Phone
```

## 📱 Usage Guide

### Adding Medications
1. Click "+ Add new medication" button
2. Fill in medication details:
   - Name (e.g., "Aspirin")
   - Dosage (e.g., "1 tablet")
   - Time (in 24-hour format)
   - Category (Maintenance/Prescription/Vitamins/Supplements)
3. Save

### Setting Up SMS Notifications
1. Go to Profile tab (◈ icon)
2. Click "Set Phone Number"
3. Enter phone number (+1234567890 format)
4. Save
5. Optional: Click "Send Test SMS" to verify

### Viewing Schedule
- **Main Tab**: Overview of medications by period (AM/PM)
- **Day View**: Click calendar date for detailed schedule
- **Progress Tab**: Track medication adherence

## 🔑 Environment Variables

Required `.env` variables:

```env
# Frontend
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Backend
SERVER_PORT=3001
VITE_API_URL=http://localhost:3001
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

See `.env.example` for template.

## 🏗️ Project Structure

```
smart-medication/
├── src/
│   ├── api/
│   │   └── medicationService.ts         # API client
│   ├── components/
│   │   └── ProtectedRoute.tsx          # Auth guard
│   ├── context/
│   │   └── AuthContext.tsx             # Auth state
│   ├── lib/
│   │   └── database.ts                 # Supabase client
│   ├── pages/
│   │   ├── Dashboard.tsx               # Main app
│   │   ├── Dashboard.css
│   │   └── LoginRegister.tsx
│   ├── App.tsx                         # Root component
│   └── main.tsx
├── server.js                           # Backend server
├── database.migration.sql              # Database setup
├── SMS_SETUP_GUIDE.md                 # Detailed guide
├── QUICK_START_SMS.md                 # Quick start
├── .env.example                        # Environment template
└── package.json
```

## 🐛 Troubleshooting

### Backend not starting
- Check port 3001 is available
- Try: `npm run dev:server`
- Check error messages in terminal

### SMS not sending
- Verify phone number format: `+1234567890`
- Check Twilio credentials in .env
- Run `npm run dev:all` to ensure backend is running
- Check backend logs for errors

### Medications not loading
- Verify Supabase connection
- Check RLS policies are enabled
- Verify user ID is correct
- Check browser console for errors

### Test SMS fails
- Verify Twilio account has credits/minutes
- Check phone number is in international format
- Verify backend is running

See **[SMS_SETUP_GUIDE.md](./SMS_SETUP_GUIDE.md)** for detailed troubleshooting.

## 📝 Available Scripts

```bash
# Start frontend only
npm run dev

# Start backend only
npm run dev:server

# Start both frontend and backend
npm run dev:all

# Build frontend
npm build

# Run linter
npm lint

# Preview production build
npm preview
```

## 🔐 Security

- Never commit `.env` file
- Keep `SUPABASE_SERVICE_ROLE_KEY` secure (backend only)
- Use environment secrets on hosting platforms
- Validate phone numbers before saving
- Use HTTPS in production

## 📊 Database

### Medications Table
- Stores user medications with times and dosages
- RLS policies ensure users can only access their own

### Users Table
- Stores phone numbers for SMS notifications
- One record per user

### Notification Logs
- Tracks all sent SMS notifications
- Useful for debugging and compliance

## 🚀 Deployment

### Frontend
- Deploy to Vercel, Netlify, or GitHub Pages
- Update `VITE_API_URL` to backend URL

### Backend
- Deploy to Heroku, Railway, AWS, Google Cloud
- Set environment variables on hosting platform
- Ensure continuous uptime for scheduler

## 📄 License

MIT

## 🤝 Support

For issues or questions:
1. Check troubleshooting section above
2. Review [SMS_SETUP_GUIDE.md](./SMS_SETUP_GUIDE.md)
3. Check Supabase and Twilio documentation

## 🎉 Features Roadmap

- [ ] Multiple notifications per medication
- [ ] Email notifications
- [ ] Medication interaction warnings
- [ ] Refill reminders
- [ ] Family sharing
- [ ] Wearable device integration
- [ ] Custom SMS templates
- [ ] Medication history export

---

**Smart Medication** - Making medication management simple and reliable.

import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
