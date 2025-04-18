# Telegram Business Card Creator

A Telegram mini-app that allows users to create customizable business cards with both free and premium features.

## Frontend (React with Shadcn UI)

This project uses:
- Next.js with React
- TypeScript
- Tailwind CSS for styling
- Shadcn UI components
- Dark theme by default

## Project Setup

This project is currently set up as a placeholder with mock components. The actual backend integration with FastAPI will be implemented separately.

### Running the frontend

1. Install dependencies (use one of the following methods):

   **Using the setup script (recommended):**
   - Windows: Run `setup.bat`
   - Unix/Linux/Mac: Run `chmod +x setup.sh && ./setup.sh`

   **Manually:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) to view the application.

## Features

### Free Features
- Basic business card creation
- Personal and contact information
- Social media links
- Dark mode theme

### Premium Features (using Telegram Stars)
- Custom themes
- Animated elements
- HD background images
- Custom QR codes
- Verified badges
- Multiple links
- Video introduction

## Project Structure

```
telegram-business-card/
├── public/            # Static assets
├── src/               # Source files
│   ├── app/           # Next.js app directory
│   │   ├── layout.tsx # Main layout
│   │   ├── page.tsx   # Main page
│   │   └── globals.css # Global styles
│   ├── components/    # React components
│   │   ├── ui/        # UI components (Shadcn)
│   │   ├── business-card-form.tsx
│   │   ├── business-card-preview.tsx
│   │   ├── premium-features.tsx
│   │   └── theme-provider.tsx
│   └── lib/           # Utility functions
└── package.json       # Dependencies
```

## Troubleshooting

If you encounter dependency issues during installation, make sure to use the `--legacy-peer-deps` flag with npm, or use the provided setup scripts.

## Backend (planned with Python FastAPI)

The backend will be implemented separately using Python FastAPI.

## Note

This is a placeholder implementation with static data. The actual implementation will include:
- Actual API integration with the backend
- User authentication via Telegram
- Proper state management
- Payment processing with Telegram Stars
- Data persistence 