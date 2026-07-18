# BizConnect – Business Directory & Appointment Booking Platform

A modern, full-stack MERN application that allows businesses to create public profiles and enables customers to discover and book appointments online.

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS, Redux Toolkit, Recharts |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Images | Cloudinary + Multer |
| Email | Nodemailer |
| API Docs | Swagger/OpenAPI at `/api/docs` |

## 📁 Project Structure

```
bizconnect/
├── backend/                 # Express API
│   ├── src/
│   │   ├── config/          # DB, Cloudinary, email, Swagger
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth, error handler
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routes
│   │   └── services/        # Email service
│   └── .env.example
└── frontend/                # React + Vite
    └── src/
        ├── api/             # Axios API layer
        ├── components/      # Reusable components
        ├── pages/           # Route pages
        └── store/           # Redux slices
```

## 🛠️ Setup & Running

### 1. Backend

```bash
cd bizconnect/backend
# Copy and edit environment variables
cp .env.example .env
# Fill in: MONGO_URI, CLOUDINARY_*, EMAIL_* credentials

npm install
npm run dev    # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd bizconnect/frontend
npm install
npm run dev    # starts on http://localhost:5173
```

### 3. Environment Variables (backend/.env)

```env
MONGO_URI=mongodb://localhost:27017/bizconnect
PORT=5000
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=BizConnect <noreply@bizconnect.com>

CLIENT_URL=http://localhost:5173
```

## 👤 User Roles

| Role | Capabilities |
|---|---|
| **Customer** | Browse, search, book appointments, leave reviews, save favorites |
| **Business Owner** | Manage profile, services, appointments, view analytics |
| **Admin** | Approve businesses, manage users, view platform stats |

## 🔑 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/businesses` | List businesses (filters, pagination) |
| GET | `/api/businesses/:id` | Business profile |
| GET | `/api/businesses/:id/slots` | Available time slots |
| POST | `/api/appointments` | Book appointment |
| PUT | `/api/appointments/:id/status` | Update status |
| GET | `/api/reviews/business/:id` | Business reviews |
| GET | `/api/admin/analytics/platform` | Platform analytics |

Full Swagger docs at: **http://localhost:5000/api/docs**

## ✨ Features

- 🔍 **Smart Search** – Real-time suggestions with text search
- 📅 **Multi-step Booking** – Service → Date → Time → Confirm
- ⭐ **Reviews System** – Ratings, comments, owner replies
- 📊 **Analytics Dashboards** – Charts for bookings, revenue, popular services
- 🌙 **Dark Mode** – System-aware with toggle
- 📱 **Responsive** – Mobile-first design
- 🔔 **Email Notifications** – Booking confirmations, reminders
- 🛡️ **Business Verification** – Admin-approved badges
- ❤️ **Favorites** – Save preferred businesses
- 🔒 **Secure Auth** – JWT + bcrypt, rate limiting, sanitization

## 📸 Key Pages

- `/` – Landing with hero, categories, featured businesses
- `/businesses` – Directory with search + filters
- `/businesses/:id` – Profile with tabs (overview, services, gallery, reviews, hours)
- `/dashboard/customer` – Appointments, favorites, reviews
- `/dashboard/business` – Analytics, appointment management, services
- `/dashboard/admin` – Platform stats, user management
