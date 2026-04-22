# LMS Platform — Full Codebase Audit Report

Complete audit of `lms-platform` for clean deployment to a new repository.

---

## 🔴 Critical Issues (Must Fix Before Deployment)

### 1. Duplicate Config Files at Root Level

The Git repo root (`lms for mentors/`) contains **exact duplicates** of every config file that already lives inside `lms-platform/`. This causes Vercel to find two competing Next.js projects and is the **#1 source of deployment failures**.

| File at Root (DELETE) | Identical Copy in `lms-platform/` (KEEP) |
|---|---|
| `package.json` | `lms-platform/package.json` ✅ |
| `tsconfig.json` | `lms-platform/tsconfig.json` ✅ |
| `next.config.ts` | `lms-platform/next.config.ts` ✅ |
| `tailwind.config.js` | `lms-platform/tailwind.config.js` ✅ |
| `postcss.config.js` | `lms-platform/postcss.config.js` ✅ |
| `eslint.config.mjs` | `lms-platform/eslint.config.mjs` ✅ |
| `vercel.json` | `lms-platform/vercel.json` ✅ |
| `.gitignore` | `lms-platform/.gitignore` ✅ |
| `README.md` | `lms-platform/README.md` ✅ |

> [!CAUTION]
> The root-level `node_modules/`, `package-lock.json`, `.next/`, and `tsconfig.tsbuildinfo` are also bloating the repo. These must NOT be committed.

**Action:** Delete ALL of these from the root. Only `lms-platform/` should contain project files.

---

### 2. Rogue `n/` Directory — Recursive Project Copy

A directory called `n/` exists at the repo root containing:
```
n/Desktop/MouseWithoutBorders/lms for mentors (2)/lms for mentors/...
```

This is a **complete recursive copy of the entire project** — likely created by an accidental command. It contains hundreds of duplicate files and will massively bloat the repo.

> [!CAUTION]
> This directory alone could add 50+ MB of duplicate code to your Git history.

**Action:** Delete the entire `n/` directory.

---

### 3. Duplicate PDF Files at Multiple Locations

The same PDFs exist in **three places**:

| File | Root (DELETE) | `lms-platform/` root (DELETE) | `public/` (KEEP) |
|---|---|---|---|
| BN Chemist Deck | `BNChemistDeck (2).pdf` | `BNChemistDeck (2).pdf` | `public/BN_Chemist_Deck.pdf` ✅ |
| HCP Document | `Final BN_HCPs.pptx.pdf` | `Final BN_HCPs.pptx.pdf` | `public/HCP_Doc.pdf` ✅ |

**Action:** Delete the loose PDFs from root and `lms-platform/` root. The properly-named copies in `public/` are the ones the app references.

---

## 🟡 Important Issues (Should Fix)

### 4. `src/brain/` Directory — AI Conversation Artifacts

Two Gemini conversation directories exist under `src/brain/`:
- `src/brain/a0cee5d3-0ee3-4718-8741-195c0152b096/scratch/`  
- `src/brain/a7d75125-8023-4439-885a-e2bad667356b/scratch/`

These are AI assistant scratch files and should **not be committed** to the new repo.

**Action:** Delete `src/brain/` entirely. Add `src/brain/` to `.gitignore`.

---

### 5. `page.module.css` — Dead Code

`src/app/page.module.css` is a **Next.js boilerplate CSS module** file that is never imported anywhere in the codebase. It references `--font-geist-sans` which isn't used in this project (Outfit + Playfair Display are used instead).

**Action:** Delete `src/app/page.module.css`.

---

### 6. `assets/` Directory at `lms-platform/` Root — Redundant

```
lms-platform/assets/
├── BN-Logo_White-BG_BlackText_Tagline.jpg  (duplicate of public/assets/)
├── BN_Logo-BlueBG-Square-HD.png            (duplicate of public/assets/)
├── design-instructions.txt                 (dev-only reference)
└── test-paper.txt                          (dev artifact)
```

The logo files already exist in `public/assets/`. The text files are development artifacts.

**Action:** Delete `lms-platform/assets/` entirely. All production assets are in `public/`.

---

### 7. `docs/pdfs/` — Duplicate PDFs with Messy Names

```
docs/pdfs/
├── BNXFitnessFirst Context (1).pdf         → already in public/ as BNXFitnessFirst_Context.pdf
├── BNXFitnessFirst Proposal (1) (1).pdf    → not referenced, legacy
├── BN_Smart_Clinic_Pitch_Final.pptx (2).pdf → already in public/
├── Corporate Wellness Brochure (3).pdf     → already in public/docs/
├── Gym Brochure (1) (1) (1).pdf            → already in public/docs/
└── Pharma_Pitch_Deck (1).pdf               → already in public/
```

