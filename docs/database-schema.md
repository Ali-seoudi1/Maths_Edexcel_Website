# Firestore Database Schema

Production Firestore blueprint for a learning and revision platform for one Edexcel O Level Mathematics teacher.

The platform has exactly two roles:

- `admin`: the teacher
- `student`: enrolled learner

This document is architecture only. It does not create collections, seed data, or implement features.

## Product Model

The platform is optimized for revision, PDFs, assignments, quizzes, reports, announcements, and past-paper model answers.

Primary feature: model answers search by exam metadata.

Lessons are PDF-based learning packages with lesson and solved-examples documents.

## Design Principles

- Firebase Authentication owns identity.
- `users/{uid}` owns application profile and RBAC.
- Firestore stores metadata and workflow state.
- Firebase Storage stores PDFs/images.
- Store Storage paths, not public download URLs.
- Students view PDFs inside the website through a future PDF.js or equivalent embedded viewer.
- Do not expose a download button for lesson PDFs, solved examples PDFs, mark schemes, or teacher solutions.
- Use top-level collections for admin workflows and cross-student reporting.
- Use deterministic document ids where uniqueness is natural.
- Use server-side Firebase Admin SDK for trusted admin actions.
- Design for one teacher.

## Entity Map

```text
users

topics
lessons
assignments
assignmentSubmissions
quizzes
quizAttempts
modelAnswers
announcements
reports
bookmarks
recentActivity
```

## Shared Types

| Type            | Values / Shape                         |
| --------------- | -------------------------------------- |
| `Role`          | `"admin"` or `"student"`               |
| `PublishStatus` | `"draft"`, `"published"`, `"archived"` |
| `ExamSession`   | `"may-june"` or `"oct-nov"`            |
| `StoragePath`   | Firebase Storage path string           |
| `Timestamp`     | Firestore timestamp                    |

## `users`

Why it exists: Stores application profiles for Firebase Auth users and powers RBAC.

Document ID strategy: Firebase Authentication `uid`.

Fields:

| Field         | Type      | Required | Notes                      |
| ------------- | --------- | -------- | -------------------------- |
| `uid`         | string    | yes      | Same as document id        |
| `email`       | string    | yes      | Lowercase normalized email |
| `fullName`    | string    | yes      | Display name               |
| `role`        | Role      | yes      | `admin` or `student` only  |
| `active`      | boolean   | yes      | Controls access            |
| `yearGroup`   | string    | student  | Example: `Year 11`         |
| `phone`       | string    | no       | Optional student contact   |
| `createdAt`   | Timestamp | yes      | Server timestamp           |
| `updatedAt`   | Timestamp | no       | Server timestamp           |
| `lastLoginAt` | Timestamp | no       | Optional audit field       |

Relationships:

- One `users/{uid}` document per Firebase Auth user.
- `studentId` fields in submissions, attempts, reports, bookmarks, and activity reference student users.
- `createdBy` and `updatedBy` fields reference the admin user.

Indexes required:

- `role ASC, fullName ASC`
- `role ASC, active ASC, fullName ASC`
- `email ASC`

Security considerations:

- Users may read their own profile.
- Admin may read and manage student profiles.
- Students may not list all users.
- Only server-side admin code may assign or change roles.

Scalability considerations:

- Keep user documents small.
- Do not store activity arrays on `users`; use separate collections.

## `topics`

Why it exists: Organizes lessons and optionally model answers by syllabus topic.

Document ID strategy: Slug, for example `algebra`, `trigonometry`, `functions`.

Fields:

| Field         | Type          | Required | Notes                |
| ------------- | ------------- | -------- | -------------------- |
| `title`       | string        | yes      | Topic name           |
| `slug`        | string        | yes      | Same as document id  |
| `description` | string        | no       | Short overview       |
| `order`       | number        | yes      | Manual display order |
| `status`      | PublishStatus | yes      | Visibility           |
| `createdAt`   | Timestamp     | yes      | Server timestamp     |
| `updatedAt`   | Timestamp     | no       | Server timestamp     |

