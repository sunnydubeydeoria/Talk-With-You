# ChatSphere - Real-Time Chat Application

A modern, secure, and feature-rich real-time chat application built with React, TypeScript, and Supabase.

![ChatSphere](https://img.shields.io/badge/React-18.2.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3+-38B2AC.svg)
![Supabase](https://img.shields.io/badge/Supabase-1.0+-3ECF8E.svg)

## ✨ Features

### 🚀 Core Functionality
- **Real-time messaging** with instant message delivery
- **Room-based chat** system with unique room IDs
- **User presence** and typing indicators
- **Message history** with pagination support
- **Cross-platform compatibility** (desktop, tablet, mobile)

### 🔒 Security & Performance
- **XSS protection** with DOMPurify content sanitization
- **Rate limiting** to prevent message spam (1 message/second)
- **Input validation** with comprehensive Zod schemas
- **Environment variable validation** for secure deployments
- **Connection health monitoring** with automatic retry logic
- **Offline message queue** for unreliable connections

### 🎨 User Experience
- **Responsive design** optimized for all screen sizes
- **Dark mode** with beautiful gradient backgrounds
- **Smooth animations** and transitions
- **Error boundaries** with graceful fallbacks
- **Loading states** and connection status indicators
- **Accessibility features** with proper ARIA labels

### ⚡ Performance Optimizations
- **Code splitting** and lazy loading for faster initial load
- **Bundle optimization** with vendor chunks
- **Memoized components** to prevent unnecessary re-renders
- **Efficient database queries** with pagination
- **Real-time subscriptions** with proper cleanup

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Build Tools**: Vite + ESLint + Prettier

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chatsphere.git
   cd chatsphere
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
```

## 📋 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run preview      # Preview production build

# Building
npm run build        # Build for production
npm run type-check   # Run TypeScript type checking

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier

# Testing (when implemented)
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests
```

## 🏗️ Project Structure

```
chatsphere/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── chat/           # Chat-specific components
│   │   └── ui/             # shadcn/ui components
│   ├── pages/              # Route components
│   ├── integrations/       # External service integrations
│   │   └── supabase/       # Supabase client setup
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
├── supabase/              # Database schema and migrations
├── package.json
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── README.md
```

## 🔧 Development

### Local Development Setup

1. **Supabase Setup**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run the provided SQL schema in the Supabase SQL editor
   - Update your environment variables

2. **Database Schema**
   The application uses the following main tables:
   - `rooms` - Chat room information
   - `messages` - Chat messages with real-time sync
   - `room_participants` - Room user membership
   - `typing_indicators` - Real-time typing status

### Code Quality

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript strict mode** for type safety
- **Husky** (when configured) for pre-commit hooks

### Building for Production

```bash
npm run build
```

The optimized build will be in the `dist` folder, ready for deployment.

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your GitHub repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy automatically** on `git push`

### Other Platforms

- **Netlify**: Connect repository and set up build command `npm run build`
- **AWS Amplify**: Import repository with build settings
- **Docker**: Use the provided Dockerfile (if available)

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for providing the backend infrastructure
- **shadcn/ui** for the beautiful UI components
- **Vercel** for hosting the demo
- **React Team** for the amazing framework

## 📞 Support

If you encounter any issues or have questions:

- 🐛 [Report a bug](https://github.com/yourusername/chatsphere/issues/new?template=bug_report.md)
- 💡 [Request a feature](https://github.com/yourusername/chatsphere/issues/new?template=feature_request.md)
- 💬 [Start a discussion](https://github.com/yourusername/chatsphere/discussions)

---

**Built with ❤️ by the ChatSphere team**

