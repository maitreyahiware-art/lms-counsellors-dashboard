# Balance Nutrition LMS - Comprehensive Product & Handover Document

## 1. Executive Summary
The Balance Nutrition LMS Platform is an advanced, multi-tenant Learning Management System specifically engineered for the onboarding, training, and continuous evaluation of mentors and staff. Beyond traditional curriculum progression, the platform leverages dynamic API integrations, RAG-powered search capabilities, and precise role-based access control (RBAC) to act as a complete central hub for learning operations.

## 2. Core Architecture & Modules

### 2.1 The 5 Core Learning Modules
The primary curriculum is divided into 5 distinct modules designed to guide users from foundational knowledge to advanced operational skills.
- **Features & Use Cases:**
  - Topic-based video learning and guided syllabus progression.
  - Interactive assignments with prerequisite locking.
- **Recent Micro-Improvements:**
  - Implementation of a structured `isAccordion` logic within `TopicCard.tsx` to handle nested syllabus elements seamlessly (e.g., Module 2 Program Dropdowns).
  - Adopted a uniform 3x2 grid layout for specific training videos (BCA and Smart Scale demos) for improved UX.

### 2.2 Universal Content Bank
A centralized repository storing static and dynamic assets.
- **Features:**
  - Fast search and retrieval using tag-based filtering.
  - Native in-app viewer for PDF resources (e.g., Gym and Pharma pitch decks, Product Catalogues) which keeps users in the app instead of downloading files.
- **Recent Micro-Improvements:**
  - Integrated direct "copy-to-clipboard" functionality for social media IDs and asset links, reducing friction during live calls.

### 2.3 Educators Module & Content CRM
A specialized hub for content creation and delivery, directly connected to social media metrics.
- **Features:**
  - API-driven dynamic Kanban-style content delivery system.
  - Advanced health-condition filtering (PCOS, Pregnancy, Menopause, Diabetes, Thyroid, Cardiac, Gut/GI, Child Nutrition).
  - WhatsApp content delivery integrations.
- **Recent Micro-Improvements:**
  - Fully automated data hydration mapping directly to `post_type` and `post_sub_type` fields.
  - Transition from legacy static JSON to live API feeds.

### 2.4 The Insight Recorder
An advanced AI-powered tool for deep-dive learning and query resolution over the platform's knowledge base.
- **Features:**
  - Trilingual RAG (Retrieval-Augmented Generation) search powered by Pinecone Inference API.
  - Persistent chat history across sessions utilizing local IndexedDB.

---

## 3. Portals and Role-Based Access Control (RBAC)

### 3.1 Admin Portal
The management hub that controls the platform's overarching logic and user data.
- **Features:** 
  - **User Management**: Lifecycle management of employee accounts.
  - **Syllabus & Content Updation**: Mapped modifications of curricula and asset repositories.
  - **Progress Tracking & Syncing**: Real-time synchronization of completion rates and grades from all user subsets.

### 3.2 User Portals (Specialized Roles)
Individualized dashboards tailored specifically to the user's role: **Counsellor, Tech, BD (Business Development), CS (Customer Success), and Training Buddy**.
- **Features:**
  - Targeted curriculums dynamically adjusting to the assigned role.
  - `DashboardTour.tsx` for guided, interactive onboarding.
  - Specialized interfaces for the "Training Buddy" to conduct peer reviews, syncing grades back to the central `SummaryGrader`.

---

## 4. Evaluations (Evals) & Scoring Systems

Creating robust evaluation pipelines is central to the LMS. The platform utilizes a multi-tiered evaluation system:

### 4.1 Automated AI Assessments
- Handled by `api/simulate-call` and `AIAssessment.tsx`.
- Mock calls and written assessments are evaluated through Trilingual RAG AI, testing mentors on empathetic responses, accuracy, and tone without human intervention.
- Automated email mock replies (`api/send-mock-call-email`) test business writing skills.

### 4.2 Automated Quizzes
- Driven by `api/generate-test` and `api/grade-exam`.
- Processes objective answers and tracks multiple attempts natively within the platform, auto-advancing standard training workflows.

### 4.3 Human-in-the-loop (Training Buddy Evals)
- Leverages `api/notify-buddy` to trigger manual reviews.
- Focuses on qualitative assessments capturing nuances missed by automated grading, integrating directly into the `SummaryGrader.tsx` console.

---

## 5. UI Components & Micro-Improvements Map

- `TopicCard.tsx`: Deep-dive component supporting complex nested accordions, sub-link rendering, and resource attachments.
- `AIAssessment.tsx` / `AcademySimulator.tsx`: Handlers for all AI and simulated evaluations.
- `Sidebar.tsx`: Principal navigation interface linking the various micro-frontends.
- `ContentCard.tsx` / `ContentModal.tsx`: Grid-styled components with built-in asset viewers and clipboard interactions.
- `SummaryGrader.tsx`: Admin-facing UI for consolidated view of AI, Quiz, and Buddy evaluations.
- **Dynamic Assets**: Integration of modern UI paradigms including standardized 3x2 grid layouts for video assets, active micro-animations, and error-boundary wrappers for stability.

---

## 6. QA Testing Guide & Focus Areas

For the QA Testing team, the following domain areas and feature subsets should be heavily vetted prior to production release:

### 6.1 Functionality & Data Integration Testing
- **Content CRM Hydration**: Validate that the Educators Module correctly parses live API data. QA must test the filter combination across all health pillars (PCOS, Cardiac, etc.) and verify the Kanban board renders correct columns.
- **Evaluation Syncing & Progress Tracking**: Ensure that a completed evaluation by a "Training Buddy" seamlessly reflects in the User’s dashboard and the Admin Portal without requiring hard page refreshes.
- **Playback & Completion Logic**: Verify that videos enforce completion thresholds before allowing users to unlock the next assignment or topic. Ensure the `isAccordion` sub-links in Module 2 display videos correctly.

### 6.2 Edge Cases & State Management
- **IndexedDB Persistence**: In the Insight Recorder, QA should refresh the page or open a new tab to ensure the user's RAG chat history persists without data loss.
- **RAG Trilingual Testing**: Provide queries in Hindi, English, and the third supported language to the Pinecone Inference API to verify accurate document retrieval and formatting.
- **Offline / Retry States**: Test the UI behavior if the Social Posts API (utilized by the Educators Module) times out.

### 6.3 UI/UX Verifications
- **Internal Document Viewer**: Ensure the newly integrated PDF viewer opens larger pitch decks (e.g., BN SHOP PRODUCT CATALOGUE, Pharma Pitch Deck) efficiently inside the dashboard without forcing external downloads or breaking the layout.
- **Clipboard Functionality**: Rigorously test the "copy-to-clipboard" functions on social media IDs within `ContentCard.tsx` across Chrome, Firefox, and Safari for permissions handling.
- **Responsive Grids**: Verify the 3x2 grid configurations on different display resolutions.

---

## 7. API Endpoints Map
- **Auth & Config**: `api/auth`, `api/admin`
- **Assessments**: `api/generate-test`, `api/grade-exam`, `api/grade-summary`
- **Simulations**: `api/simulate-call`, `api/send-mock-call-email`, `api/notify-buddy`
- **Data Sync**: `api/cron`
