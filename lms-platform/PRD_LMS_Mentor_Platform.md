# 📋 Product Requirements Document (PRD): LMS Mentor Platform

## 1. Project Overview & Objective
**Project Name:** Balance Nutrition (BN) LMS Mentor Platform  
**Target Audience:** Internal BN staff (Counsellors, Tech, BD, CS, Training Buddies) and external Nutripreneurs.  
**Purpose:** A unified, interactive platform designed to automate and streamline the training, assessment, and certification of Balance Nutrition mentors. The platform replaces manual progress tracking with a dynamic, AI-powered system that ensures standard quality across all counsellor interactions.

### Core Objectives:
*   **Standardized Training:** Deliver a consistent 5-module training program to all new hires.
*   **Automated Assessment:** Use AI to generate quizzes and grade text-based responses in real-time.
*   **Centralized Resource Hub:** Provide a direct link to all partnership documents and sales assets via the Content Bank and Educators Module.
*   **Efficiency for Admins:** Eliminate spreadsheets by providing a dedicated Admin Portal for monitoring, auditing, and provisioning users.

---

## 2. Technical Architecture
The platform is built with a modern, high-performance stack focusing on speed, scalability, and AI integration.

*   **Framework:** Next.js 14 (App Router) for Server-Side Rendering and optimized routing.
*   **Frontend UI:** Tailwind CSS for styling, Framer Motion for premium micro-animations.
*   **Backend & Database:** Supabase (PostgreSQL) for data storage, Auth, and Row-Level Security (RLS).
*   **AI Engine:** Groq AI (Llama 3/Mixtral) for dynamic quiz generation, simulation logic, and grading.
*   **Communications:** 
    *   **Email:** Custom Mail server (`mail.ts`) for certificates and notifications.
    *   **WhatsApp:** WhatsApp API integration for buddy communication and content sharing.
*   **Deployment:** Vercel (Production URL: `https://lms-counsellors-dashboard.vercel.app`)

---

## 3. Role-Based Access Control (RBAC)
Access is controlled via the `role` column in the `profiles` table.

| Role | Access Level | Primary View |
| :--- | :--- | :--- |
| **Admin / Moderator** | Global control over all users, content, and system configurations. | `/admin` (Hub) |
| **Counsellor** | Full access to all 5 Training Modules + Educators Module. | `/` (Dashboard) |
| **Tech / BD / CS / Buddy** | Limited access (M1 & M2) + specific modules granted by admin. | `/` (Dashboard) |
| **Nutripreneur** | Specialized access path (formerly `/nutripreneur`, now merged with standard dashboard). | `/` (Dashboard) |

---

## 4. API Routes & Integration Endpoints

### Admin Operations (`/api/admin/*`)
*   `dashboard-sync`: Synchronizes progress across the registry.
*   `create-user` / `delete-user`: Account lifecycle management.
*   `content` / `folders`: Dynamic management of segments and content bank.
*   `quiz` / `quiz/suggestions`: Custom quiz configuration and AI question generation.
*   `reports/daily`: Internal stats for system health.
*   `users/reset-history`: Performs a "hard reset" on a user's progress.

### Core Logic & AI
*   `/api/generate-test`: Groq-powered quiz generation for specific topic codes.
*   `/api/grade-exam`: Multi-section grading for certification.
*   `/api/simulate-call`: AI-driven practice simulations.
*   `/api/notify-buddy`: Real-time alerts to assigned training mentors.
*   `/api/send-certificate`: Automatic PDF generation and mailing.

---

## 5. Core Features & Functionalities

### A. User Dashboard (The Learning Hub)
*   **Circular Progress Tracking:** Real-time visual feedback on overall training completion.
*   **"Resume Training" CTA:** Smart navigation that lands the user back on their last incomplete segment.
*   **Training Buddy Card:** One-click contact via WhatsApp for support from senior mentors.
*   **Dynamic Module Cards:** Locked/Unlocked states based on admin-granted permissions.