Relationships:

- `lessons.topicId` references `topics/{topicId}`.
- `modelAnswers.topicId` is optional and intended mainly for Version 2 topic search.

Indexes required:

- `status ASC, order ASC`
- `slug ASC`

Security considerations:

- Active students can read published topics.
- Admin can create, update, archive, and reorder topics.

Scalability considerations:

- Topic count is expected to be small for one Edexcel O Level Mathematics teacher.

## `lessons`

Why it exists: Stores PDF-based lesson metadata. A lesson is a structured learning package for a topic.

Document ID strategy: Firestore auto id.

Fields:

| Field                       | Type          | Required | Notes                                              |
| --------------------------- | ------------- | -------- | -------------------------------------------------- |
| `title`                     | string        | yes      | Lesson title                                       |
| `description`               | string        | no       | Lesson summary                                     |
| `topicId`                   | string        | yes      | References `topics/{topicId}`                      |
| `topicTitle`                | string        | yes      | Denormalized display                               |
| `lessonPdfPath`             | StoragePath   | yes      | Main lesson PDF                                    |
| `lessonPdfFileName`         | string        | yes      | Original/display file name                         |
| `solvedExamplesPdfPath`     | StoragePath   | yes      | Solved examples PDF                                |
| `solvedExamplesPdfFileName` | string        | yes      | Original/display file name                         |
| `homeworkAssignmentId`      | string        | no       | Optional reference to `assignments/{assignmentId}` |
| `quizId`                    | string        | no       | Optional reference to `quizzes/{quizId}`           |
| `status`                    | PublishStatus | yes      | Draft, published, archived                         |
| `publishedAt`               | Timestamp     | no       | First published date                               |
| `order`                     | number        | yes      | Topic-local ordering                               |
| `createdBy`                 | string        | yes      | Admin uid                                          |
| `createdAt`                 | Timestamp     | yes      | Server timestamp                                   |
| `updatedAt`                 | Timestamp     | no       | Server timestamp                                   |

Relationships:

- Belongs to one topic.
- Can optionally link to one homework assignment.
- Can optionally link to one quiz.

Indexes required:

- `status ASC, topicId ASC, order ASC`
- `topicId ASC, order ASC`
- `status ASC, publishedAt DESC`

Security considerations:

- Active students can read published lesson metadata.
- Admin can read and manage all lesson records.
- Storage rules should allow active students to read PDFs for published lessons only.
- Future PDF viewer should render PDFs inline and avoid exposing a download button in UI.

Scalability considerations:

- PDF files stay in Storage; Firestore stores only metadata.
- If multiple PDFs per lesson become necessary later, add a `lessonFiles` collection instead of arrays that grow without bounds.

## `assignments`

Why it exists: Stores homework metadata and teacher instructions.

Document ID strategy: Firestore auto id.

Fields:

| Field             | Type          | Required | Notes                        |
| ----------------- | ------------- | -------- | ---------------------------- |
| `title`           | string        | yes      | Assignment title             |
| `description`     | string        | no       | Instructions                 |
| `topicId`         | string        | no       | Optional topic reference     |
| `lessonId`        | string        | no       | Optional lesson reference    |
| `dueAt`           | Timestamp     | yes      | Deadline                     |
| `attachmentPaths` | StoragePath[] | no       | Teacher-provided PDFs/images |
| `status`          | PublishStatus | yes      | Visibility                   |
| `createdBy`       | string        | yes      | Admin uid                    |
| `createdAt`       | Timestamp     | yes      | Server timestamp             |
| `updatedAt`       | Timestamp     | no       | Server timestamp             |

Relationships:

- May be linked from `lessons.homeworkAssignmentId`.
- Student submissions live in `assignmentSubmissions`.

Indexes required:

- `status ASC, dueAt ASC`
- `lessonId ASC`
- `topicId ASC, dueAt DESC`

