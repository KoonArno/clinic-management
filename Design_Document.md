
---

# Design Document: Clinic Management System

This document outlines the architecture, key technical decisions, and implementation strategies for the Clinic Management System project based on the provided source files.

## 1. General Approach

The system is a full-stack monorepo built using **Next.js 16 (App Router)**, which serves both the frontend and backend.

### Frontend
* **Framework & Language:** **React 19** with **TypeScript**. Pages are implemented as Client Components (`"use client"`) within the `src/app/dashboard/` directory.
* **Styling:** **Tailwind CSS v4**.
* **Authentication State:** Client-side session management is handled by `next-auth/react` using the `SessionProvider` and the `useSession` hook.
* **Type Definitions:** Custom types for `next-auth` (e.g., adding `role` and `fullName` to the session) are defined in `src/types/next-auth.d.ts`.

### Backend
* **Framework:** **Next.js API Routes** (Route Handlers) implemented in TypeScript within the `src/app/api/` directory.
* **Database & ORM:** **Prisma (v6.19)** is used as the ORM to interact with a **MySQL/MariaDB** database. A global Prisma client instance is managed in `src/lib/prisma.ts`.
* **Database Schema:** The schema is defined in `prisma/schema.prisma` and includes three primary models: `User`, `Patient`, and `Appointment`. It also defines `Role` and `AppointmentStatus` enums.
* **Authentication:** **NextAuth.js (v4)** provides the core authentication logic.
    * **Provider:** Uses the `CredentialsProvider` for username/password login.
    * **Password Hashing:** `bcryptjs` is used to compare passwords during authorization.
    * **Session Strategy:** Uses **JWT** (`strategy: "jwt"`) to manage sessions. The JWT `token` is augmented with `id`, `role`, and `fullName` in the `jwt` callback, which is then passed to the `session` callback.

## 2. Data Deletion / Archiving

The current implementation uses a **Hard Deletion** strategy, protected by database-level referential integrity.

* **Mechanism:** The patient delete handler (`DELETE /api/patients/[recordNumber]`) calls `prisma.patient.delete()` directly/route.ts`].
* **Integrity:** The database migration file (`...init_database/migration.sql`) specifies that the foreign key constraint `appointments_patientId_fkey` uses `ON DELETE RESTRICT`.
* **Outcome:** This **prevents** a `Patient` from being deleted if they still have associated `Appointment` records. The API catches the resulting Prisma error (code `P2025`) and returns a `404` status, effectively (though not explicitly) blocking the deletion due to existing references/route.ts`].
* **Note:** No soft deletion (archiving) mechanism (e.g., an `isArchived` flag) is currently implemented.

## 3. Appointment Conflict Prevention

Conflict prevention is handled **entirely on the backend** within the API route handlers to ensure data integrity.

* **On Create (`POST /api/appointments`):**
    1.  Before creating a new appointment, the API performs a conflict check query.
    2.  It searches for any existing appointments for the *same* `doctorId` that overlap with the new time slot.
    3.  The logic used is: `startTime < newEndTime` AND `endTime > newStartTime`.
    4.  If a `conflict` is found, the API returns a `409 Conflict` status and aborts the creation.

* **On Update (`PUT /api/appointments/[recordNumber]`):**
    1.  The same overlap logic is applied if the `startTime`, `endTime`, or `doctorId` is being changed/route.ts`].
    2.  A crucial addition is `recordNumber: { not: recordNumber }` in the `where` clause. This ensures that the appointment being updated does not conflict *with itself*, allowing updates to notes or status without failing the conflict check/route.ts`].

## 4. Record Number Generation

Record numbers (e.g., `PAT-001`, `APT-001`) are generated on the **backend** using a simple, non-concurrency-safe "query-then-insert" method.

* **Logic:** A helper function `generateRecordNumber` is present in both `api/patients/route.ts` and `api/appointments/route.ts`.
* **Steps:**
    1.  It queries the database for the latest record by `id` descending: `prisma.patient.findFirst({ orderBy: { id: 'desc' } })`.
    2.  It takes the `id` of this record (or 0 if none exists) and increments it by 1: `(latestPatient?.id || 0) + 1`.
    3.  It formats this new ID into a string with padding: `PAT-${String(nextId).padStart(3, '0')}`.
* **Note:** This logic is susceptible to a **race condition** if two users attempt to create a new record simultaneously (see Section 8).

## 5. Frontend Conflict Detection

**This is not currently implemented.**

