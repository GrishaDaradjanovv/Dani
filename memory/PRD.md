# WellnessHub - Mental Health Video Platform PRD

## Original Problem Statement
Create a website for mental/self-improvement care where users can upload videos and create posts. Videos (lectures/training) will be unlocked after purchase. Features needed: user registration/account creation, only registered users can purchase videos, blog functionality with user comments, landing page with dropdown menu navigation.

## User Choices
- Payment: Stripe (test key provided)
- Video Storage: Cloud-ready (URLs stored in DB)
- Authentication: Both JWT-based custom auth AND Google OAuth
- Design: Calming/wellness vibes with natural warm colors (cream, terracotta, sage, sun)

## User Personas
1. **Wellness Seeker** - Individual looking for mental health improvement content
2. **Content Consumer** - User browsing free blog content before committing to purchase
3. **Premium Member** - Registered user who has purchased courses

## Core Requirements (Static)
- [x] User registration with email/password
- [x] Google OAuth social login
- [x] Video course catalog with filtering
- [x] Video purchase via Stripe checkout
- [x] Protected video content (unlocked after purchase)
- [x] Blog with free articles
- [x] Comment system on blog posts
- [x] User dashboard with purchased courses
- [x] Dropdown navigation menu

## Architecture

### Backend (FastAPI)
- **Auth**: JWT tokens + Emergent Google OAuth + session cookies
- **Database**: MongoDB with collections:
  - `users` - User accounts
  - `user_sessions` - OAuth sessions
  - `videos` - Course content
  - `purchases` - User purchases
  - `payment_transactions` - Stripe transactions
  - `blog_posts` - Blog articles
  - `comments` - Blog comments

### Frontend (React)
- **Routing**: React Router v7
- **Styling**: Tailwind CSS with custom design system
- **Components**: Shadcn UI (dropdown-menu, tabs, toast, etc.)
- **State**: React hooks for auth management

## What's Been Implemented (January 2025)

### MVP Features
1. **Landing Page** - Hero section, features, benefits, CTAs
2. **Authentication** - Register, Login, Google OAuth, Protected routes
3. **Video Catalog** - Browse courses with search/filter
4. **Video Detail** - Course info, purchase flow, video player
5. **Stripe Checkout** - Payment processing with polling
6. **Blog System** - Article listing, detail view, comments
7. **User Dashboard** - Profile, purchased courses, stats
8. **Navigation** - Floating glassmorphism navbar with dropdown menu

### Design System
- Colors: Cream (#F4F1DE), Terracotta (#E07A5F), Sage (#81B29A), Sun (#F2CC8F), Deep Navy (#3D405B)
- Fonts: Fraunces (headings), Manrope (body)
- Style: Glassmorphism navbar, rounded corners, soft shadows

### Seeded Data
- 6 video courses across categories (Meditation, Mental Health, Wellness, Personal Growth)
- 3 blog posts with wellness content

## Prioritized Backlog

### P0 (Critical for Launch)
- [x] Core authentication flow
- [x] Video purchase flow
- [x] Basic content display

### P1 (Important)
- [ ] Admin panel for content management
- [ ] Video upload functionality (cloud storage integration)
- [ ] Email notifications for purchases
- [ ] Password reset flow

### P2 (Nice to Have)
- [ ] Course progress tracking
- [ ] Bookmarking/favorites
- [ ] Social sharing for blog posts
- [ ] Newsletter subscription
- [ ] Search engine optimization

## Next Action Items
1. Implement admin dashboard for managing videos/blog posts
2. Add cloud storage integration (AWS S3/Google Cloud) for video uploads
3. Add email confirmation on registration
4. Implement course progress tracking
5. Add password reset functionality