Security considerations:

- Active students can read published assignments.
- Admin manages all assignments.
- Storage rules must prevent unauthenticated access to assignment files.

Scalability considerations:

- Add `assignedStudentIds` only if the teacher needs targeted homework later.

## `assignmentSubmissions`

Why it exists: Stores student homework submissions and teacher feedback.

Document ID strategy: Deterministic id `{assignmentId}_{studentId}`.

Fields:

| Field          | Type                                      | Required | Notes                    |
| -------------- | ----------------------------------------- | -------- | ------------------------ |
| `assignmentId` | string                                    | yes      | References assignment    |
| `studentId`    | string                                    | yes      | References student user  |
| `studentName`  | string                                    | yes      | Denormalized display     |
| `filePaths`    | StoragePath[]                             | yes      | Student PDFs/images      |
| `status`       | `"submitted" \| "reviewed" \| "returned"` | yes      | Review state             |
| `submittedAt`  | Timestamp                                 | yes      | Server timestamp         |
| `reviewedAt`   | Timestamp                                 | no       | Teacher review date      |
| `grade`        | string                                    | no       | Flexible mark/grade text |
| `feedback`     | string                                    | no       | Teacher comments         |

Relationships:

- One submission per student per assignment.

Indexes required:

- `assignmentId ASC, submittedAt DESC`
- `studentId ASC, submittedAt DESC`
- `status ASC, submittedAt DESC`

Security considerations:

- Students can create/read their own submissions.
- Students cannot write `grade`, `feedback`, or `reviewedAt`.
- Admin can read and review all submissions.

Scalability considerations:

- If resubmissions need history, create `assignmentSubmissionVersions`.

## `quizzes`

Why it exists: Stores optional quizzes that may be standalone or linked from lessons.

Document ID strategy: Firestore auto id.

Fields:

| Field              | Type          | Required | Notes                             |
| ------------------ | ------------- | -------- | --------------------------------- |
| `title`            | string        | yes      | Quiz title                        |
| `description`      | string        | no       | Student-facing summary            |
| `topicId`          | string        | no       | Optional topic reference          |
| `lessonId`         | string        | no       | Optional lesson reference         |
| `questions`        | map[]         | yes      | Embedded for Version 1 quiz sizes |
| `timeLimitMinutes` | number        | no       | Optional                          |
| `status`           | PublishStatus | yes      | Visibility                        |
| `createdBy`        | string        | yes      | Admin uid                         |
| `createdAt`        | Timestamp     | yes      | Server timestamp                  |
| `updatedAt`        | Timestamp     | no       | Server timestamp                  |

Question map shape:

| Field           | Type                                               | Notes                              |
| --------------- | -------------------------------------------------- | ---------------------------------- |
| `id`            | string                                             | Stable per quiz                    |
| `prompt`        | string                                             | Question text                      |
| `type`          | `"multipleChoice" \| "shortAnswer" \| "trueFalse"` | Answer type                        |
| `options`       | string[]                                           | Multiple-choice options            |
| `correctAnswer` | string or string[]                                 | Hidden from students until allowed |
| `marks`         | number                                             | Question marks                     |
| `explanation`   | string                                             | Post-submit explanation            |

Relationships:

- May be linked from `lessons.quizId`.
- Attempts live in `quizAttempts`.

Indexes required:

- `status ASC, createdAt DESC`
- `topicId ASC, status ASC`
- `lessonId ASC`

Security considerations:

- Students can read published quizzes.
- Correct answers should not be exposed before submission. If rules cannot enforce this safely, split answer keys into an admin-only collection.

Scalability considerations:

- Move questions to `quizQuestions` if quiz documents approach Firestore document size limits.

## `quizAttempts`

Why it exists: Stores student attempts, answers, and scores.

Document ID strategy: Firestore auto id.

Fields:

| Field         | Type                                      | Required | Notes                          |
| ------------- | ----------------------------------------- | -------- | ------------------------------ |
| `quizId`      | string                                    | yes      | References quiz                |
| `studentId`   | string                                    | yes      | References student user        |
| `studentName` | string                                    | yes      | Denormalized display           |
| `answers`     | map[]                                     | yes      | Student responses              |
| `score`       | number                                    | no       | Earned marks                   |
| `totalMarks`  | number                                    | yes      | Max marks                      |
| `status`      | `"inProgress" \| "submitted" \| "graded"` | yes      | Attempt lifecycle              |
| `startedAt`   | Timestamp                                 | yes      | Server timestamp               |
| `submittedAt` | Timestamp                                 | no       | Server timestamp               |
| `gradedAt`    | Timestamp                                 | no       | Server/admin grading timestamp |

Relationships:

- Many attempts can belong to one quiz.
- Many attempts can belong to one student.

Indexes required:

- `studentId ASC, submittedAt DESC`
- `quizId ASC, submittedAt DESC`
- `studentId ASC, quizId ASC, startedAt DESC`

Security considerations:

- Students can read/write only their own attempts.
- Scores should be written by trusted server code where possible.
- Admin can read all attempts.

Scalability considerations:

- Add `attemptNumber` if retry limits are introduced.

## `modelAnswers`

Why it exists: Primary revision feature. Stores searchable past-paper answers by exam metadata.

Document ID strategy: Deterministic id `{year}_{session}_{paper}_{questionNumber}`, normalized lowercase, for example `2024_may-june_1h_9`.

Fields:

| Field                        | Type               | Required | Notes                             |
| ---------------------------- | ------------------ | -------- | --------------------------------- |
| `year`                       | number             | yes      | Exam year                         |
| `session`                    | ExamSession        | yes      | `may-june` or `oct-nov`           |
| `paper`                      | string             | yes      | Example: `1H`, `2H`               |
| `questionNumber`             | string             | yes      | Supports `9`, `9a`, `12b`         |
| `topicId`                    | string             | no       | Optional; mainly Version 2 search |
| `title`                      | string             | yes      | Display title                     |
| `officialMarkSchemePath`     | StoragePath        | yes      | PDF/image path                    |
| `officialMarkSchemeType`     | `"pdf" \| "image"` | yes      | Viewer type                       |
| `teacherWrittenSolutionPath` | StoragePath        | yes      | PDF/image path                    |
| `teacherWrittenSolutionType` | `"pdf" \| "image"` | yes      | Viewer type                       |
| `relatedQuestionIds`         | string[]           | no       | Placeholder for related questions |
| `status`                     | PublishStatus      | yes      | Visibility                        |
| `createdBy`                  | string             | yes      | Admin uid                         |
| `createdAt`                  | Timestamp          | yes      | Server timestamp                  |
| `updatedAt`                  | Timestamp          | no       | Server timestamp                  |

Relationships:

- `bookmarks.resourceId` can reference `modelAnswers/{modelAnswerId}`.
- `recentActivity.resourceId` can reference `modelAnswers/{modelAnswerId}`.
- `topicId` is optional and not part of Version 1 primary search.

Indexes required:

- `status ASC, year DESC, session ASC, paper ASC, questionNumber ASC`
- `year DESC, session ASC, paper ASC, questionNumber ASC`
- `status ASC, paper ASC, questionNumber ASC`
- `topicId ASC, year DESC` for Version 2 topic search

Security considerations:

- Active students can read published model-answer metadata.
- Storage rules should allow viewing files only for active authenticated users.
- UI should render PDFs/images inline and not provide download buttons.
- Admin manages all model answers.

Scalability considerations:

- Deterministic ids prevent duplicate records for the same exam question.
- Add external search later only for topic/full-text search, not for Version 1 metadata search.

## `announcements`

Why it exists: Stores teacher announcements shown on dashboards.

Document ID strategy: Firestore auto id.

Fields:

| Field         | Type                             | Required | Notes            |
| ------------- | -------------------------------- | -------- | ---------------- |
| `title`       | string                           | yes      | Heading          |
| `body`        | string                           | yes      | Message          |
| `audience`    | `"all" \| "students" \| "admin"` | yes      | Visibility       |
| `status`      | PublishStatus                    | yes      | Visibility       |
| `publishedAt` | Timestamp                        | no       | Display date     |
| `expiresAt`   | Timestamp                        | no       | Optional expiry  |
| `createdBy`   | string                           | yes      | Admin uid        |
| `createdAt`   | Timestamp                        | yes      | Server timestamp |
| `updatedAt`   | Timestamp                        | no       | Server timestamp |

Relationships:

- Dashboard reads latest published announcements.

Indexes required:

- `status ASC, audience ASC, publishedAt DESC`
- `expiresAt ASC`

Security considerations:

- Students read published announcements for student/all audiences.
- Admin manages all announcements.

Scalability considerations:

- Add targeted announcements only if needed later.

## `reports`

Why it exists: Stores manual teacher reports per student.

Document ID strategy: Deterministic id `{studentId}_{period}`, for example `abc123_2026-07`.

Fields:

| Field          | Type                     | Required | Notes                   |
| -------------- | ------------------------ | -------- | ----------------------- |
| `studentId`    | string                   | yes      | References student user |
| `studentName`  | string                   | yes      | Denormalized display    |
| `period`       | string                   | yes      | `YYYY-MM`               |
| `summary`      | string                   | yes      | Teacher-written report  |
| `strengths`    | string[]                 | no       | Optional bullets        |
| `improvements` | string[]                 | no       | Optional bullets        |
| `status`       | `"draft" \| "published"` | yes      | Student visibility      |
| `createdBy`    | string                   | yes      | Admin uid               |
| `createdAt`    | Timestamp                | yes      | Server timestamp        |
| `updatedAt`    | Timestamp                | no       | Server timestamp        |
| `publishedAt`  | Timestamp                | no       | Student visibility date |

Relationships:

- One report per student per period.

Indexes required:

- `studentId ASC, period DESC`
- `status ASC, publishedAt DESC`

Security considerations:

- Students can read only their own published reports.
- Admin can create and edit all reports.

Scalability considerations:

- Automatic analytics can be added later without changing manual report fields.

## `bookmarks`

Why it exists: Stores student-saved revision items, primarily model answers.

Document ID strategy: Deterministic id `{studentId}_{resourceType}_{resourceId}`.

Fields:

| Field          | Type            | Required | Notes                                      |
| -------------- | --------------- | -------- | ------------------------------------------ |
| `studentId`    | string          | yes      | References student user                    |
| `resourceType` | `"modelAnswer"` | yes      | Version 1 supports model answers           |
| `resourceId`   | string          | yes      | References `modelAnswers/{id}`             |
| `title`        | string          | yes      | Denormalized display                       |
| `meta`         | string          | no       | Example: `2024 · May/June · Paper 1H · Q9` |
| `createdAt`    | Timestamp       | yes      | Server timestamp                           |

Relationships:

- Primary target is `modelAnswers`.

Indexes required:

- `studentId ASC, createdAt DESC`
- `studentId ASC, resourceType ASC, createdAt DESC`

Security considerations:

- Students can read/write only their own bookmarks.
- Admin may read bookmarks only for support/reporting.

Scalability considerations:

- Deterministic ids prevent duplicate bookmarks.

## `recentActivity`

Why it exists: Stores a compact student activity timeline for recently viewed revision items and dashboard context.

Document ID strategy: Firestore auto id.

Fields:

| Field          | Type                                                              | Required | Notes                   |
| -------------- | ----------------------------------------------------------------- | -------- | ----------------------- |
| `studentId`    | string                                                            | yes      | References student user |
| `resourceType` | `"lesson" \| "modelAnswer" \| "assignment" \| "quiz" \| "report"` | yes      | Activity target         |
| `resourceId`   | string                                                            | yes      | Target document id      |
| `title`        | string                                                            | yes      | Denormalized display    |
| `meta`         | string                                                            | no       | Short display context   |
| `action`       | `"viewed" \| "started" \| "submitted" \| "completed"`             | yes      | Activity type           |
| `createdAt`    | Timestamp                                                         | yes      | Server timestamp        |