* The frontend (e.g., `src/app/dashboard/appointments/create/page.tsx`) adopts a "submit and wait for error" approach.
* The `handleSubmit` function collects all data and sends it to the API. It only learns of a conflict if the `fetch` call fails (e.g., receives a 409 status), at which point it displays the error message from the server.
* There is no pre-emptive check (e.g., fetching a clinician's schedule for the selected day) to disable conflicting time slots in the UI.

## 6. Authorization Enforcement

Authorization is enforced at two distinct layers, following a "defense in depth" model.

1.  **Middleware Layer (Authentication):**
    * The `src/middleware.ts` file uses `withAuth` from `next-auth/middleware`.
    * Its `matcher` protects all application routes (`/((?!api|auth|...`).
    * The `authorized` callback checks `!!token`. If a user is not logged in (no token), they are redirected to the `/auth/login` page. This handles *Authentication* (are you logged in?)..

2.  **API Route Layer (Authorization):**
    * This handles *Authorization* (do you have permission?).
    * A custom `authorize` function in `src/lib/auth.ts` is used by *every* protected API route.
    * Each route defines an `allowedRoles: Role[]` array (e.g., `[Role.reception, Role.admin]`).
    * The `authorize` function calls `getServerSession(authOptions)` to get the user's session from their JWT on the server.
    * It checks if the user's `session.user.role` is included in the `allowedRoles` array.
    * If not authorized, the API route immediately returns a `401` or `403` response.
    * **Finer-grained control** is also implemented. For example, a `clinician` can only `GET` an appointment if their `auth.userId` matches the `appointment.doctor.id`/route.ts`].

## 7. Validation Strategy

Validation is performed on both the client and server, with the server acting as the single source of truth.

* **Client-Side (Frontend):**
    * **Purpose:** Provide immediate user feedback (UX).
    * **Implementation:** Basic presence checks within `handleSubmit` functions (e.g., `if(!username || !password)`).
    * Password confirmation check (`if(password !== confirmPassword)`).

* **Server-Side (Backend):**
    * **Purpose:** Enforce data integrity and security.
    * **1. Presence Validation:** API routes re-validate that all required fields are present (e.g., `if (!firstName || !lastName ...)`). This is the authoritative check..
    * **2. Relational Validation:** The API checks that foreign keys are valid. For example, when creating an appointment, it verifies that the `patientId` exists and that the `doctorId` exists *and* has the `Role.clinician`.
    * **3. Business Logic Validation:** The API enforces domain rules.
        * Example 1: `endTime` must be after `startTime`.
        * Example 2: Appointment conflict checking (see Section 3).
    * **4. Type Validation:** TypeScript and Prisma enums (`Role`, `AppointmentStatus`) are used throughout the API routes to ensure data types are correct *before* hitting the database.

## 8. Trade-offs and Shortcuts

Several shortcuts were taken during implementation, which could be improved with more time.

* **Shortcut 1: Record Number Generation Race Condition**
    * **The Trade-off:** The `(latest.id || 0) + 1` logic is simple to implement but is not concurrency-safe. If two users create a patient at the exact same time, they might both query and get the same `latest.id`, leading to a "Unique constraint failed" error when the second user tries to save the duplicate `recordNumber`.
    * **Improvement:** The correct, race-condition-safe method is to let the database handle the unique ID.
        1.  Remove the `generateRecordNumber` function.
        2.  When creating a patient, *only* save the `firstName`, `lastName`, etc., and let the `id` auto-increment.
        3.  After the `newPatient` is created, use its `newPatient.id` (which is guaranteed to be unique) to create the `recordNumber`.
        4.  `UPDATE` the new record with its formatted `recordNumber`: `PAT-${String(newPatient.id).padStart(3, '0')}`. This ensures atomicity and uniqueness.

* **Shortcut 2: "Submit and Wait" Conflict Detection**
    * **The Trade-off:** The frontend does not pre-check for appointment conflicts, leading to a poor User Experience. A receptionist could fill out the entire form, only to be told the slot is taken after clicking "Submit"..
    * **Improvement:** When a user selects a `Clinician` and a `Date` on the create appointment form, the frontend should trigger an API call (`GET /api/clinicians/[id]/schedule?date=...`). This API would return all existing appointments for that day. The frontend could then use this data to visually disable unavailable time slots in the `<input type="time">` picker or show a visual "taken" block on a calendar view.

* **Shortcut 3: Hard Deletion of Records**
    * **The Trade-off:** Using `ON DELETE RESTRICT` protects data integrity but provides a "dead end" for the user. A receptionist cannot delete a patient with a history, which might be a valid business requirement (e.g., patient moves away).
    * **Improvement:** Implement **Soft Deletion**.
        1.  Add an `isArchived` (Boolean) or `deletedAt` (DateTime) field to the `Patient` and `Appointment` models in `prisma/schema.prisma`.
        2.  Change the `DELETE` handler in `src/app/api/patients/[recordNumber]/route.ts` to an `UPDATE` handler that sets `isArchived = true`.
        3.  Update all `findMany` queries (e.g., in `GET /api/patients`) to include `where: { isArchived: false }` by default. This would hide "deleted" records from view while preserving them in the database for historical integrity.