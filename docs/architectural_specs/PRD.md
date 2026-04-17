# Product Requirements Document (PRD)
## Balance Nutrition: AI-Powered Counsellor LMS

### 1. Executive Summary
The **Balance Nutrition Counsellor LMS** is a next-generation training platform designed to transform the onboarding and continuous education of clinical counsellors. Unlike traditional static LMSs, this platform leverages **Groq Llama 3.3 70B** to generate dynamic, context-aware assessments, simulated clinical scenarios, and automated performance audits. The goal is to ensure every counsellor is "Review Ready" through rigorous, adaptive testing rather than passive content consumption.

### 2. Objectives & Goals
- **Eliminate Rote Learning:** Replace static question banks with AI-generated assessments that test understanding at multiple cognitive levels (Recall, Application, Analysis).
- **Scale Training:** Remove the bottleneck of HR manually grading assignments and writing tests.
- **Clinical Excellence:** Ensure counsellors master the specific "Balance Nutrition" protocols, pricing, and clinical logic before handling real clients.
- **Real-Time Founder Oversight:** Provide Khyati Ma'am and the leadership team with a "God Mode" view of counsellor competency, confidence, and engagement.

### 3. User Personas

#### A. The Counsellor (Candidate)
- **Goal:** Learn the BN curriculum, pass assessments, and get certified to take calls.
- **Pain Points:** Overwhelmed by static PDFs, lack of feedback, boring quizzes.
- **Needs:** Interactive content, instant feedback on quizzes, realistic practice.

#### B. The Founder (Super Admin)
- **Goal:** Verify that counsellors truly understand the brand vision and clinical protocols.
- **Pain Points:** Cannot manually vet every counsellor; needs high-level assurance of quality.
- **Needs:** A dashboard showing "Knowledge Depth," pass rates, and aggregated audit logs.

#### C. HR / Admin
- **Goal:** Manage the recruitment pipeline and ensure compliance.
- **Pain Points:** Tracking who has finished what module, who has sent the "Summary Mail."
- **Needs:** Automated checklists, progress tracking, and flag alerts for struggling candidates.

### 4. Functional Requirements

#### 4.1. The AI Engine ("The Brain")
- **Dynamic Assessment Generation:** 
  - **Input:** Topic Title + Topic Content (from `syllabus.ts`).
  - **Logic:** Uses Groq (Llama 3.3 70B) to generate 3-5 questions per topic.
  - **Constraint:** Questions must follow Bloom's Taxonomy (Recall -> Application -> Analysis).
  - **Output:** JSON array of questions with "distractor" logic (plausible but wrong answers).
- **Simulation Engine (Future):**
  - Chatbot persona acting as a "Difficult Client" to test counsellor patience and sales scripts.

#### 4.2. Counsellor Portal (Frontend)
- **Syllabus Navigation:**
  - Segments: Business Overview, Program Training, Cleanse Programs.
  - Progress Indication: Visual progress bars for each module.
  - Locked Stages: Subsequent modules locked until previous ones are mastered (optional).
- **Learning Interface:**
  - Rich text/Video content display.
  - "Take Assessment" button triggering the AI generation.
  - Instant grading with explanation for wrong answers.
- **Deliverables Tracking:**
  - File upload/Text area for "Day 1 Summary Mail," "Peer Assessment," etc.

#### 4.3. Founder Intelligence Dashboard
- **Stats Overview:**
  - Active Counsellors, Total Assessments Taken, Average Knowledge Depth (%), Simulations Run.
- **Detailed Logs:**
  - **Quiz Scores:** View individual attempts, scores, and timestamps.
  - **Call Transcripts:** (Future) Review AI-simulated sales calls.
  - **Summary Audits:** AI grading of the text summaries submitted by counsellors.
  - **Certifications:** Final exam results (Pass/Fail status).
- **Data Visualization:** Clean, high-end UI using Recharts or numeric stats to show trends.

### 5. Technical Architecture

#### 5.1. Tech Stack
- **Framework:** Next.js 15+ (App Router)
- **Styling:** Tailwind CSS + Framer Motion (for "Premium" feel)
- **Database:** Supabase (PostgreSQL)
  - Tables: `assessment_logs`, `simulation_logs`, `summary_audits`, `certification_attempts`, `profiles`.
- **AI Inference:** Groq SDK (Model: `llama-3.3-70b-versatile`)
- **Icons:** Lucide React

#### 5.2. Database Schema (Supabase)
- **assessment_logs**: `id`, `user_id`, `topic_code`, `score`, `total_questions`, `created_at`
- **simulation_logs**: `id`, `user_id`, `topic_code`, `chat_history`, `created_at`
- **summary_audits**: `id`, `user_id`, `task_id`, `content`, `ai_grade`, `created_at`

### 6. Content Strategy (The Syllabus)
The syllabus is defined as code (`syllabus.ts`) to serve as the ground truth for the AI.
- **Segment 1:** Business Overview (Founder vision, competitors, brand USPs).
- **Segment 2:** Program Training (Phase 1 & 2 programs, pricing, features).
- **Segment 3:** Cleanse Programs (1-day, 3-day, 14-day detoxes).
- **Practical Tasks:** Health Score generation, Peer Assessments.

### 7. User Experience (UX) Guidelines
- **Aesthetic:** "Clinical Premium." Use deep teals (#0E5858), clean whites, and soft beiges (#FAFCEE).
- **Feedback:** Success messages should be encouraging; failure messages should be constructive.
- **Speed:** The "Generate Test" action must feel instant (leveraging Groq's speed).

### 8. Roadmap & Phasing
- **Phase 1 (Current):** Core LMS, AI Quiz Generation, Founder Dashboard (Basic Stats).
- **Phase 2:** Clinical Simulations (Chat with AI Patient), Automated Essay Grading (Summary Mail).
- **Phase 3:** Gamification (Leaderboards, "Counsellor of the Month"), HR Admin Tools.