Relationships:

- Most important for model answers and lessons.

Indexes required:

- `studentId ASC, createdAt DESC`
- `studentId ASC, resourceType ASC, createdAt DESC`

Security considerations:

- Students can create/read only their own activity.
- Admin can read activity for reports if needed.

Scalability considerations:

- Use scheduled cleanup to keep only the latest N records per student.

## Security Rule Shape

```text
isSignedIn() = request.auth != null
isAdmin() = users/{request.auth.uid}.role == "admin" && active == true
isStudent() = users/{request.auth.uid}.role == "student" && active == true
isSelf(studentId) = request.auth.uid == studentId

Admin:
  manage users, topics, lessons, assignments, quizzes, model answers,
  announcements, submissions, attempts, reports.

Student:
  read published topics, lessons, assignments, quizzes, model answers,
  announcements, and own reports.
  create/read own submissions, attempts, bookmarks, and recent activity.
```

## Index Summary

| Collection              | Composite Index                                                     |
| ----------------------- | ------------------------------------------------------------------- |
| `users`                 | `role ASC, fullName ASC`                                            |
| `users`                 | `role ASC, active ASC, fullName ASC`                                |
| `topics`                | `status ASC, order ASC`                                             |
| `lessons`               | `status ASC, topicId ASC, order ASC`                                |
| `lessons`               | `status ASC, publishedAt DESC`                                      |
| `assignments`           | `status ASC, dueAt ASC`                                             |
| `assignments`           | `lessonId ASC`                                                      |
| `assignmentSubmissions` | `assignmentId ASC, submittedAt DESC`                                |
| `assignmentSubmissions` | `studentId ASC, submittedAt DESC`                                   |
| `quizzes`               | `status ASC, createdAt DESC`                                        |
| `quizzes`               | `lessonId ASC`                                                      |
| `quizAttempts`          | `studentId ASC, submittedAt DESC`                                   |
| `quizAttempts`          | `quizId ASC, submittedAt DESC`                                      |
| `modelAnswers`          | `status ASC, year DESC, session ASC, paper ASC, questionNumber ASC` |
| `modelAnswers`          | `year DESC, session ASC, paper ASC, questionNumber ASC`             |
| `announcements`         | `status ASC, audience ASC, publishedAt DESC`                        |
| `reports`               | `studentId ASC, period DESC`                                        |
| `bookmarks`             | `studentId ASC, createdAt DESC`                                     |
| `recentActivity`        | `studentId ASC, createdAt DESC`                                     |

## Lifecycle Notes

### Student Creation

1. Admin creates Firebase Auth user.
2. Server creates `users/{uid}` with `role: "student"`.
3. Server sends password setup email.
4. If profile creation or email sending fails, roll back Auth/profile.

### Lesson Publishing

1. Admin uploads lesson PDF and solved examples PDF to Firebase Storage.
2. Admin creates/updates `lessons/{lessonId}` metadata with Storage paths.
3. Published lessons become visible to students.
4. Future UI renders PDFs inline through PDF.js or equivalent.

### Model Answer Search

1. Student selects year, session, paper, and question number.
2. App queries `modelAnswers` by exact exam metadata.
3. Result displays official mark scheme and teacher written solution inline.
4. Student can bookmark the result.
5. Related questions area is reserved for future logic.

### Deletion

For account lifecycle deletion:

1. Delete Firebase Auth user.
2. Delete `users/{uid}`.
3. Keep or delete dependent student-owned records according to retention policy.

For content deletion:

- Prefer `status: "archived"` for lessons, assignments, quizzes, model answers, announcements, and reports.
- Hard-delete Storage files only when admin confirms permanent removal.