**Action:** Delete `docs/pdfs/` — all active documents are already in `public/` with clean filenames.

---

### 8. Unused Import in `admin-auth.ts`

Line 3 imports `supabaseAdmin` from `@/lib/supabase-admin`, but line 62 creates a **new local admin client** instead. The import is dead code.

**Action:** Remove unused import on line 3 of `src/lib/admin-auth.ts`.

---

### 9. `scripts/diagnostics/` — 29 User-Specific Debug Scripts

This directory contains one-off debug scripts for specific users:
- `check_shivani.js`, `check_shivani_audits.js`, `inspect_shivani.js`
- `check_rahul.ts`, `check_rahul_id.ts`, `check-anjali.ts`
- Plus 23 other ad-hoc debug/inspection scripts

These are development artifacts and should **not** ship in a production repo.

**Action:** Delete `scripts/diagnostics/` entirely.

---

### 10. Other Scripts to Clean

| Script | Status |
|---|---|
| `scripts/reset-shivani.ts` | User-specific, DELETE |
| `scripts/sync-priya.ts` | User-specific, DELETE |
| `scripts/find-vian.ts` | User-specific, DELETE |
| `scripts/fix-profiles.ts` | One-time migration, ARCHIVE or DELETE |
| `scripts/fix-registry-passwords.js` | One-time migration, ARCHIVE or DELETE |
| `scripts/fix_rls.js` | One-time migration, ARCHIVE or DELETE |
| `scripts/strict-cleanup.ts` | One-time cleanup, ARCHIVE or DELETE |
| `scripts/provision-accounts.ts` | **KEEP** — Active utility |
| `scripts/hydrate_educator_content.js` | **KEEP** — Seeding utility |
| `scripts/parse_social_content.js` | **KEEP** — Data processing |
| `scripts/system-health.js` + `.ts` | Duplicate (js + ts). Keep `.ts`, delete `.js` |
| `scripts/seeding/` | **KEEP** — All 4 seeding scripts are useful |

---

## 🟢 Clean Structure — What Should Ship

### Verified: All features and routes are present and correctly placed

#### App Router Pages (all have `page.tsx` ✅)
| Route | File | Status |
|---|---|---|
| `/` | `src/app/page.tsx` | ✅ Dashboard |
| `/login` | `src/app/login/page.tsx` | ✅ Auth |
| `/admin` | `src/app/admin/page.tsx` | ✅ Admin Dashboard |
| `/modules/[id]` | `src/app/modules/[id]/page.tsx` | ✅ Dynamic module |
| `/training` | `src/app/training/page.tsx` | ✅ Training hub |
| `/certification` | `src/app/certification/page.tsx` | ✅ Cert exam |
| `/content-bank` | `src/app/content-bank/page.tsx` | ✅ Content bank |
| `/educators` | `src/app/educators/page.tsx` | ✅ Educators module |
| `/program-info` | `src/app/program-info/page.tsx` | ✅ Program info |
| `/nutripreneur` | `src/app/nutripreneur/page.tsx` | ✅ Nutripreneur home |
| `/nutripreneur/login` | `src/app/nutripreneur/login/page.tsx` | ✅ |
| `/nutripreneur/content-bank` | `src/app/nutripreneur/content-bank/page.tsx` | ✅ |
| `/nutripreneur/progress` | `src/app/nutripreneur/progress/page.tsx` | ✅ |
| `/nutripreneur/quizzes` | `src/app/nutripreneur/quizzes/page.tsx` | ✅ |
| `/nutripreneur/reels` | `src/app/nutripreneur/reels/page.tsx` | ✅ |

#### API Routes (all have `route.ts` ✅)
| API Route | Status |
|---|---|
| `/api/admin/create-user` | ✅ |
| `/api/admin/delete-user` | ✅ |
| `/api/admin/dashboard-sync` | ✅ |
| `/api/admin/content` | ✅ |
| `/api/admin/folders` | ✅ |
| `/api/admin/notifications` | ✅ |
| `/api/admin/quiz` | ✅ |
| `/api/admin/quiz/suggestions` | ✅ |
| `/api/admin/reports/daily` | ✅ |
| `/api/admin/send-email` | ✅ |
| `/api/admin/sync-registry` | ✅ |
| `/api/admin/seed-mentors` | ✅ |
| `/api/admin/cleanup-users` | ✅ |
| `/api/admin/clear-history` | ✅ |
| `/api/admin/force-reset` | ✅ |
| `/api/admin/users/reset-history` | ✅ |
| `/api/auth/signup` | ✅ |
| `/api/auth/nutripreneur-signup` | ✅ |
| `/api/auth/sync-profile` | ✅ |
| `/api/generate-test` | ✅ |
| `/api/grade-exam` | ✅ |
| `/api/grade-summary` | ✅ |
| `/api/notify-buddy` | ✅ |
| `/api/send-certificate` | ✅ |
| `/api/send-mock-call-email` | ✅ |
| `/api/simulate-call` | ✅ |
| `/api/cron/buddy-daily-report` | ✅ |