### B. Training Modules & Segments
*   **Topic Architecture:** Each module is divided into granular "Topics" (TopicCards).
*   **Rich Media Integration:** Inline YouTube video player, document viewer (Docs/Slides), and Google Drive folder embeds.
*   **Module Quizzes:** Forced assessments at the end of each module using MCQ and Text-based questions.
*   **Retention Checks:** Mini-quizzes available at the topic level to reinforce learning.

### C. The Educators Module (CRM Library)
*   **Content Kanban:** A 6-column board (Videos, Gyan, Recipes, etc.) for marketing and client communication.
*   **Semantic Search:** AI-enhanced search that understands context (e.g., "gut" matches "acidity").
*   **WhatsApp Share:** Direct-to-client content delivery with customized messaging fields.

### D. Admin Portal (Super-Admin Suite)
*   **Dashboard Hub:** Global stats on counsellor performance and pass rates.
*   **Provisioning System:** User creation with specific module toggles and buddy assignments.
*   **Content Architect:** 
    *   **Live Edit Mode:** Modify syllabus titles and content directly from the module page.
    *   **Asset Central:** Create and rename folders in the Content Bank.
    *   **Quiz Protocol Editor:** Override AI questions with fixed, admin-defined questions.
*   **User Registry & Audit:**
    *   **Activity Trail:** Timeline view of every segment viewed and quiz started.
    *   **Performance Audits:** Form for admins to grade manual performance and provide feedback.
    *   **History Reset:** Hard reset tool for re-training users.

---

## 6. User Flow

### 1. Onboarding
1.  Admin provisions user account via `/admin?tab=provisioning`.
2.  User receives credentials and logs in at `/login`.
3.  Initial redirect logic sends user to `/` (Counsellor) or `/admin` (Admin).

### 2. Training Journey
1.  User views "Module 1" -> Reads segments -> Marks as complete.
2.  Upon finishing segments, "Start Module Quiz" appears.
3.  User must pass the quiz to unlock the next module (where configured).
4.  If progress reaches 90%, "Educators Discovery" popup triggers to introduce advanced tools.

### 3. Certification & Exit
1.  After 100% completion, user takes the Final Certification Exam.
2.  AI grades the exam -> Score generated -> Certificate emailed.
3.  Admin reviews results in "Counsellor Registry" and approves the hire.

---

## 7. Data Storage & Schema
Data is stored in Supabase with the following key tables:

| Table | Primary Purpose |
| :--- | :--- |
| `profiles` | Stores `id`, `full_name`, `role`, `allowed_modules`, and `training_buddy` (JSON). |
| `mentor_progress` | Tracks `topic_code` completion for every user. |
| `assessment_logs` | Stores quiz scores, raw Q&A, and AI feedback. |
| `activity_logs` | Audit trail of all interactions (e.g., `view_module`, `start_quiz`). |
| `summary_audits` | Manual feedback reports submitted by admins. |
| `syllabus_content` | Dynamic overrides and new content injected by admins. |
| `quiz_protocols` | Admin-defined question banks that override default AI logic. |

---

## 8. Micro-Features & UX Delighters
*   **Glassmorphism UI:** Premium dark/light themed interface with subtle blurs and gradients.
*   **Confetti Triggers:** Celebratory animations on passing assessments.
*   **Smart Fallback:** If AI is slow, the system falls back to cached questions.
*   **Global Search:** "Asset Central" allows instant lookup across the entire project library.
*   **Force-Redirects:** Logic that ensures users don't skip mandatory quizzes (e.g., Module 1).

---

## 9. Internal Scripts & Maintenance
The project includes several CLI utilities for system maintenance:
*   `provision-accounts.ts`: Batch creation of authorized users.
*   `system-health.ts`: Diagnostic tool for checking DB connections and AI latency.
*   `hydrate_educator_content.js`: Seeding script for the CRM Content Library.
*   `reset-history.ts`: Script-level hard reset for edge case troubleshooting.

---
**Document Status:** Finalized  
**Last Updated:** 2026-04-20
