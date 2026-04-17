# Comprehensive Codebase Audit Report

**Project:** Balance Nutrition — Counsellor LMS Platform  
**Audit Date:** 21 February 2026  
**Auditor:** AI Systems Architect  
**Scope:** User & Admin Portals, Activity Tracking, Quiz Results, Peer Reviews, Credential Creation, Content Uploading, Database Handling

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Authentication & Role-Based Access](#3-authentication--role-based-access)
4. [Segment Completion Button](#4-segment-completion-button)
5. [Quiz Scores & AI Assessment](#5-quiz-scores--ai-assessment)
6. [Peer Review / Summary Audits](#6-peer-review--summary-audits)
7. [Admin Portal — Counsellor Logs Accuracy](#7-admin-portal--Counsellor-logs-accuracy)
8. [Credential Creation (Admin)](#8-credential-creation-admin)
9. [Content Uploading](#9-content-uploading)
10. [Database Handling (Supabase)](#10-database-handling-supabase)
11. [Activity Tracking](#11-activity-tracking)
12. [Security Concerns](#12-security-concerns)
13. [What Is Working Correctly](#13-what-is-working-correctly)
14. [Summary of Issues](#14-summary-of-issues)
15. [Actionable Recommendations](#15-actionable-recommendations)

---

## 1. Executive Summary

The Balance Nutrition LMS platform is a Next.js application backed by Supabase for authentication, data storage, and real-time queries. It uses Groq (LLaMA 3.3-70B) for AI-powered quiz generation, exam grading, summary auditing, and client call simulation.

**Overall health:** The core learning flow (login → modules → topic cards → completion → assessment) is functional. However, several **critical issues** were identified in security, data accuracy on the admin dashboard, content upload functionality, and role-based access enforcement. Below is a detailed breakdown.

---

## 2. Architecture Overview

| Layer | Technology | Files |
|-------|-----------|-------|
| Frontend | Next.js (App Router), React, Framer Motion | `src/app/`, `src/components/` |
| Backend API | Next.js API Routes | `src/app/api/` |
| Auth | Supabase Auth | `src/lib/supabase.ts` |
| Database | Supabase (PostgreSQL) | Tables: `profiles`, `Counsellor_progress`, `assessment_logs`, `summary_audits`, `simulation_logs`, `Counsellor_activity_logs` |
| AI Engine | Groq SDK (LLaMA 3.3-70B) | `src/lib/groq.ts`, API routes |
| State | React `useState`/`useEffect`, `localStorage` fallback | Client components |

### Database Tables Identified (from code):
- `profiles` — user identity & role
- `Counsellor_progress` — topic completion per user
- `assessment_logs` — quiz/exam scores per topic
- `summary_audits` — peer review summaries
- `simulation_logs` — clinical call simulation chat history
- `Counsellor_activity_logs` — general activity log

---

## 3. Authentication & Role-Based Access

### ✅ What's Working
- Supabase Auth sign-in/sign-up flow works correctly.
- Login page presents two pathways: "Counsellor" (interviewee) and "Admin Portal."
- Layout (`layout.tsx`) checks auth session on mount and enforces route protection.
- Admin sidebar shows different nav items (`adminNavItems`) vs. user sidebar (`navItems`).
- Profile sync on login via `supabase.from('profiles').upsert(...)`.

### 🔴 Issues Found

| # | Issue | Severity | File | Line(s) |
|---|-------|----------|------|---------|
| 3.1 | **No server-side role verification on admin API routes.** The `create-user`, `force-reset`, and `seed-Counsellors` API endpoints do NOT verify that the calling user has admin privileges. Any authenticated user can call `POST /api/admin/create-user` and create accounts. | **CRITICAL** | `src/app/api/admin/create-user/route.ts` | All |
| 3.2 | **Role stored only in `user_metadata`, not verified server-side.** Role check happens only in the client-side layout. A user can modify their local session or directly call APIs without restriction. | **HIGH** | `src/app/layout.tsx` | L46, L65-67 |
| 3.3 | **Admin gate is bypassable.** The check `pathname.startsWith('/admin') && role !== 'admin'` is client-only. Directly navigating to `/admin` with a modified session token or by changing localStorage metadata would bypass this. | **HIGH** | `src/app/layout.tsx` | L65 |
| 3.4 | **Inconsistent default role.** On initial auth check: `role = session.user.user_metadata?.role || 'interviewee'` (L46), but on `SIGNED_IN` event: `role = session.user.user_metadata?.role || 'Counsellor'` (L81). This inconsistency can cause role mis-assignment. | **MEDIUM** | `src/app/layout.tsx` | L46 vs L81 |
| 3.5 | **"Developer Pass" button hardcoded with live credentials.** The login page has a "Developer Pass (Skip Login)" button that auto-logs into `anjali.m@balancenutrition.in` with password `515148`. This is a **production credential exposed in client-side code.** | **CRITICAL** | `src/app/login/page.tsx` | L278-290 |
| 3.6 | **Signup is open to anyone.** The interviewee pathway exposes a "Sign Up" tab. Anyone can create an account, and the role is set client-side. There is no invitation-only or admin-gated account creation flow for Counsellors. | **MEDIUM** | `src/app/login/page.tsx` | L51-82 |

---

## 4. Segment Completion Button

### ✅ What's Working
- The "Verify Knowledge & Proceed" button in `TopicCard.tsx` calls `onToggleComplete()` which maps to `toggleTopic()` in the module page.
- The recent fix switched from `.insert()` to `.upsert()` with `onConflict: 'user_id,topic_code'`, resolving the **409 Conflict** error.
- An `isSyncing` state now prevents duplicate rapid-fire clicks, showing a spinner during the request.
- Completed state is correctly persisted to Supabase `Counsellor_progress` table and re-fetched on page load.

### 🟡 Issues Found

| # | Issue | Severity | File | Line(s) |
|---|-------|----------|------|---------|
| 4.1 | **Optimistic UI without rollback.** `setCompletedTopics([...completedTopics, topicCode])` runs only on success, which is correct. However, the `TopicCard` internally sets `setVideoCompleted(true)`, `setSimulationCompleted(true)`, `setAssignmentCompleted(true)` **before** the async call completes. If the upsert fails, these internal states remain `true` but the topic is NOT actually marked complete — creating a UI/data mismatch. | **MEDIUM** | `TopicCard.tsx` | L370-380 |
| 4.2 | **No error feedback to user.** If the Supabase upsert fails silently, the user sees the button revert but receives no error message. | **LOW** | `page.tsx (modules)` | L122-134 |
| 4.3 | **Completion is not topic-content-aware.** The button marks topics complete without verifying that the user has actually watched the video, completed the simulation, or submitted assignments. The internal booleans (`videoCompleted`, etc.) are all force-set to `true` on click. | **MEDIUM** | `TopicCard.tsx` | L373-375 |

---

## 5. Quiz Scores & AI Assessment

### ✅ What's Working
- `AIAssessment.tsx` generates 5 MCQs via the `/api/generate-test` endpoint using Groq AI.
- Questions are timed (10-minute countdown) with auto-submit on expiry.
- Scores are correctly calculated client-side and saved to `assessment_logs` with `score`, `total_questions`, and `raw_data` (questions + answers).
- Profile sync happens before score logging, ensuring the profile exists.

### 🔴 Issues Found

| # | Issue | Severity | File | Line(s) |
|---|-------|----------|------|---------|
| 5.1 | **Correct answers are exposed to the client.** The API (`/api/generate-test`) returns the full question object including `correctAnswer` in the response. A user can inspect the network response to see all correct answers before answering. | **HIGH** | `generate-test/route.ts` | L47 |
| 5.2 | **Scoring happens client-side.** The final score is calculated in the browser (`submitAudit` in `AIAssessment.tsx`), not on the server. A user can modify the score before it's sent to Supabase. | **HIGH** | `AIAssessment.tsx` | L91-128 |
| 5.3 | **No deduplication of assessment attempts.** Multiple assessments for the same `topic_code` by the same user are allowed (they all use `.insert()`). The admin dashboard may count stale/duplicate scores. | **MEDIUM** | `AIAssessment.tsx` | L115-121 |
| 5.4 | **`assessmentPassed` check uses generic prefix.** It queries `topic_code = MODULE_${moduleId}`, but the `AIAssessment` component saves scores with the actual `topicCode` prop. If the prop doesn't match this format, the "assessment already passed" check will never match. | **HIGH** | `page.tsx (modules)` | L85 vs `AIAssessment.tsx` L117 |
| 5.5 | **`grade-exam/route.ts` uses Groq but `generate-test/route.ts` uses the shared `groq` client from `lib/groq.ts`, which uses `NEXT_PUBLIC_GROQ_API_KEY` (exposed to browser).** The `grade-exam` and `grade-summary` routes create separate Groq instances using `GROQ_API_KEY` (server-only). This inconsistency means the API key in `lib/groq.ts` is **exposed in the client bundle**. | **CRITICAL** | `src/lib/groq.ts` | L3 |

---

## 6. Peer Review / Summary Audits

### ✅ What's Working
- `SummaryGrader.tsx` allows Counsellors to write summaries, which are graded by AI.
- Results (score + feedback) are saved to `summary_audits` table.
- The admin dashboard fetches and displays peer audit counts per Counsellor.

### 🟡 Issues Found

| # | Issue | Severity | File | Line(s) |
|---|-------|----------|------|---------|
| 6.1 | **grade-summary API does not use `response_format: { type: "json_object" }`.** Unlike `grade-exam`, the `grade-summary` route relies on the LLM to return valid JSON without enforcing it. If the LLM wraps its response in markdown or adds preamble, `JSON.parse()` will throw and return a 500 error. | **MEDIUM** | `grade-summary/route.ts` | L24-31 |
| 6.2 | **SummaryGrader uses `.insert()` not `.upsert()`.** Multiple submissions for the same topic by the same user will create duplicate rows, inflating the "Peer Audits" count on the admin dashboard. | **MEDIUM** | `SummaryGrader.tsx` | L45-51 |
| 6.3 | **Admin "Pending Reviews" count is misleading.** `stats.pendingReviews` is calculated as audits with `score === 0` (`admin/page.tsx` L201). A score of 0 means a genuinely poor performance, not "pending review." There is no `status` field to distinguish pending from graded. | **MEDIUM** | `admin/page.tsx` | L201 |

---

## 7. Admin Portal — Counsellor Logs Accuracy

### ✅ What's Working
- The "Counsellor Logs" tab correctly fetches from `profiles`, `assessment_logs`, `Counsellor_activity_logs`, and `summary_audits`.
- Counsellor cards display computed progress, average score, audit counts, activity counts, and last active date.
- Global System Activity feed shows recent actions.

### 🔴 Issues Found

| # | Issue | Severity | File | Line(s) |
|---|-------|----------|------|---------|
| 7.1 | **Progress calculation is based on `assessment_logs`, NOT `Counsellor_progress`.** The admin dashboard calculates progress from unique `topic_code` values in `assessment_logs` (L173: `const uniqueCompletedTopics = new Set(CounsellorAssessments.map(...))`). But actual topic completion is tracked in `Counsellor_progress`. A Counsellor could complete all topics (via the completion button) but show 0% progress on admin if they haven't taken quizzes. This is a **fundamental data source mismatch.** | **CRITICAL** | `admin/page.tsx` | L173-177 |
| 7.2 | **User dashboard uses `Counsellor_progress`, admin uses `assessment_logs` for the same metric.** On the user-facing homepage (`page.tsx` L47-52), progress comes from `Counsellor_progress`. On admin (`admin/page.tsx` L173), it comes from `assessment_logs`. These produce **completely different numbers.** | **CRITICAL** | `page.tsx` L47 vs `admin/page.tsx` L173 |
| 7.3 | **"Joined" date shows last activity, not creation date.** The Counsellor card shows `Counsellor.stats?.lastActive || Counsellor.created_at` as the "Joined" date label (L556), which is confusing. | **LOW** | `admin/page.tsx` | L556 |
| 7.4 | **No pagination or search for Counsellors.** All Counsellors are loaded at once with no filtering. This will not scale. | **LOW** | `admin/page.tsx` | L537-621 |

---

## 8. Credential Creation (Admin)

### ✅ What's Working
- The admin can create new user accounts via the "Provision Keys" tab.
- The API uses `supabaseAdmin.auth.admin.createUser()` to create auth users with confirmed emails.
- Profile rows are inserted into the `profiles` table upon creation.
- The `force-reset` and `seed-Counsellors` endpoints can batch-create/reset Counsellor accounts.

### 🟡 Issues Found

| # | Issue | Severity | File | Line(s) |
|---|-------|----------|------|---------|
| 8.1 | **No auth check on admin API routes (see 3.1).** Anyone can call these endpoints. | **CRITICAL** | `api/admin/*` | All |
| 8.2 | **`create-user` does NOT set `role` in `user_metadata`.** The role is only saved to the `profiles` table. When the user logs in, `layout.tsx` reads `session.user.user_metadata?.role`, which will be undefined, defaulting to `'interviewee'`. The created user won't see the correct role until the profile sync runs. | **HIGH** | `create-user/route.ts` | L14-19 |
| 8.3 | **Password policy is minimal.** Only `minLength={6}` is enforced on the form. No complexity requirements. | **LOW** | `admin/page.tsx` | L372 |
| 8.4 | **`sync-profile` endpoint always sets role to `'Counsellor'`.** If an admin account calls this, their role would be overwritten to `'Counsellor'`. | **MEDIUM** | `auth/sync-profile/route.ts` | L20 |

---

## 9. Content Uploading

### 🔴 Issues Found

| # | Issue | Severity | File | Line(s) |
|---|-------|----------|------|---------|
| 9.1 | **Content upload is entirely fake / non-functional.** The `handleUploadContent` function uses `setTimeout` to simulate a 1.5-second delay then shows a success message. **No data is actually saved anywhere** — not to Supabase, not to the filesystem, not to the syllabus. | **CRITICAL** | `admin/page.tsx` | L235-243 |
| 9.2 | **File drag-and-drop area is non-functional.** The "Drop assets here" area is purely visual — no `onDrop` handler, no `<input type="file">`, no file upload logic. | **HIGH** | `admin/page.tsx` | L500-504 |
| 9.3 | **Syllabus data is hardcoded in a TypeScript file.** `src/data/syllabus.ts` is a static file. Even if content upload worked, there's no mechanism to dynamically add topics or modules to the syllabus at runtime. | **HIGH** | `src/data/syllabus.ts` | All |

---

## 10. Database Handling (Supabase)

### ✅ What's Working
- Profile upsert on login ensures profiles exist.
- Assessment logs, summary audits, and simulation logs are correctly inserted.
- The recent `.upsert()` fix for `Counsellor_progress` resolves the 409 conflict issue.

### 🟡 Issues Found

| # | Issue | Severity | File | Line(s) |
|---|-------|----------|------|---------|
| 10.1 | **No RLS (Row Level Security) enforcement verified.** All client-side queries use the `anon` key. Without proper RLS policies, any authenticated user could read/modify other users' data. | **HIGH** | `lib/supabase.ts` | L8 |
| 10.2 | **Service Role Key exposed in client-accessible code.** Both `supabaseAnonKey` and `supabaseServiceRoleKey` are hardcoded as fallback values in `lib/supabase.ts`. While `supabaseAdmin` should only be used server-side, the import is from a shared library. If any client component imports this file, the service role key becomes available in the browser bundle. | **CRITICAL** | `lib/supabase.ts` | L5 |
| 10.3 | **`ClinicalSimulator` inserts a new `simulation_logs` row on EVERY message exchange.** After each assistant response, the entire chat history is re-inserted (not upserted). This creates massive data duplication. | **HIGH** | `ClinicalSimulator.tsx` | L81-85 |
| 10.4 | **`Counsellor_activity_logs` table may not exist.** The `logActivity` function fails silently with a `console.warn` if the table doesn't exist (L31). This means activity tracking might be completely non-functional without anyone knowing. | **MEDIUM** | `lib/activity.ts` | L28-31 |
| 10.5 | **No database indexes mentioned.** Frequent queries on `user_id + topic_code`, `user_id + module_id` should have composite indexes for performance. | **LOW** | N/A | N/A |

---

## 11. Activity Tracking

### ✅ What's Working
- `logActivity()` is called when a module page is viewed (`view_topic` event).
- Activity types are well-defined: `view_topic`, `view_content`, `start_quiz`, `complete_quiz`, `submit_assignment`.

### 🟡 Issues Found

| # | Issue | Severity | File | Line(s) |
|---|-------|----------|------|---------|
| 11.1 | **Only `view_topic` is actually logged.** Despite defining 5 activity types, only `view_topic` is ever called (in `modules/[id]/page.tsx` L60). `start_quiz`, `complete_quiz`, `submit_assignment`, and `view_content` are never invoked anywhere in the codebase. | **HIGH** | `lib/activity.ts` + all consumers | All |
| 11.2 | **Activity logs don't include the user's name.** The admin feed must resolve user IDs to names by joining with the `Counsellors` array client-side. | **LOW** | `admin/page.tsx` | L639-657 |

---

## 12. Security Concerns

| # | Concern | Severity | Location |
|---|---------|----------|----------|
| 12.1 | **Hardcoded Supabase URL, Anon Key, and Service Role Key** in source code. These should be in `.env` files only, with no fallback strings. | **CRITICAL** | `lib/supabase.ts` |
| 12.2 | **Groq API Key (`NEXT_PUBLIC_GROQ_API_KEY`) has `NEXT_PUBLIC_` prefix**, making it available in the browser. This key should be server-only. | **CRITICAL** | `lib/groq.ts` |
| 12.3 | **Hardcoded test credentials** in login page (`anjali.m@balancenutrition.in` / `515148`). | **CRITICAL** | `login/page.tsx` L279-282 |
| 12.4 | **All Counsellor passwords are the same** (`515148`), set by `force-reset` and `seed-Counsellors`. | **HIGH** | `api/admin/force-reset/route.ts` L44 |
| 12.5 | **No CSRF protection** on API routes. | **MEDIUM** | All API routes |
| 12.6 | **No rate limiting** on quiz generation, exam grading, or simulation APIs. An attacker could exhaust Groq API credits. | **HIGH** | All Groq-powered routes |

---

## 13. What Is Working Correctly

| Feature | Status | Notes |
|---------|--------|-------|
| **Login/Signup Flow** | ✅ Working | Supabase Auth integration is solid |
| **Module Navigation** | ✅ Working | Syllabus renders correctly, prev/next navigation works |
| **Topic Completion Tracking** | ✅ Working | Upsert fix resolved 409 errors, syncing state prevents double-clicks |
| **AI Quiz Generation** | ✅ Working | Groq generates contextual MCQs reliably |
| **AI Summary Grading** | ✅ Working | Returns score and feedback accurately |
| **Clinical Call Simulator** | ✅ Working | Chat interface with AI-powered client simulation works well |
| **Sidebar Role-Based UI** | ✅ Working | Different nav items shown for admin vs. Counsellor |
| **Module Assessment Gating** | ✅ Working | Blocks navigation until assessment is done |
| **Admin Account Creation** | ✅ Working | Creates auth users + profile rows correctly |
| **Counsellor Profile Cards** | ✅ Partially Working | Displays Counsellor information, but progress data source is wrong |
| **Responsive Design** | ✅ Working | Layout adapts well across screen sizes |
| **Animations** | ✅ Working | Framer Motion animations enhance UX significantly |

---

## 14. Summary of Issues

### By Severity

| Severity | Count | Key Issues |
|----------|-------|------------|
| **CRITICAL** | 7 | Exposed secrets, no API auth, fake content upload, progress data mismatch |
| **HIGH** | 8 | Client-side scoring, no RLS, missing activity logging, simulation data duplication |
| **MEDIUM** | 7 | Role inconsistency, UI/data mismatches, JSON parsing fragility |
| **LOW** | 5 | Minor UX issues, no pagination, no search |

### Most Impactful Bugs

1. **Admin progress shows quiz-based data, user dashboard shows completion-based data** — different numbers for the same metric.
2. **Content upload does nothing** — admin believes content was updated, but nothing changes.
3. **Secrets hardcoded in source** — service role key + Groq API key exposed.
4. **Admin API endpoints have no auth** — any logged-in user can create accounts.

---

## 15. Actionable Recommendations

### 🔴 Immediate (Fix Before Next Deployment)

1. **Move all secrets to `.env` files.** Remove hardcoded fallback keys from `lib/supabase.ts`. Remove `NEXT_PUBLIC_` prefix from Groq API key. Ensure `.env` is in `.gitignore`.

2. **Add server-side auth checks to all admin API routes.** Verify that the calling user's profile has `role: 'admin'` before processing requests:
   ```ts
   // In each admin API route:
   const { data: { session } } = await supabaseAdmin.auth.getUser(token);
   const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', session.user.id).single();
   if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
   ```

3. **Remove the "Developer Pass" button** from `login/page.tsx` in production.

4. **Fix admin progress calculation.** Change admin dashboard to use `Counsellor_progress` (not `assessment_logs`) for the training progress metric:
   ```ts
   // Fetch Counsellor_progress per user
   const { data: progress } = await supabase.from('Counsellor_progress').select('user_id, topic_code');
   // Group by user_id and calculate percentage
   ```

5. **Move score calculation to the server.** The `/api/grade-exam` route should receive raw answers and compute the score server-side. Don't return `correctAnswer` to the client in the quiz generation response.

### 🟡 Short-Term (Next Sprint)

6. **Implement real content upload.** Either:
   - Store new topics/links in a Supabase `content` table and merge with `syllabus.ts` at runtime, or
   - Build an admin editor that modifies the syllabus and triggers a rebuild.

7. **Fix simulation log duplication.** Use `.upsert()` keyed on `(user_id, topic_code)` or update the existing row instead of inserting new rows on every message.

8. **Add `response_format: { type: "json_object" }` to `grade-summary` API** to prevent JSON parse failures.

9. **Wire up all activity types.** Add `logActivity('start_quiz', ...)` in `AIAssessment.tsx`, `logActivity('submit_assignment', ...)` in `AssignmentForm.tsx`, etc.

10. **Set `role` in `user_metadata` when creating users** via the admin API, so `layout.tsx`'s metadata-based role check works immediately.

### 🟢 Long-Term (Technical Debt)

11. **Implement proper RLS policies** in Supabase for all tables.
12. **Add rate limiting** to AI-powered API routes.
13. **Add pagination and search** to the Counsellor Logs tab.
14. **Create a proper invitation system** instead of open signup for Counsellors.
15. **Add error toasts** instead of `alert()` for user-facing messages.
16. **Verify `Counsellor_activity_logs` table exists** in DB schema, or create it.
17. **Add composite database indexes** on `(user_id, topic_code)` and `(user_id, module_id)` for performance.

---

*End of Audit Report*
