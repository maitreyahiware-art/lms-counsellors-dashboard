# 🧪 BN LMS Mentor Platform — QA Testing & Verification Document

> **Version:** 1.0  
> **Date:** April 18, 2026  
> **Platform:** Balance Nutrition — Counsellor Academy LMS  
> **Tech Stack:** Next.js 14 · Supabase (Auth + DB + RLS) · Framer Motion · Vercel  
> **Production URL:** `https://lms-counsellors-dashboard.vercel.app`  

---

## Table of Contents

1. [Testing Overview & Legend](#1-testing-overview--legend)
2. [TS-01: Authentication & Access Control](#ts-01-authentication--access-control)
3. [TS-02: User Dashboard (Home Page)](#ts-02-user-dashboard-home-page)
4. [TS-03: Training Modules Page](#ts-03-training-modules-page)
5. [TS-04: Module Detail Page (Segments)](#ts-04-module-detail-page-segments)
6. [TS-05: Certification Page](#ts-05-certification-page)
7. [TS-06: Content Bank (Asset Central)](#ts-06-content-bank-asset-central)
8. [TS-07: Educators Module (CRM Library)](#ts-07-educators-module-crm-library)
9. [TS-08: Program Info Page](#ts-08-program-info-page)
10. [TS-09: Admin Portal — Dashboard Hub](#ts-09-admin-portal--dashboard-hub)
11. [TS-10: Admin Portal — Provision Keys](#ts-10-admin-portal--provision-keys)
12. [TS-11: Admin Portal — Content Architect](#ts-11-admin-portal--content-architect)
13. [TS-12: Admin Portal — Counsellor Registry](#ts-12-admin-portal--counsellor-registry)
14. [TS-13: Admin Portal — User Profile Detail](#ts-13-admin-portal--user-profile-detail)
15. [TS-14: Sidebar Navigation](#ts-14-sidebar-navigation)
16. [TS-15: Cross-Cutting Concerns](#ts-15-cross-cutting-concerns)
17. [Test Accounts & Credentials Matrix](#test-accounts--credentials-matrix)

---

## 1. Testing Overview & Legend

### Status Legend

| Symbol | Meaning |
|--------|---------|
| `[ ]`  | Not tested |
| `[P]`  | Passed |
| `[F]`  | Failed — attach details |
| `[S]`  | Skipped (with reason) |
| `[B]`  | Blocked (dependency issue) |

### Severity Levels

| Level | Description |
|-------|-------------|
| 🔴 **P0 — Critical** | Blocks core workflow, data loss, security hole |
| 🟠 **P1 — High** | Major feature broken, no workaround |
| 🟡 **P2 — Medium** | Feature impaired but workaround exists |
| 🟢 **P3 — Low** | Cosmetic, minor UX issue |

### User Roles Under Test

| Role | Sidebar View | Module Access | Admin Access |
|------|-------------|---------------|--------------|
| `counsellor` | User Portal | M1, M2, M3, M4, M5, Educators | ❌ |
| `admin` | Admin Portal | All modules | ✅ Full |
| `moderator` | Admin Portal | All modules | ✅ Full |
| `nutripreneur` | User Portal (limited) | M1, M2 + admin-granted | ❌ |
| `tech` | User Portal | M1, M2 + admin-granted | ❌ |
| `bd` | User Portal | M1, M2 + admin-granted | ❌ |
| `cs` | User Portal | M1, M2 + admin-granted | ❌ |
| `buddy` | User Portal | M1, M2 + admin-granted | ❌ |

### Supabase Tables Under Test

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts, roles, training buddies, allowed_modules |
| `mentor_progress` | Topic/segment completion tracking |
| `assessment_logs` | Quiz scores, raw Q&A data |
| `activity_logs` | Page views, clicks, quiz starts/completions |
| `summary_audits` | Admin-submitted performance audits |
| `simulation_logs` | AI simulator attempt records |
| `certification_attempts` | Final certification exam results |
| `syllabus_content` | Dynamic content overrides & new segments |
| `syllabus_folders` | Content bank folder definitions |
| `quiz_protocols` | Admin-configured quiz question banks |

---

## TS-01: Authentication & Access Control

> **Page:** `/login`  
> **Priority:** 🔴 P0  
> **File:** `src/app/login/page.tsx`

### TC-01.01 — Login Page Load
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Navigate to `/login` | Login form renders with email, password fields, "Sign In" button | `[ ]` |
| 2 | Verify "Sign Up" toggle exists | Tab toggle between "Sign In" and "Sign Up" visible | `[ ]` |
| 3 | Check BN logo renders | Logo image loads at top of form | `[ ]` |
| 4 | Check "Forgot Password?" link | Link is visible below password field | `[ ]` |

### TC-01.02 — Counsellor Login Flow
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Enter valid counsellor email + password | Fields accept input | `[ ]` |
| 2 | Click "Sign In" | Loading spinner appears | `[ ]` |
| 3 | Wait for redirect | Redirects to `/` (User Dashboard) | `[ ]` |
| 4 | Verify sidebar shows User Portal nav items | Dashboard, Training Modules, Certification, Content Bank, Program Info | `[ ]` |
| 5 | Check profile name appears in sidebar | User initials badge visible at bottom | `[ ]` |

### TC-01.03 — Admin Login Flow  
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Enter admin credentials | Fields accept input | `[ ]` |
| 2 | Click "Sign In" | Loading spinner appears | `[ ]` |
| 3 | Wait for redirect | Redirects to `/admin` (Admin Dashboard Hub) | `[ ]` |
| 4 | Verify sidebar shows Admin Portal items | Dashboard Hub, Training Modules, Educators Module, Content Bank, Provision Keys, Content Architect, Counsellor Registry | `[ ]` |

### TC-01.04 — Sign-Up Flow
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Toggle to "Sign Up" mode | Sign up form appears with Name, Email, Password, Confirm Password | `[ ]` |
| 2 | Enter valid info and submit | Account created, success toast or redirect | `[ ]` |
| 3 | Check profile row in `profiles` table | New row exists with `role: counsellor`, `full_name` populated | `[ ]` |

### TC-01.05 — Invalid Credentials
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Enter wrong password for valid email | Error message: "Invalid login credentials" | `[ ]` |
| 2 | Enter non-existent email | Error message displayed | `[ ]` |
| 3 | Leave fields empty and click Sign In | Validation prevents submission | `[ ]` |

### TC-01.06 — Session Persistence
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Login, then close browser tab | Session persists | `[ ]` |
| 2 | Reopen `/` | User is still authenticated, dashboard loads | `[ ]` |
| 3 | Click Logout button in sidebar | Redirects to `/login`, session cleared | `[ ]` |
| 4 | Navigate to `/` while logged out | Redirects to `/login` | `[ ]` |

### TC-01.07 — Role-Based Redirect
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Login as `admin` role | Redirect to `/admin` | `[ ]` |
| 2 | Login as `counsellor` role | Redirect to `/` (dashboard) | `[ ]` |
| 3 | Login as `nutripreneur` role | Redirect to `/` or `/nutripreneur` | `[ ]` |
| 4 | Admin tries to access `/` | Can access as fallback | `[ ]` |
| 5 | Counsellor tries to access `/admin` | Should be redirected or blocked | `[ ]` |

---

## TS-02: User Dashboard (Home Page)

> **Page:** `/`  
> **Priority:** 🔴 P0  
> **File:** `src/app/page.tsx`

### TC-02.01 — Dashboard Load & Stats
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Login as counsellor | Dashboard page loads | `[ ]` |
| 2 | Verify "Welcome Back" hero section | Shows user's first name | `[ ]` |
| 3 | Check progress bar | Circular progress ring renders with correct % | `[ ]` |
| 4 | Verify module cards render | All accessible modules listed as cards | `[ ]` |
| 5 | Check "Resume Training" button | Button visible, links to last incomplete module/segment | `[ ]` |

### TC-02.02 — Progress Tracking Accuracy
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Complete 2 segments in Module 1 | Dashboard progress % increases proportionally | `[ ]` |
| 2 | Complete all segments in Module 1 | Module 1 marked as 100% complete | `[ ]` |
| 3 | Verify progress counts unique topic_codes | No duplicate counting (Set-based deduplication) | `[ ]` |
| 4 | Check that quiz completions count as progress | `MODULE_module-2` code appears in progress | `[ ]` |

### TC-02.03 — Training Buddy Display
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | User with assigned buddy logs in | Training buddy card visible on dashboard | `[ ]` |
| 2 | Verify buddy name, email, phone display | All fields populated from `profiles.training_buddy` JSON | `[ ]` |
| 3 | Click WhatsApp icon on buddy card | Opens `wa.me/{phone}` in new tab | `[ ]` |

### TC-02.04 — Module Navigation Cards
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Click on a module card | Navigates to `/modules/{id}` | `[ ]` |
| 2 | Verify incomplete modules show progress % | Percentage renders correctly | `[ ]` |
| 3 | Verify completed modules show ✓ badge | Green check icon visible | `[ ]` |
| 4 | Verify locked/inaccessible modules | Modules not in `allowed_modules` are hidden or greyed out | `[ ]` |

### TC-02.05 — Dashboard Tour
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | New user's first login | Dashboard tour overlay appears (if `DashboardTour` triggered) | `[ ]` |
| 2 | Step through all tour steps | Each step highlights correct UI element | `[ ]` |
| 3 | Complete tour | `localStorage` flag set, tour does not show again | `[ ]` |
| 4 | Clear localStorage and reload | Tour reappears | `[ ]` |

---

## TS-03: Training Modules Page

> **Page:** `/training`  
> **Priority:** 🟠 P1  
> **File:** `src/app/training/page.tsx`

### TC-03.01 — Module List Display
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Navigate to `/training` | All accessible modules listed | `[ ]` |
| 2 | Verify module titles, descriptions render | Each module card shows title + description | `[ ]` |
| 3 | Verify per-module progress bars | Progress percentage visible per module | `[ ]` |
| 4 | Check access control | Only modules in user's `allowed_modules` (or general modules) visible | `[ ]` |

### TC-03.02 — Module Access Filtering
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Login as `tech` role with no extra modules | Only Module 1 & 2 visible | `[ ]` |
| 2 | Login as `counsellor` | All 5 modules + Educators visible | `[ ]` |
| 3 | Login as `bd` with `allowed_modules: ['module-3']` | Modules 1, 2, 3 visible | `[ ]` |

### TC-03.03 — Module Card Click
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Click any module card | Navigates to `/modules/{id}` | `[ ]` |
| 2 | Click Educators module card | Navigates to `/educators` | `[ ]` |

---

## TS-04: Module Detail Page (Segments)

> **Page:** `/modules/[id]`  
> **Priority:** 🔴 P0  
> **File:** `src/app/modules/[id]/page.tsx` + `src/components/TopicCard.tsx`

### TC-04.01 — Module Page Load
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Navigate to `/modules/module-1` | Module page loads with all segments (TopicCards) | `[ ]` |
| 2 | Verify module title in header | Correct module title displayed | `[ ]` |
| 3 | Verify segment count | Matches static syllabus + dynamic content from DB | `[ ]` |
| 4 | Check that page scrolls to top | Window scrolls to top on module change | `[ ]` |

### TC-04.02 — Segment / TopicCard Interaction
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | View a TopicCard | Title, code, content, and resource links visible | `[ ]` |
| 2 | Click a YouTube link | YouTube player embeds inline within card | `[ ]` |
| 3 | Click a Google Doc/Slides link | Document viewer overlay opens | `[ ]` |
| 4 | Click a Drive folder link | Embedded folder grid view opens | `[ ]` |
| 5 | Click external link (non-embeddable) | "Open in new tab" card shown with CTA button | `[ ]` |
| 6 | Verify "Learning Outcome" badge | If `topic.outcome` exists, green badge renders | `[ ]` |

### TC-04.03 — Segment Completion Toggle
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Click the checkmark button on a segment | Segment marked as complete (green check) | `[ ]` |
| 2 | Verify `mentor_progress` table | Row inserted with `user_id`, `topic_code`, `module_id` | `[ ]` |
| 3 | Uncheck the same segment | Segment reverts to incomplete | `[ ]` |
| 4 | Verify `mentor_progress` table | Row deleted for that topic_code | `[ ]` |
| 5 | Refresh page | Completion state persists from DB | `[ ]` |

### TC-04.04 — AI Assessment (Module Quiz)
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Complete all segments in Module 2 | "Continue" button appears | `[ ]` |
| 2 | Click "Continue" | Quiz invitation modal appears ("Module Quiz") | `[ ]` |
| 3 | Click "Start Module Quiz" | AI generates questions, quiz UI renders | `[ ]` |
| 4 | Verify timer | 10-minute countdown visible | `[ ]` |
| 5 | Answer all MCQ questions | Each answer advances to next question | `[ ]` |
| 6 | Answer a text-type question | Textarea renders, "Submit Answer" button works | `[ ]` |
| 7 | Complete all questions | Score result modal appears with circular progress | `[ ]` |
| 8 | Verify `assessment_logs` table | Row inserted with `topic_code: MODULE_module-2`, score, raw_data | `[ ]` |
| 9 | Verify answer review section | Each question shown with correct/incorrect status and AI feedback | `[ ]` |
| 10 | Timer expires mid-quiz | Auto-submits remaining answers as empty | `[ ]` |

### TC-04.05 — AI Assessment (Per-Segment Retention Check)
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Click "Start Retention Check" on a TopicCard | AI generates test questions for that segment | `[ ]` |
| 2 | Complete the quiz | Results modal appears | `[ ]` |
| 3 | Verify `assessment_logs` entry | Logged with segment-level `topic_code` | `[ ]` |

### TC-04.06 — Module Completion Flow
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Complete all segments + pass quiz in Module 1 | "Continue" navigates to next module | `[ ]` |
| 2 | Complete Module 2 (general), user has role-specific modules | Transition screen: "General Training Done" → next module | `[ ]` |
| 3 | Complete final module for user | "Training Complete" banner with certificate | `[ ]` |
| 4 | Verify certificate email | Auto-email sent to user with certificate data | `[ ]` |
| 5 | After training complete, CTA shows "Explore Educator Module" | If user has educators access | `[ ]` |

### TC-04.07 — Module Navigation (Prev/Next)
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | On Module 2, verify "Previous Module" button | Navigates to Module 1 | `[ ]` |
| 2 | On Module 1, verify no "Previous" button | Button disabled or not shown | `[ ]` |
| 3 | On last module, verify no "Next Module" | Navigates to dashboard on completion | `[ ]` |

### TC-04.08 — Access Restricted Screen
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | `tech` user navigates to `/modules/module-3` | "Access Restricted" page renders | `[ ]` |
| 2 | Verify "Contact your admin" message | Displayed below title | `[ ]` |
| 3 | Click "Return to Dashboard" | Navigates to `/` | `[ ]` |

### TC-04.09 — Dynamic Content Overrides
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Admin adds content via Content Architect for Module 1 | New segment appears in Module 1 for all users | `[ ]` |
| 2 | Admin edits an existing segment title | Title update reflected in user view | `[ ]` |
| 3 | Verify `sort_order` | Dynamic content sorted by DB-defined order | `[ ]` |

### TC-04.10 — Admin Edit Mode (Inline)
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Login as admin, navigate to `/modules/module-1` | "Edit Mode" toggle visible | `[ ]` |
| 2 | Enable Edit Mode | All TopicCard titles become editable inputs | `[ ]` |
| 3 | Edit title, content, outcome | Changes reflected in local state immediately | `[ ]` |
| 4 | Click "Save Changes" | Changes upserted to `syllabus_content` table | `[ ]` |
| 5 | Drag-and-drop reorder segments | New `sort_order` saved to DB | `[ ]` |
| 6 | Delete a dynamic segment | Removed from `syllabus_content`, disappears from UI | `[ ]` |
| 7 | Add new inline segment | Title, type, link fields → saves as new `syllabus_content` row | `[ ]` |

### TC-04.11 — Academy Simulator
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Click "Practice Simulation" button (if available) | Simulator overlay opens | `[ ]` |
| 2 | Interact with AI client | AI responds contextually | `[ ]` |
| 3 | Complete simulation | Result logged to `simulation_logs` | `[ ]` |

### TC-04.12 — Document Viewer Overlay
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Click a document link | Full-screen overlay with iframe embed | `[ ]` |
| 2 | Click prev/next arrows | Navigates between documents in same segment | `[ ]` |
| 3 | Click "Open Externally" | Opens in new tab | `[ ]` |
| 4 | Click close (X) button | Overlay closes cleanly | `[ ]` |

### TC-04.13 — Health & Diagnostics Popup
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Click health ecosystem card (isPopup link) | Modal with Doctors / Pharma tabs appears | `[ ]` |
| 2 | Switch to "Doctors" tab | Nutritional Integration, Smart Clinic, HCP Document cards visible | `[ ]` |
| 3 | Switch to "Pharma Partnerships" tab | Pharma Partnerships, Chemist Partnerships cards visible | `[ ]` |
| 4 | Click a card | Opens corresponding PDF in document viewer | `[ ]` |

---

## TS-05: Certification Page

> **Page:** `/certification`  
> **Priority:** 🟠 P1  
> **File:** `src/app/certification/page.tsx`

### TC-05.01 — Page Load
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Navigate to `/certification` | Certification page loads with exam sections | `[ ]` |
| 2 | Verify progress requirement | Page shows prerequisite completion message if training incomplete | `[ ]` |

### TC-05.02 — Multi-Section Exam Flow
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Start certification exam | First section loads with questions | `[ ]` |
| 2 | Answer all questions in Section 1 | Advances to Section 2 | `[ ]` |
| 3 | Complete all sections | Submit button enabled | `[ ]` |
| 4 | Submit exam | AI grading API called, results displayed | `[ ]` |

### TC-05.03 — Result & Logging
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | After submission | Score displayed with percentage | `[ ]` |
| 2 | Verify `certification_attempts` table | Row inserted with score, answers, timestamp | `[ ]` |
| 3 | Check attempt count | User's attempt number incremented | `[ ]` |
| 4 | Retry logic | If failed, can attempt again (if allowed) | `[ ]` |

---

## TS-06: Content Bank (Asset Central)

> **Page:** `/content-bank`  
> **Priority:** 🟡 P2  
> **File:** `src/app/content-bank/page.tsx`

### TC-06.01 — Page Load & Folders
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Navigate to `/content-bank` | Page loads with folder grid | `[ ]` |
| 2 | Verify default folders | Sales Training, Phase 1, Phase 2, Program Manuals visible | `[ ]` |
| 3 | Verify custom folders from DB | Any admin-created folders from `syllabus_folders` render | `[ ]` |

### TC-06.02 — Folder Navigation
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Click on a folder | Content items within folder load | `[ ]` |
| 2 | Verify content items | Videos, documents, links categorized by prefix | `[ ]` |
| 3 | Click back / breadcrumb | Returns to folder grid | `[ ]` |

### TC-06.03 — Search & Filter
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Type in search box | Content filtered in real-time | `[ ]` |
| 2 | Search by title keyword | Matching items shown | `[ ]` |
| 3 | Clear search | All items restored | `[ ]` |

### TC-06.04 — Content Playback
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Click a video item | Video player modal opens | `[ ]` |
| 2 | Click a document item | Document viewer opens in modal | `[ ]` |
| 3 | Close modal | Returns to content list cleanly | `[ ]` |

---

## TS-07: Educators Module (CRM Library)

> **Page:** `/educators`  
> **Priority:** 🟡 P2  
> **File:** `src/app/educators/page.tsx` + `src/components/ContentCard.tsx` + `src/components/ContentModal.tsx`

### TC-07.01 — Page Load
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Navigate to `/educators` (after reaching 90% progress) | Kanban board loads with 6 columns | `[ ]` |
...
### TS-15.03 — Activity Logging
...
### TS-13.02 — Global Training Efficiency
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Check progress percentage | Calculated from valid topic codes for user's accessible modules | `[ ]` |
| 2 | Verify progress bar | Width matches percentage | `[ ]` |
| 3 | Verify "Total Engagements Recorded" | Count equals `activity_logs` rows for user | `[ ]` |
| 4 | Verify "Active: {date}" badge | Shows last activity date | `[ ]` |
...
### TC-02.05 — Dashboard Tour
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | New user's first login | Dashboard tour overlay appears (if `DashboardTour` triggered) | `[ ]` |
| 2 | Step through all tour steps | Each step highlights correct UI element | `[ ]` |
| 3 | Complete tour | `localStorage` flag set, tour does not show again | `[ ]` |
| 4 | Clear localStorage and reload | Tour reappears | `[ ]` |

### TC-02.06 — Educators Discovery Popup
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Reach 90% training progress | Educators Discovery overlay appears automatically | `[ ]` |
| 2 | Step through all 3 slides | Slides explain features and access | `[ ]` |
| 3 | Click "Explore Now" | Navigates to `/educators` | `[ ]` |
| 4 | Click "Remind me later" | Popup closes, disappears until next login or 100% completion | `[ ]` |
| 2 | Verify column headers | Videos & Reads, Gyan & Tips, Recipes, Success Stories, Podcasts, Challenges | `[ ]` |
| 3 | Verify total post count in header | "{N} posts ready to use" | `[ ]` |
| 4 | Verify marquee banner | Scrolling announcement visible at top | `[ ]` |

### TC-07.02 — Health Condition Tabs
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Click "All Content" tab | All posts shown across columns | `[ ]` |
| 2 | Click "PCOS" tab | Only PCOS-categorized posts shown | `[ ]` |
| 3 | Click "Pregnancy" tab | Only pregnancy content shown | `[ ]` |
| 4 | Click "Body Transformation" tab | Success stories + transformation content shown | `[ ]` |
| 5 | Verify each of 12 health tabs | Correct filtering behavior per tab | `[ ]` |

### TC-07.03 — Search Functionality
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Type "PCOS breakfast" in search | Relevant posts filtered using semantic search | `[ ]` |
| 2 | Type "recipe" | Recipe column items prioritized | `[ ]` |
| 3 | Clear search | All posts restored | `[ ]` |
| 4 | Verify synonym expansion | "gut" matches "acidity", "bloating", "digestion" | `[ ]` |
| 5 | Stop words ignored | "I need something for morning" → searches "morning" | `[ ]` |

### TC-07.04 — Client WhatsApp Number
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Enter 10-digit number in WhatsApp input | Number accepted | `[ ]` |
| 2 | Click "Set" | "Currently sending to: +91 {number}" confirmation | `[ ]` |
| 3 | Only digits allowed | Non-digit characters stripped | `[ ]` |

### TC-07.05 — Content Card Interaction
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Click a content card | ContentModal opens with full post details | `[ ]` |
| 2 | Verify video playback in modal | If video post, player renders | `[ ]` |
| 3 | Verify share functionality | Share to client WhatsApp button works | `[ ]` |
| 4 | Close modal | Modal closes cleanly | `[ ]` |

### TC-07.06 — Dashboard Access Buttons
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Click "Dashboard Access" button (top left) | Opens mentor dashboard in new tab | `[ ]` |

### TC-07.07 — Educators Tour
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Set `educators_tour_pending` in localStorage | Tour overlay appears on next load | `[ ]` |
| 2 | Step through tour | Each step highlights correct element (search, tabs, columns) | `[ ]` |
| 3 | Complete tour | `educators_tour_completed` flag set | `[ ]` |

---

## TS-08: Program Info Page

> **Page:** `/program-info`  
> **Priority:** 🟢 P3  
> **File:** `src/app/program-info/page.tsx`

### TC-08.01 — Page Load & Content
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Navigate to `/program-info` | Page loads with informational content | `[ ]` |
| 2 | Verify section structure | All info sections render with proper headings | `[ ]` |
| 3 | Check for broken links/images | No 404 resources | `[ ]` |

---

## TS-09: Admin Portal — Dashboard Hub

> **Page:** `/admin?tab=hub`  
> **Priority:** 🔴 P0  
> **File:** `src/app/admin/page.tsx` (lines 1358–1433)

### TC-09.01 — Hub Page Load
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Login as admin, navigate to `/admin` | Hub tab active by default | `[ ]` |
| 2 | Verify stat cards | "Counsellors" count and "Pass Rate" visible | `[ ]` |
| 3 | Verify counsellor list (first 5) | Cards show name, email, quizzes, avg score, audits | `[ ]` |

### TC-09.02 — Counsellor Card Actions
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Click "View Profile" on a counsellor card | Profile detail view loads | `[ ]` |
| 2 | Verify quiz count | Matches `assessment_logs` for that user | `[ ]` |
| 3 | Verify average score calculation | Average of `(score/total_questions) * 100` | `[ ]` |
| 4 | Verify audit count | Matches `summary_audits` for that user | `[ ]` |

### TC-09.03 — Tab Navigation
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Click sidebar "Provision Keys" | URL changes to `/admin?tab=provisioning` | `[ ]` |
| 2 | Click sidebar "Content Architect" | URL changes to `/admin?tab=architect` | `[ ]` |
| 3 | Click sidebar "Counsellor Registry" | URL changes to `/admin?tab=registry` | `[ ]` |
| 4 | Click sidebar "Dashboard Hub" | URL changes to `/admin?tab=hub` | `[ ]` |

---

## TS-10: Admin Portal — Provision Keys

> **Page:** `/admin?tab=provisioning`  
> **Priority:** 🔴 P0  
> **File:** `src/app/admin/page.tsx` (lines 1434–1660+)

### TC-10.01 — Create User Form
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Navigate to Provisioning tab | "Provision Access" form renders | `[ ]` |
| 2 | Verify all form fields | Full Name, Email, Role dropdown, Phone, Password, Training Buddies | `[ ]` |
| 3 | Fill all fields with valid data | No validation errors | `[ ]` |
| 4 | Select "counsellor" role | Full Access badge: "✓ Full Module Access — all 5 modules" | `[ ]` |
| 5 | Select "tech" role | Module checkbox grid appears (M3, M4, M5, Educators) | `[ ]` |
| 6 | Check Module 3 and Educators | Checkboxes toggle to selected state | `[ ]` |

### TC-10.02 — User Creation API
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Submit create user form | API call to `/api/admin/create-user` | `[ ]` |
| 2 | Verify success message | "Authorized: {email}. Account created." | `[ ]` |
| 3 | Check `profiles` table | New row with correct role, allowed_modules, training_buddy | `[ ]` |
| 4 | Verify form resets | All fields clear after success | `[ ]` |

### TC-10.03 — Training Buddy Configuration
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Default buddy pre-filled | "BN Admin" with admin email shown | `[ ]` |
| 2 | Click "+ Add Another Buddy" | Additional buddy row appears | `[ ]` |
| 3 | Fill buddy name, email, phone | Fields accept input | `[ ]` |
| 4 | Click X on a buddy (if more than 1) | Removes that buddy row | `[ ]` |
| 5 | Submit form | Buddies saved as JSON array in `training_buddy` column | `[ ]` |

### TC-10.04 — Duplicate Email Handling
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Try creating user with existing email | Error: "Provisioning failed" or similar | `[ ]` |
| 2 | Form remains populated | User can correct and resubmit | `[ ]` |

---

## TS-11: Admin Portal — Content Architect

> **Page:** `/admin?tab=architect`  
> **Priority:** 🟠 P1  
> **File:** `src/components/admin/ContentArchitect.tsx` + `src/components/admin/AssetCentral.tsx` + `src/components/admin/QuizProtocolEditor.tsx`

### TC-11.01 — Content Architect Tab
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Navigate to Content Architect | Sub-tabs render: Content, Asset Central, Quiz Protocols | `[ ]` |
| 2 | Verify content upload form | Module selector, title, content type, link fields | `[ ]` |

### TC-11.02 — Dynamic Content Upload
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Select a module from dropdown | Module ID populated | `[ ]` |
| 2 | Enter topic title | Title field accepts input | `[ ]` |
| 3 | Select content type (video/document) | Type selection works | `[ ]` |
| 4 | Enter content link | URL field accepts input | `[ ]` |
| 5 | Submit form | API call to `/api/admin/content` | `[ ]` |
| 6 | Verify `syllabus_content` table | New row with module_id, title, content, topic_code | `[ ]` |
| 7 | User navigates to that module | New segment visible at bottom of module | `[ ]` |

### TC-11.03 — Content Management List
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Existing dynamic content items listed | Title, module, type, created date visible | `[ ]` |
| 2 | Click delete on an item | Confirmation dialog appears | `[ ]` |
| 3 | Confirm deletion | Item removed from `syllabus_content` | `[ ]` |
| 4 | Verify user view | Deleted segment no longer appears in module page | `[ ]` |

### TC-11.04 — Asset Central (Folder Management)
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Navigate to Asset Central sub-tab | Folder list renders | `[ ]` |
| 2 | Create new folder (name + prefix) | API call to `/api/admin/folders` POST | `[ ]` |
| 3 | Verify folder in Content Bank | New folder appears in user's Content Bank view | `[ ]` |
| 4 | Rename a folder | API call to `/api/admin/folders` PUT | `[ ]` |
| 5 | Delete a folder | Confirmation → API call DELETE | `[ ]` |

### TC-11.05 — Quiz Protocol Editor  
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Navigate to Quiz Protocols sub-tab | Topic selector dropdown visible | `[ ]` |
| 2 | Select a topic code | Fetches existing quiz from `/api/admin/quiz` | `[ ]` |
| 3 | If quiz exists | Questions populate in editor | `[ ]` |
| 4 | Edit a question text | Text field updates | `[ ]` |
| 5 | Change question type (MCQ ↔ text) | Type toggle works | `[ ]` |
| 6 | Add/remove answer options | Options list updates | `[ ]` |
| 7 | Set correct answer | Correct answer saved | `[ ]` |
| 8 | Enter AI Guidance prompt | Text saved with quiz | `[ ]` |
| 9 | Click "Generate AI Suggestions" | API call to `/api/admin/quiz/suggestions` | `[ ]` |
| 10 | Click "Save Quiz" | API POST to `/api/admin/quiz` | `[ ]` |
| 11 | Verify user sees custom quiz | User taking quiz for that topic gets admin-defined questions | `[ ]` |
| 12 | Click "Revert to AI Protocol" | Deletes custom quiz, user gets dynamic AI-generated questions | `[ ]` |

---

## TS-12: Admin Portal — Counsellor Registry

> **Page:** `/admin?tab=registry`  
> **Priority:** 🟠 P1  
> **File:** `src/app/admin/page.tsx` (registry section)

### TC-12.01 — Registry List
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Navigate to Registry tab | Searchable list of all profiles | `[ ]` |
| 2 | Verify each entry shows | Name, email, role, join date | `[ ]` |
| 3 | Search by name | Filter updates in real-time | `[ ]` |
| 4 | Search by email | Filter matches email substring | `[ ]` |

### TC-12.02 — Click into Profile
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Click any user row | Profile detail view opens | `[ ]` |
| 2 | "Back to Registry" button works | Returns to list view | `[ ]` |

---

## TS-13: Admin Portal — User Profile Detail

> **Priority:** 🔴 P0  
> **File:** `src/app/admin/page.tsx` (lines 761–1357)

### TC-13.01 — Profile Header Display
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | View user profile | Avatar initial, name, email displayed | `[ ]` |
| 2 | Verify role badge | Correct role label shown | `[ ]` |
| 3 | Verify join date | `created_at` formatted correctly | `[ ]` |

### TC-13.02 — Global Training Efficiency
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Check progress percentage | Calculated from valid topic codes for user's accessible modules | `[ ]` |
| 2 | Verify progress bar | Width matches percentage | `[ ]` |
| 3 | Verify "Total Engagements Recorded" | Count equals `activity_logs` rows for user | `[ ]` |
| 4 | Verify "Active: {date}" badge | Shows last activity date | `[ ]` |

### TC-13.03 — Contact Actions
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Click WhatsApp button | Opens `wa.me/{phone}` in new tab | `[ ]` |
| 2 | Click Email button | Email modal opens with To, Subject, Message fields | `[ ]` |
| 3 | Send email | API call to `/api/admin/send-email` | `[ ]` |
| 4 | Success alert | "Email sent successfully!" | `[ ]` |

### TC-13.04 — Buddy Management
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | View assigned buddies | Buddy name, email, phone displayed | `[ ]` |
| 2 | Click edit (pencil) icon | Buddy edit form appears | `[ ]` |
| 3 | Modify buddy name | Field accepts input | `[ ]` |
| 4 | Click "+ Add Another Support" | New empty buddy row added | `[ ]` |
| 5 | Click X on a buddy row | Row removed | `[ ]` |
| 6 | Click "Save Changes" | `profiles.training_buddy` updated with JSON | `[ ]` |
| 7 | Click "Cancel" | Changes discarded, form closes | `[ ]` |

### TC-13.05 — Profile Editing
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Click edit (pencil) icon on profile card | Edit form appears with Phone, Role, Module Access | `[ ]` |
| 2 | Change phone number | Input accepts new value | `[ ]` |
| 3 | Change role to "admin" | Full Access badge appears for module access | `[ ]` |
| 4 | Change role to "tech" | Module checkbox grid appears | `[ ]` |
| 5 | Toggle module checkboxes | Checkboxes respond correctly | `[ ]` |
| 6 | Click "Save Changes" | `profiles` table updated with new role, phone, allowed_modules | `[ ]` |
| 7 | Verify user's view changes | User now sees/doesn't see modules based on new access | `[ ]` |

### TC-13.06 — Activity Trail
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | View "Recent Activity Trail" section | Timeline of user actions | `[ ]` |
| 2 | Verify activity types | `view_module`, `complete_segment`, `start_quiz`, `complete_quiz` | `[ ]` |
| 3 | Verify timestamps | Correct date/time display | `[ ]` |
| 4 | Verify scrollable container | Max height with scroll if many entries | `[ ]` |

### TC-13.07 — Assessment History
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | View "Assessment History" section | Quiz cards with topic code, score, date | `[ ]` |
| 2 | Click "Review Quiz" | Detailed quiz review opens (selectedQuiz) | `[ ]` |
| 3 | Click "Give Retest" | Confirmation dialog → deletes assessment row | `[ ]` |
| 4 | Verify user can retake quiz | After retest granted, quiz available again | `[ ]` |
| 5 | Click "Email" link | Opens mailto with quiz subject | `[ ]` |

### TC-13.08 — Training Progress Map
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | View progress map section | All modules listed with per-module progress % | `[ ]` |
| 2 | Verify individual segment dots | Each dot colored (teal=done, gray=pending) | `[ ]` |
| 3 | Hover a dot | Shows topic title in tooltip | `[ ]` |
| 4 | Verify quiz dot included | "Mastery Quiz" dot present for modules with quizzes | `[ ]` |
| 5 | Verify dynamic segments included | Purely dynamic segments counted in progress | `[ ]` |

### TC-13.09 — Audit & Feedback
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | View "Audit & Feedback Repository" | All audit reports for this user listed | `[ ]` |
| 2 | Verify audit card content | Topic code, score, feedback, date | `[ ]` |
| 3 | If AI feedback exists | AI System Feedback section visible | `[ ]` |
| 4 | Click "View Input Data" | Opens selectedAudit details | `[ ]` |

### TC-13.10 — Submit Audit Report
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Scroll to "Add Audit Report" form | Score (0-100) and Feedback fields visible | `[ ]` |
| 2 | Enter score and feedback | Fields accept input | `[ ]` |
| 3 | Submit audit | Row inserted in `summary_audits` | `[ ]` |
| 4 | New audit appears in feed | Immediately visible in audit list | `[ ]` |

### TC-13.11 — Share Activity Report
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Click "Share Activity Report" | Performance report compiled and sent to buddy | `[ ]` |

### TC-13.12 — Clear Activity History
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Click "Clear Activity History" | Confirmation dialog: "⚠️ CAUTION..." | `[ ]` |
| 2 | Confirm reset | API call to `/api/admin/users/reset-history` | `[ ]` |
| 3 | Verify all 6 tables cleared | `activity_logs`, `mentor_progress`, `assessment_logs`, `simulation_logs`, `summary_audits`, `certification_attempts` — all rows for user deleted | `[ ]` |
| 4 | Fresh start marker | New activity log with `fresh_start` type created | `[ ]` |
| 5 | User dashboard shows 0% progress | All progress reset | `[ ]` |

### TC-13.13 — Danger Zone: Delete Account
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Scroll to "Danger Zone" | Red-themed section visible | `[ ]` |
| 2 | Type "delete account" in confirmation field | Button activates (turns red) | `[ ]` |
| 3 | Type wrong phrase | Button stays disabled (grey) | `[ ]` |
| 4 | Click "Permanent Deletion" | API call to `/api/admin/delete-user` | `[ ]` |
| 5 | Verify user removed | Profile cleared, redirects back to registry | `[ ]` |
| 6 | Deleted user cannot login | Login attempt fails | `[ ]` |

---

## TS-14: Sidebar Navigation

> **Priority:** 🟡 P2  
> **File:** `src/components/Sidebar.tsx`

### TC-14.01 — Sidebar Display
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Login as any user | Sidebar renders on left side | `[ ]` |
| 2 | Verify BN logo | Logo image loads correctly | `[ ]` |
| 3 | Verify "Account Status: Active" badge | Green check + Active text | `[ ]` |
| 4 | Verify user initials at bottom | Correct 2-letter initials from name | `[ ]` |

### TC-14.02 — Collapse/Expand
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Click collapse button (chevron) | Sidebar narrows to 88px icon-only mode | `[ ]` |
| 2 | Hover over icon | Tooltip shows nav item name | `[ ]` |
| 3 | Click expand button | Sidebar widens to 280px with full labels | `[ ]` |

### TC-14.03 — Active State Highlighting
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Navigate to `/training` | "Training Modules" nav item highlighted with teal gradient | `[ ]` |
| 2 | Navigate to `/admin?tab=provisioning` | "Provision Keys" highlighted (tab-aware detection) | `[ ]` |
| 3 | Animated indicator bar | White bar animates (layoutId) to active item | `[ ]` |

### TC-14.04 — Role-Based Menu Items
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Login as `counsellor` | 5 items: Dashboard, Training Modules, Certification, Content Bank, Program Info | `[ ]` |
| 2 | Login as `admin` | 7 items: Dashboard Hub, Training Modules, Educators Module, Content Bank, Provision Keys, Content Architect, Counsellor Registry | `[ ]` |

---

## TS-15: Cross-Cutting Concerns

### TC-15.01 — Responsive Design
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Resize to mobile (375px) | All pages remain usable, no overflow | `[ ]` |
| 2 | Resize to tablet (768px) | Grid layouts adjust to fewer columns | `[ ]` |
| 3 | Full desktop (1440px+) | Optimal desktop layout | `[ ]` |
| 4 | Sidebar collapse on mobile | Auto-collapse behavior | `[ ]` |

### TC-15.02 — Animations & Transitions
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Page transitions | Framer Motion fade/slide animations smooth | `[ ]` |
| 2 | Module cards hover | Hover lift/shadow effects work | `[ ]` |
| 3 | Modal open/close | AnimatePresence transitions clean | `[ ]` |
| 4 | Progress bar animation | Animated width transition on load | `[ ]` |

### TC-15.03 — Activity Logging
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | View a module page | `view_module` logged to `activity_logs` | `[ ]` |
| 2 | View a topic card | `view_topic` logged | `[ ]` |
| 3 | Complete a segment | `complete_segment` logged | `[ ]` |
| 4 | Start a quiz | `start_quiz` logged | `[ ]` |
| 5 | Complete a quiz | `complete_quiz` logged with score | `[ ]` |
| 6 | Click a resource link | `click_link` logged | `[ ]` |

### TC-15.04 — Data Persistence
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Complete segments → logout → login | Progress persists from DB | `[ ]` |
| 2 | Quiz scores persist | Assessment logs unchanged after re-auth | `[ ]` |
| 3 | LocalStorage sync | `bn-topic-progress-{userId}-{code}` keys updated | `[ ]` |
| 4 | Tour completion flags persist | localStorage `dashboard_tour_completed`, `educators_tour_completed` | `[ ]` |

### TC-15.05 — Error Handling
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | API returns error on quiz generation | "Failed to generate test" toast/alert | `[ ]` |
| 2 | Network offline during submission | Graceful error message | `[ ]` |
| 3 | Supabase auth session expired | Redirect to `/login` | `[ ]` |
| 4 | Navigate to non-existent module | "Module Out of Reach" screen rendered | `[ ]` |
| 5 | Navigate to restricted module | "Access Restricted" screen rendered | `[ ]` |

### TC-15.06 — API Endpoints Verification

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/admin/create-user` | POST | Create new user with profile | `[ ]` |
| `/api/admin/delete-user` | POST | Permanently delete a user | `[ ]` |
| `/api/admin/dashboard-sync` | GET | Fetch all admin dashboard data | `[ ]` |
| `/api/admin/content` | POST | Upload dynamic syllabus content | `[ ]` |
| `/api/admin/folders` | POST/PUT/DELETE | CRUD for content bank folders | `[ ]` |
| `/api/admin/quiz` | GET/POST/DELETE | CRUD for quiz protocols | `[ ]` |
| `/api/admin/quiz/suggestions` | POST | AI-generate quiz suggestions | `[ ]` |
| `/api/admin/send-email` | POST | Send direct email to user | `[ ]` |
| `/api/admin/users/reset-history` | POST | Reset all user data across 6 tables | `[ ]` |
| `/api/auth/sync-profile` | POST | Ensure profile row exists for user | `[ ]` |
| `/api/generate-test` | POST | Generate AI assessment questions | `[ ]` |
| `/api/grade-exam` | POST | Grade quiz with answer token | `[ ]` |
| `/api/grade-summary` | POST | Grade summary/essay submissions | `[ ]` |
| `/api/send-certificate` | POST | Email training completion certificate | `[ ]` |
| `/api/send-mock-call-email` | POST | Send mock call notification email | `[ ]` |
| `/api/simulate-call` | POST | AI consultation simulator | `[ ]` |
| `/api/notify-buddy` | POST | Notify training buddy | `[ ]` |

### TC-15.07 — Security Checks
| # | Step | Expected Result | Status |
|---|------|----------------|--------|
| 1 | Access `/admin` as counsellor | Either redirected or see empty/error state | `[ ]` |
| 2 | Call admin API without auth header | 401 Unauthorized response | `[ ]` |
| 3 | Call admin API with counsellor token | 403 Forbidden or role check failure | `[ ]` |
| 4 | Verify RLS policies active | Direct Supabase queries respect row-level security | `[ ]` |

---

## Test Accounts & Credentials Matrix

> [!IMPORTANT]
> Create test accounts before starting. Ensure each role is represented.

| # | Name | Email | Role | Module Access | Purpose |
|---|------|-------|------|---------------|---------|
| 1 | QA Admin | qa-admin@test.com | `admin` | All (auto) | Admin portal testing |
| 2 | QA Counsellor | qa-counsellor@test.com | `counsellor` | All (auto) | Full user flow |
| 3 | QA Tech | qa-tech@test.com | `tech` | M1, M2 only | Restricted access testing |
| 4 | QA BD Limited | qa-bd@test.com | `bd` | M1, M2, M3 | Partial access testing |
| 5 | QA Nutripreneur | qa-nutri@test.com | `nutripreneur` | M1, M2 | Minimal access |
| 6 | QA Fresh User | qa-fresh@test.com | `counsellor` | All | Zero-progress testing |

---

## Execution Priority Order

> [!TIP]  
> Follow this priority sequence for maximum coverage:

1. **TS-01** — Authentication (blocks everything else)
2. **TS-14** — Sidebar (validates portal routing)
3. **TS-02** — User Dashboard (core user experience)
4. **TS-04** — Module Detail + TopicCard (deepest interaction surface)
5. **TS-03** — Training List (navigation bridge)
6. **TS-09** → **TS-13** — Admin Portal (all tabs in sequence)
7. **TS-07** — Educators Module (post-training experience)
8. **TS-05** — Certification (end-of-journey)
9. **TS-06** — Content Bank
10. **TS-08** — Program Info
11. **TS-15** — Cross-cutting (run throughout)

---

> **QA Lead Signature:** ________________________  
> **Date Completed:** ________________________  
> **Build/Commit Tested:** ________________________
