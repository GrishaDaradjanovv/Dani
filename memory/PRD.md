# WellnessHub - Mental Health Video Platform PRD

## Original Problem Statement
Create a website for mental/self-improvement care where users can upload videos and create posts. Videos (lectures/training) will be unlocked after purchase. Features needed: user registration/account creation, only registered users can purchase videos, blog functionality with user comments, landing page with dropdown menu navigation, admin panel, sidebar with 5 service pages, shop for physical products.

## User Choices
- Payment: Stripe (test key provided)
- Video Storage: Cloud-ready (URLs stored in DB)
- Authentication: Both JWT-based custom auth AND Google OAuth
- Design: Calming/wellness vibes with natural warm colors (cream, terracotta, sage, sun)
- Admin Email: danimoldovanova@gmail.com
- Service Pages: Speech Therapist, Women's Circle Rose, Bio (About Me), Healing via Dr. Bach Flowers, Psychology

## User Personas
1. **Wellness Seeker** - Individual looking for mental health improvement content
2. **Content Consumer** - User browsing free blog content before committing to purchase
3. **Premium Member** - Registered user who has purchased courses
4. **Admin** - Site owner (danimoldovanova@gmail.com) managing content and orders

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
- [x] Admin panel for managing content
- [x] Sidebar navigation with 5 service pages
- [x] Shop with physical products and shipping

## Architecture

### Backend (FastAPI)
- **Auth**: JWT tokens + Emergent Google OAuth + session cookies
- **Admin**: Email-based admin check (danimoldovanova@gmail.com)
- **Database**: MongoDB with collections:
  - `users` - User accounts
  - `user_sessions` - OAuth sessions
  - `videos` - Course content
  - `purchases` - User video purchases
  - `payment_transactions` - Stripe transactions
  - `blog_posts` - Blog articles
  - `comments` - Blog comments
  - `shop_items` - Physical products
  - `orders` - Shop orders with shipping
  - `pages` - Service page content

### Frontend (React)
- **Routing**: React Router v7
- **Styling**: Tailwind CSS with custom design system
- **Components**: Shadcn UI (dropdown-menu, tabs, toast, etc.)
- **Layout**: Sidebar navigation + floating navbar

## What's Been Implemented (January 2025)

### Phase 1 - MVP
1. **Landing Page** - Hero section, features, benefits, CTAs
2. **Authentication** - Register, Login, Google OAuth, Protected routes
3. **Video Catalog** - Browse courses with search/filter
4. **Video Detail** - Course info, purchase flow, video player
5. **Stripe Checkout** - Payment processing with polling
6. **Blog System** - Article listing, detail view, comments
7. **User Dashboard** - Profile, purchased courses, stats

### Phase 2 - Admin & Shop
1. **Admin System** - Email-based admin check
2. **Admin Panel** - Manage videos, shop items, blog posts, orders
3. **Comment Moderation** - Admin can delete comments
4. **Shop System** - Physical products with categories
5. **Shop Checkout** - Stripe payment with shipping address form
6. **Order Management** - Admin can view and update order status
7. **Sidebar Navigation** - 5 service pages
8. **Service Pages** - Dynamic content pages

### Phase 3 - Enhanced Features
1. **Password Reset** - Via Resend email service
2. **Cloudinary Integration** - Video/image upload to cloud storage
3. **Unified Shopping Cart** - Supports both videos and shop items
4. **Cart Management** - Add/remove items, update quantities
5. **Mixed Checkout** - Combined video + physical product purchase

### Design System
- Colors: Cream (#F4F1DE), Terracotta (#E07A5F), Sage (#81B29A), Sun (#F2CC8F), Deep Navy (#3D405B)
- Fonts: Fraunces (headings), Manrope (body)
- Style: Glassmorphism navbar, sidebar navigation, rounded corners

### Seeded Data
- 6 video courses
- 3 blog posts
- 5 shop items
- 5 service pages content

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Core authentication flow
- [x] Video purchase flow
- [x] Admin panel
- [x] Shop with shipping

### P1 (Important)
- [ ] Email notifications for purchases/orders
- [ ] Video upload to cloud storage (S3)
- [ ] Password reset flow
- [ ] Order tracking notifications

### P2 (Nice to Have)
- [ ] Course progress tracking
- [ ] Inventory management for shop
- [ ] Social sharing for blog posts
- [ ] Newsletter subscription

## Next Action Items
1. Add email notifications (SendGrid/Resend) for order confirmations
2. Integrate cloud storage for actual video file uploads
3. Add inventory tracking when orders are placed
4. Implement password reset flow
