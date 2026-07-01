# Manajemen Bank Soal & Pengacakan Ujian (Question Bank & Randomization)

## Overview
Currently, `Question`s are strictly bound to a single `Exam` (`examId`). This prevents question reusability. Additionally, questions and options are presented in a fixed order, making it easier for students to cheat. 
This design introduces a central Question Bank by decoupling `Question` from `Exam` and introduces a deterministic randomization mechanism for exams.

## Architecture & Database Changes
1. **New Entities**:
   - `Subject` (e.g., Mathematics, Physics)
   - `Topic` (e.g., Algebra, Kinematics) - belongs to a Subject.
2. **Question Model Updates**:
   - Remove `examId` and `order`.
   - Add optional relations to `Topic`.
   - Add `difficulty` enum (`EASY`, `MEDIUM`, `HARD`).
3. **Many-to-Many Relationship**:
   - Introduce `ExamQuestion` junction model with `examId`, `questionId`, and `order`.
4. **Exam Model Updates**:
   - Add `randomizeQuestions` (Boolean, default: false).
   - Add `randomizeOptions` (Boolean, default: false).

## Data Flow & Randomization
- When a student fetches their exam questions, the server checks `randomizeQuestions` and `randomizeOptions`.
- If true, the server uses a **Seeded PRNG (Pseudo-Random Number Generator)**.
- **Seed Formula**: `hash(userId + examId)`.
- This ensures that Student A gets a uniquely shuffled version compared to Student B, but if Student A refreshes their page, the seed remains the same and they get the exact same order again.

## UI Components
- **Admin - Question Bank**: A dedicated page (`/admin/questions`) to view all questions across the system, filter by topic/difficulty, and create standalone questions.
- **Admin - Exam Form**: Toggles for Randomization. A modal/dialog to "Pick Questions from Bank" and attach them to the exam.
- **Student Exam Session**: Renders the fetched questions. Since randomization happens on the backend, the frontend requires minimal changes (mostly adapting to the new `ExamQuestion` data structure).

## Trade-offs & Considerations
- **Data Migration**: Existing questions with `examId` need to be migrated to the `ExamQuestion` table. 
- **Performance**: Shuffling on the backend per student is slightly more compute-intensive, but a simple seeded PRNG is extremely fast and negligible.
- **Grading**: The `Answer` model stores `questionId` and `optionId`, so the fact that they were displayed in a different order does not affect grading accuracy at all.
