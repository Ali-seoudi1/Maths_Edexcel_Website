# Project Architecture

Architecture blueprint for the Edexcel O Level Mathematics learning and revision platform.

This document reflects the current product vision for one teacher and enrolled students.

## Product Vision

The application serves one Edexcel O Level Mathematics teacher and enrolled students.

The platform helps students revise through:

- PDF-based lessons
- solved examples PDFs
- assignments
- quizzes
- searchable past-paper model answers
- bookmarks
- reports
- announcements
- recent activity

The primary product feature is the model-answer search experience.

## Roles

There are exactly two roles:

| Role      | Meaning                       |
| --------- | ----------------------------- |
| `admin`   | The single teacher/admin user |
| `student` | Enrolled student              |

The `admin` role represents the teacher.

## High-Level Modules

```text
app/
  (public)/
  (auth)/
  (app)/              student area
  admin/              admin area
  api/admin/          trusted admin routes

features/
  auth/
  admin/
  students/
  lessons/
  topics/
  assignments/
  quizzes/
  model-answers/
  reports/
  announcements/
  bookmarks/
  recent-activity/

components/
  ui/
  layout/
  shared/
  dashboard/

lib/
  firebase/
  validators/
  utils/

services/
types/
constants/
docs/
```

## Folder Plan

### `features/auth`

Owns Firebase Authentication integration, session restoration, RBAC context, sign-in, sign-out, and password reset/setup flows.

Responsibilities:

- Firebase auth persistence
- `onAuthStateChanged` lifecycle
- loading/restored auth state
- `admin` / `student` route guards
- user profile lookup from `users/{uid}`

Does not own:

- student management workflows
- content CRUD
- Firestore schema definitions beyond auth profile reads

### `features/admin`

Owns admin layout and admin-only dashboard shell.

Responsibilities:

- admin navigation
- admin page headers
- protected admin workspace

Does not introduce a `teacher` role. The admin is the teacher.

### `features/admin/students`

Owns student account lifecycle.

Responsibilities:

- create student Auth user
- send password setup email
- create/delete `users/{uid}` student profiles
- list students
- edit student profile status

Trusted operations must go through `app/api/admin/*` routes using Firebase Admin SDK.

### `features/topics`

Future home for syllabus topic CRUD and topic browsing.

Responsibilities:

- topic list
- topic ordering
- topic status

### `features/lessons`

Owns PDF-based lesson workflows.

Lesson shape:

- title
- description
- topic
- lesson PDF
- solved examples PDF
- optional homework assignment link
- optional quiz link
- published status

Future implementation notes:

- Use Firebase Storage for PDFs.
- Use PDF.js or equivalent embedded viewer.
- Do not expose a download button in the app UI.

### `features/model-answers`

Primary product feature.

Responsibilities:

- search form by exam year, session, paper, question number
- exact metadata query
- display official mark scheme PDF/image
- display teacher written solution PDF/image
- bookmark action
- related questions placeholder

Version 1 search fields:

- exam year
- session: May/June or Oct/Nov
- paper
- question number

Version 2 candidate:

- topic search
- related-question recommendations

### `features/assignments`

Owns homework metadata and student submissions.

Responsibilities:

- assignment metadata
- optional lesson linkage
- due dates
- student PDF/image submissions
- teacher feedback

### `features/quizzes`

Owns quiz definitions and attempts.

Responsibilities:

- quiz metadata
- optional lesson linkage
- student attempts
- scoring state

### `features/reports`

Owns manual teacher-written reports.

Responsibilities:

- monthly/period reports
- draft/published state
- student-only report visibility

### `features/announcements`

Owns teacher announcements.

Responsibilities:

- announcement publishing
- audience visibility
- dashboard display

### `features/bookmarks`

Owns saved revision items.

Version 1 target:

- model answers

### `features/recent-activity`

Owns lightweight recent activity tracking.

Examples:

- viewed model answer
- viewed lesson PDF
- submitted assignment
- completed quiz

## Future API Design

APIs should be added only when trusted server behavior is required. Direct client Firestore access is acceptable for student-owned reads/writes when rules are sufficient.

### Admin Student APIs

```text
GET    /api/admin/students
POST   /api/admin/students
PATCH  /api/admin/students/:id
DELETE /api/admin/students/:id
```

Purpose:

- list students using Admin SDK
- create Auth user and profile
- send password setup email
- edit profile
- delete Auth user/profile consistently

### Admin Content APIs

Future routes:

```text
POST   /api/admin/topics
PATCH  /api/admin/topics/:id

POST   /api/admin/lessons
PATCH  /api/admin/lessons/:id
DELETE /api/admin/lessons/:id

POST   /api/admin/model-answers
PATCH  /api/admin/model-answers/:id
DELETE /api/admin/model-answers/:id
```

Use API routes when:

- writing trusted fields like `createdBy`, `publishedAt`, or status transitions
- validating Storage paths
- coordinating Firestore and Storage changes
- enforcing admin-only mutations

### Student Read APIs

Prefer direct Firestore reads with security rules for:

- published topics
- published lessons
- published assignments
- published quizzes
- published announcements
- own reports
- own bookmarks
- own recent activity

Use API routes for model-answer search only if server-side validation, rate limiting, or audit logging becomes necessary.

Candidate route:

```text
GET /api/model-answers/search?year=2024&session=may-june&paper=1H&questionNumber=9
```

### PDF Viewing Architecture

PDF files live in Firebase Storage.

Firestore stores:

- Storage path
- file name
- content type
- created/updated metadata

Future viewer behavior:

- request authorized PDF access
- render inline using PDF.js or equivalent
- hide app-level download controls
- rely on Firebase Storage rules for access control

## Data Access Rules

Admin:

- manages students
- manages topics
- manages lessons
- manages assignments
- manages quizzes
- manages model answers
- manages reports
- manages announcements

Student:

- reads published learning/revision content
- creates own assignment submissions
- creates own quiz attempts
- creates own bookmarks
- creates own recent activity
- reads own reports

## Architecture Boundaries

UI components:

- reusable display and form components
- no Firebase Admin SDK imports

Feature modules:

- feature-specific UI, services, schemas, and types
- no cross-feature business logic unless exported through services

API routes:

- trusted mutations
- admin-only operations
- Auth user lifecycle
- consistency between Firebase Auth, Firestore, and Storage

Firebase layer:

- `lib/firebase/client.ts` for browser SDK
- `lib/firebase/admin.ts` for server SDK only

## Major Architectural Decisions

1. Lessons are PDF learning packages with lesson and solved-examples documents.
2. Model answers are the primary revision workflow.
3. Topic search for model answers is deferred to Version 2.
4. The `admin` role represents the single teacher.
5. PDF viewing is an embedded viewer requirement, with no download button in UI.