#### Components (all correctly named PascalCase ✅)
| Component | Location | Status |
|---|---|---|
| `Sidebar` | `src/components/Sidebar.tsx` | ✅ |
| `TopicCard` | `src/components/TopicCard.tsx` | ✅ |
| `AIAssessment` | `src/components/AIAssessment.tsx` | ✅ |
| `AcademySimulator` | `src/components/AcademySimulator.tsx` | ✅ |
| `AssignmentForm` | `src/components/AssignmentForm.tsx` | ✅ |
| `ContentCard` | `src/components/ContentCard.tsx` | ✅ |
| `ContentModal` | `src/components/ContentModal.tsx` | ✅ |
| `DashboardTour` | `src/components/DashboardTour.tsx` | ✅ |
| `EducatorsDiscovery` | `src/components/EducatorsDiscovery.tsx` | ✅ |
| `EducatorsTour` | `src/components/EducatorsTour.tsx` | ✅ |
| `NotificationItem` | `src/components/NotificationItem.tsx` | ✅ |
| `SummaryGrader` | `src/components/SummaryGrader.tsx` | ✅ |
| `TrainingCertificate` | `src/components/TrainingCertificate.tsx` | ✅ |
| `YouTubePlayer` | `src/components/YouTubePlayer.tsx` | ✅ |
| `AssetCentral` | `src/components/admin/AssetCentral.tsx` | ✅ |
| `ContentArchitect` | `src/components/admin/ContentArchitect.tsx` | ✅ |
| `QuizProtocolEditor` | `src/components/admin/QuizProtocolEditor.tsx` | ✅ |
| `NutripreneurNav` | `src/components/nutripreneur/NutripreneurNav.tsx` | ✅ |
| `ViewProvider` | `src/components/nutripreneur/ViewProvider.tsx` | ✅ |

#### Libraries (all correctly named camelCase ✅)
| Library | Location | Status |
|---|---|---|
| Supabase Client | `src/lib/supabase.ts` | ✅ |
| Supabase Admin | `src/lib/supabase-admin.ts` | ✅ |
| Activity Logger | `src/lib/activity.ts` | ✅ |
| Admin Auth | `src/lib/admin-auth.ts` | ✅ (has unused import) |
| Module Access | `src/lib/moduleAccess.ts` | ✅ |
| Groq AI | `src/lib/groq.ts` | ✅ |
| Encryption | `src/lib/encryption.ts` | ✅ |
| Mail | `src/lib/mail.ts` | ✅ |
| WhatsApp | `src/lib/whatsapp.ts` | ✅ |
| BN CRM | `src/lib/bn-crm.ts` | ✅ |

#### All `@/` imports resolve correctly ✅
No broken imports found. No relative `../` imports used — all use the `@/` alias consistently.

---

## 📦 Recommended New Repo Structure

When pushing to the new repo, the structure should be:

```
/ (repo root = lms-platform contents)
├── .env.example
├── .gitignore               (updated — see below)
├── README.md
├── database/
│   └── schema.sql
├── docs/
│   ├── architectural_specs/
│   ├── archive/
│   └── project_management/
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.js
├── public/
│   ├── assets/
│   ├── docs/
│   ├── documents/
│   ├── *.pdf (6 partnership docs)
│   └── *.svg (icons)
├── scripts/
│   ├── seeding/
│   ├── provision-accounts.ts
│   ├── hydrate_educator_content.js
│   ├── parse_social_content.js
│   └── system-health.ts
├── src/
│   ├── app/        (all pages + API routes)
│   ├── components/ (all components)
│   ├── data/       (syllabus + social content)
│   └── lib/        (all utilities)
├── tailwind.config.js
├── tsconfig.json
└── vercel.json
```

### Updated `.gitignore` additions:
```
src/brain/
*.tsbuildinfo
.env.local
```

---

## Verification Plan

### Build Test
- Run `npm run build` inside `lms-platform/` to verify zero TypeScript errors

### Manual Verification
- Confirm all deleted files are truly unused by checking no imports reference them
- Deploy to new Vercel project and verify all routes load

## Open Questions

> [!IMPORTANT]
> **Repo Structure Decision:** When you create the new repo, will `lms-platform/` become the **root** of the new repo? (Recommended — this eliminates the subdirectory issues that caused previous Vercel failures.) Or will you keep the nested `lms-platform/` subfolder and configure Vercel's "Root Directory" to `lms-platform`?
