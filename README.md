# BizConnect 🔗

> **A full-stack MERN business directory and appointment booking platform** — built for business owners who want a professional online presence, and customers who want to discover and book local services effortlessly.

---

## ✨ Features

### For Customers
- 🔍 **Smart Search** — Real-time search with text index, filter by category, city, price range, and rating
- 📅 **Multi-step Booking** — Pick a service → choose a date → select a time slot → confirm
- ⭐ **Reviews & Ratings** — Rate businesses after your appointment, read owner replies
- ❤️ **Favourites** — Save businesses for quick access later
- 🔔 **Email Notifications** — Booking confirmations and reminders sent automatically
- 📱 **Responsive** — Fully usable on mobile, tablet, and desktop

### For Business Owners
- 🏢 **Business Profile** — Set name, category, tagline, description, tags, price range
- 🖼️ **Image Management** — Upload cover photo and logo directly from your dashboard
- ✏️ **Edit Everything** — Update business details, working hours, contact info, social links anytime
- 📊 **Analytics Dashboard** — Monthly booking charts, status breakdown, popular services
- 🗓️ **Appointment Management** — Confirm, reject, or complete bookings in one click
- 📦 **Service Management** — Add, edit, and delete your services with pricing and duration
- 💬 **Reply to Reviews** — Respond publicly to customer feedback

### Platform
- 🔒 **Secure Authentication** — JWT + bcrypt, HTTP-only considerations, rate limiting, NoSQL injection protection

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Redux Toolkit, Recharts, Framer Motion |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose |
| **Authentication** | JWT + bcryptjs |
| **Image Storage** | Cloudinary + Multer |
| **Email** | Nodemailer (Gmail/SMTP) |
| **Security** | Helmet, express-rate-limit, express-mongo-sanitize, compression |

---

## 📁 Project Structure

```
bizconnect/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection, Cloudinary, Nodemailer, Swagger
│   │   ├── controllers/     # Route handlers (business, auth, reviews, etc.)
│   │   ├── middleware/      # JWT auth, role authorization, error handler
│   │   ├── models/          # Mongoose schemas (User, Business, Appointment, Review…)
│   │   ├── routes/          # Express routers
│   │   ├── services/        # Email service
│   │   └── utils/           # Helpers
│   ├── .env.example         # Environment variable template — copy to .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/             # Axios client + per-resource API modules
    │   ├── components/      # Reusable UI components (StarRating, BusinessCard…)
    │   ├── hooks/           # Custom React hooks
    │   ├── pages/           # Route-level page components
    │   └── store/           # Redux slices (auth, theme)
    ├── public/              # Static assets (favicon, icons)
    ├── index.html
    └── package.json
```

---

## ⚙️ Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Cloudinary** account (free tier is fine) — for image uploads
- **Gmail App Password** (optional) — for email notifications

---

### 1. Clone the repo

```bash
git clone https://github.com/your-username/bizconnect.git
cd bizconnect
```

### 2. Set up the Backend

```bash
cd backend

# Copy the environment template
cp .env.example .env
# Then open .env and fill in your values (see Environment Variables below)

npm install
npm run dev        # API starts at http://localhost:5000
```

### 3. Set up the Frontend

```bash
cd ../frontend
npm install
npm run dev        # App starts at http://localhost:5173
```

Both servers must be running simultaneously.

---

## 🔑 Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
# ── Database ──────────────────────────────────────
MONGO_URI=mongodb://localhost:27017/bizconnect

# ── Server ────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ── Authentication ────────────────────────────────
JWT_SECRET=replace_with_a_long_random_secret_string
JWT_EXPIRE=7d

# ── Cloudinary (image uploads) ────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── Email notifications (optional) ───────────────
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=BizConnect <noreply@bizconnect.com>

# ── CORS ──────────────────────────────────────────
CLIENT_URL=http://localhost:5173
```

> **Never commit your `.env` file.** It is listed in `.gitignore`.

---

## 👤 User Roles

| Role | What They Can Do |
|---|---|
| **Customer** | Browse businesses, book appointments, write reviews, save favourites |
| **Business Owner** | Manage their profile, images, services, appointments, view analytics |
| **Admin** | View platform stats, manage all users and businesses |

---

## 🔌 API Overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Create a new account |
| `POST` | `/api/auth/login` | — | Login and receive JWT |
| `GET` | `/api/auth/me` | ✅ | Get current user |
| `GET` | `/api/businesses` | — | List businesses (search, filter, paginate) |
| `GET` | `/api/businesses/:id` | — | Business profile |
| `GET` | `/api/businesses/:id/slots` | — | Available booking slots |
| `POST` | `/api/businesses` | Owner | Create business profile |
| `PUT` | `/api/businesses/:id` | Owner | Update business details + images |
| `GET` | `/api/appointments` | ✅ | List my appointments |
| `POST` | `/api/appointments` | Customer | Book an appointment |
| `PUT` | `/api/appointments/:id/status` | ✅ | Confirm / cancel / complete |
| `GET` | `/api/reviews/business/:businessId` | — | Reviews for a business |
| `POST` | `/api/reviews` | Customer | Submit a review |
| `POST` | `/api/reviews/sync-ratings` | ✅ | Recalculate all business ratings |
| `GET` | `/api/categories` | — | All categories |
| `GET` | `/api/services` | — | Services for a business |
| `GET` | `/api/favorites` | Customer | My favourites |
| `GET` | `/api/admin/analytics/platform` | Admin | Platform-wide stats |

📖 Full interactive docs: **http://localhost:5000/api/docs**

---

## 📸 Pages

| Route | Description |
|---|---|
| `/` | Landing page — hero, categories, featured businesses |
| `/businesses` | Explore directory — search + category + price filter |
| `/businesses/:id` | Business profile — overview, services, gallery, reviews, hours |
| `/book/:businessId` | Multi-step booking flow |
| `/dashboard/customer` | Customer hub — appointments, favourites, reviews |
| `/dashboard/business` | Owner hub — analytics, appointments, services, edit profile |
| `/dashboard/admin` | Admin panel — platform stats, user/business management |
| `/login` · `/register` | Auth pages |

---

## 🛠️ Available Scripts

### Backend
```bash
npm run dev      # Start with nodemon (hot-reload)
npm start        # Start in production mode
```

### Frontend
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production → dist/
npm run preview  # Preview the production build
npm run lint     # Run oxlint
```

---

## 📄 License

MIT — free to use, modify, and distribute.
