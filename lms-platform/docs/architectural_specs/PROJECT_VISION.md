# Project Scope & Vision: LMS for Mentors (Balance Nutrition)

## 📌 Vision Statement
To create a high-fidelity, clinical-first Learning Management System (LMS) that transforms newly joined nutritionists into elite **Balance Nutrition Mentors**. The platform bridges the gap between academic knowledge and the "BN Way" of clinical excellence, sales mastery, and client engagement.

---

## 🛠 Tech Stack & Architecture
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Framer Motion (Aesthetics)
- **Backend/Auth**: Supabase (PostgreSQL + Auth)
- **AI Engine**: Groq SDK (Llama 3.3 70B) for automated assessment generation
- **Styling**: Premium "Clinical-Aesthetic" UI with deep teal (#0E5858) and ivory (#FAFCEE) palette

---

## 🔑 Environment Variables & Security Tokens
> **IMPORTANT**: These keys must be added to the Vercel Dashboard (Settings > Environment Variables). **DO NOT** commit these to GitHub.

| Key | Value | Purpose |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | `[SECURE_ON_VERCEL]` | AI Quiz & Content Generation |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rdufqyorwprqxhwjqrrr.supabase.co` | Database API Endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (See .env.local) | Client-side DB Access |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (See .env.local) | Admin/Bypass RLS Access |

---

## 🚀 Core Features & Modules
1. **Module 1-3: Orientation & Consultation**: Brand immersion, case study analysis, and call recordings.
2. **Module 4: Dashboard Mastery**: Training on the internal "Counselor Operating System."
3. **Admin Command Center**: 
   - **Provision Keys**: Create mentor accounts and sync profiles.
   - **Content Architect**: Live-update the training syllabus.
   - **Mentor Logs**: Track real-time training progress and quiz scores.
4. **AI Assessment Engine**: Generates high-stakes clinical MCQs dynamically based on topic content.
5. **Interactive Syllabus**: Vertical timeline view with built-in YouTube playback and assignment forms.

---

## 🔧 Critical Fixes & Improvements Needed
Areas that require immediate technical attention:

1. **Authentication Flow Reliability**:
   - Ensure the `sync-profile` route handles high-concurrency when many mentors join simultaneously.
   - Add a "Forgot Password" flow for mentors.

2. **Mobile Optimization**:
   - The Admin "Mentor Logs" table needs a responsive "Card View" for mobile devices.
   - The YouTube player component needs better aspect-ratio handling on small screens.

3. **Content Management**:
   - The "Content Architect" currently only simulates updates in the UI state. It needs to be connected to a `syllabus` table in Supabase so changes persist across sessions.

4. **Performance**:
   - Implement `SWR` or `React Query` for the Admin Dashboard to prevent repetitive fetching of mentor stats.

---

## 📈 Future Roadmap
- **Live Simulator**: A "Flight Simulator" for clinical calls where AI plays the role of a difficult client.
- **Certification Engine**: Automatic generation of PDF certificates upon completion of all modules.
- **Peer Leaderboard**: Gamification to encourage mentors to complete training faster.
- **Resource Search**: A "Global Search" across all clinical manuals and PDFs.

---
*Last Updated: February 20, 2026*
