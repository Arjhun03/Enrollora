# Enrollora — Student Course Enrollment Platform

Enrollora is a full-stack student and course management application. Students can register, browse and enroll in courses, request enrollment cancellations, and submit course ratings and comments. Administrators can review students, manage courses and enrollments, process cancellation requests, view feedback, and monitor dashboard metrics.

## Contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Run the application](#run-the-application)
- [Database and migrations](#database-and-migrations)
- [Authentication and roles](#authentication-and-roles)
- [Frontend pages](#frontend-pages)
- [API reference](#api-reference)
- [Feedback workflow](#feedback-workflow)
- [Pagination and filtering](#pagination-and-filtering)
- [Business rules](#business-rules)
- [Troubleshooting](#troubleshooting)
- [Security notes](#security-notes)

## Features

### Student

- Register an account and wait for administrator approval.
- Sign in after approval and manage a student profile.
- Browse active courses and course availability.
- Enroll in courses and review personal enrollments.
- Submit course feedback with a 1–5 rating and comment for courses with an enrollment.
- Request cancellation of an enrollment and track its review status.

### Administrator

- Review, approve, reject, update, and manage student accounts.
- Create, update, list, and deactivate courses.
- View enrollments by student, course, or across the system.
- Approve or reject cancellation requests.
- Review paginated student course feedback, including course, student, rating, comment, and submission date.
- View dashboard summary metrics.

## Technology stack

| Area | Technology |
|---|---|
| Backend | ASP.NET Core Web API, .NET 10 |
| Persistence | Entity Framework Core 10, SQL Server |
| Authentication | JWT Bearer tokens |
| Frontend | Angular 22, TypeScript, Bootstrap 5 |
| API documentation | Swagger / OpenAPI |

## Repository layout

The backend and frontend are sibling projects in the Enrollora repository:

```text
Enrollora/
├── Enrollora_Backend/
│   └── Enrollora/
│       ├── Enrollora.sln
│       ├── README.md                 # This file
│       └── src/Enrollora.Api/
│           ├── Controllers/          # HTTP endpoints and authorization
│           ├── Data/                 # EF Core context and seeding
│           ├── DTOs/                 # API request/response contracts
│           ├── Migrations/           # Database schema history
│           ├── Middleware/           # Global API error handling
│           ├── Models/               # EF Core entities
│           ├── Repositories/         # Data access abstractions
│           └── Services/             # Business logic
└── enrollora-ui/
    └── src/app/
        ├── core/                     # Authentication, guards, interceptors
        ├── features/                 # Student, admin, enrollment, feedback pages
        ├── layouts/                  # Student and administrator navigation
        └── app.routes.ts
```

## Prerequisites

- .NET 10 SDK
- SQL Server (LocalDB, Express, Developer, or another supported SQL Server instance)
- Node.js and npm compatible with the installed Angular CLI
- Git (optional)

## Configuration

### Backend database and JWT

Edit `Enrollora_Backend/Enrollora/src/Enrollora.Api/appsettings.json`, or use user-secrets/environment variables for local secrets. Set `ConnectionStrings:DefaultConnection` to your SQL Server. For example:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=EnrolloraDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
  },
  "Jwt": {
    "Key": "replace-with-a-long-random-secret-key",
    "Issuer": "Enrollora.Api",
    "Audience": "Enrollora.Angular",
    "ExpiryMinutes": 120
  }
}
```

The sample configuration also contains a `SeedAdmin` section. The configured administrator account is seeded when the backend starts. Use the credentials in your local configuration; change the sample password before use outside a local development environment.

### Frontend API URL

The development API base URL is configured in `enrollora-ui/src/environments/environment.ts`:

```ts
apiUrl: 'https://localhost:52546/api'
```

Change it to the HTTPS URL/port printed by the backend if your API uses another address. The backend CORS policy currently allows `http://localhost:4200`.

## Run the application

Run these commands from the repository root (`Enrollora/`).

### 1. Start SQL Server

Start your local SQL Server instance and ensure the configured connection string is reachable.

### 2. Apply database migrations

From `Enrollora/`:

```bash
dotnet tool install --global dotnet-ef
dotnet ef database update \
  --project Enrollora_Backend/Enrollora/src/Enrollora.Api/Enrollora.Api.csproj
```

If `dotnet-ef` is already installed, skip the install command. The project file must be supplied with `--project` when the current directory is not `src/Enrollora.Api`.

Alternatively:

```bash
cd Enrollora_Backend/Enrollora/src/Enrollora.Api
dotnet ef database update
```

### 3. Start the backend

In a terminal from `Enrollora/`:

```bash
dotnet restore Enrollora_Backend/Enrollora/Enrollora.sln
dotnet run --project Enrollora_Backend/Enrollora/src/Enrollora.Api/Enrollora.Api.csproj
```

In Development, Swagger is available at the API URL followed by `/swagger` (for example, `https://localhost:52546/swagger`). Use the actual address printed at startup.

### 4. Start the Angular frontend

In a second terminal from `Enrollora/`:

```bash
cd enrollora-ui
npm install
npm start
```

Open `http://localhost:4200`. The student feedback page is available at `/student/feedback`; administrators can review feedback at `/admin/feedback`.

## Database and migrations

The EF Core context is `ApplicationDbContext`. The configured database is `EnrolloraDb` by default. The migration history is under `Enrollora_Backend/Enrollora/src/Enrollora.Api/Migrations`.

After pulling schema changes, apply migrations before submitting feedback or using new database-backed functionality:

```bash
dotnet ef database update --project Enrollora_Backend/Enrollora/src/Enrollora.Api/Enrollora.Api.csproj
```

To add a migration after changing EF entities or the context:

```bash
dotnet ef migrations add MigrationName \
  --project Enrollora_Backend/Enrollora/src/Enrollora.Api/Enrollora.Api.csproj
```

Then apply it with `dotnet ef database update` and the same `--project` path. Do not edit an already-applied migration in a shared or deployed database; create a new migration instead.

## Authentication and roles

`POST /api/auth/login` returns a JWT access token. Send it on protected requests as:

```http
Authorization: Bearer <token>
```

In Swagger, click **Authorize** and enter `Bearer <token>`. The token contains the user ID, name, email, and role. Student-specific operations derive the student ID from the authenticated token instead of trusting a client-provided ID.

New students register with `Pending` status and cannot log in until an administrator approves them. Administrator endpoints require the `Administrator` role; student operations require `Student`.

### Register a student

`POST /api/auth/register`

```json
{
  "name": "Arun Kumar",
  "email": "arun@example.com",
  "password": "Student@123",
  "department": "Computer Science",
  "age": 21,
  "cgpa": 8.4
}
```

### Log in

`POST /api/auth/login`

```json
{
  "email": "arun@example.com",
  "password": "Student@123"
}
```

Use the administrator email/password from `SeedAdmin` for administrator login.

## Frontend pages

| Role | URL | Page |
|---|---|---|
| Student | `/student/dashboard` | Student dashboard |
| Student | `/student/courses` | Browse and enroll in available courses |
| Student | `/student/enrollments` | View own enrollments and request cancellation |
| Student | `/student/cancellation-requests` | Track cancellation requests |
| Student | `/student/feedback` | Submit course rating and comment |
| Administrator | `/admin/dashboard` | Summary metrics |
| Administrator | `/admin/students` | Manage and review students |
| Administrator | `/admin/courses` | Manage courses |
| Administrator | `/admin/enrollments` | Browse enrollments |
| Administrator | `/admin/cancellation-requests` | Review cancellation requests |
| Administrator | `/admin/feedback` | Review submitted feedback |

## API reference

All routes below are relative to `/api`. Protected endpoints require a bearer token. `Admin` means the `Administrator` role.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a student; account starts pending |
| POST | `/auth/login` | Public | Sign in as an approved student or administrator |
| GET | `/students` | Admin | Search and page through students |
| GET | `/students/{id}` | Admin | Get a student |
| GET | `/students/me` | Student | Get own profile |
| PUT | `/students/me` | Student | Update own profile |
| PUT | `/students/{id}` | Admin | Update a student |
| PUT | `/students/{id}/approve` | Admin | Approve a pending student |
| PUT | `/students/{id}/reject` | Admin | Reject a pending student |
| DELETE | `/students/{id}` | Admin | Delete a student when allowed by history rules |
| GET | `/courses` | Admin, Student | Search and page through courses |
| GET | `/courses/{id}` | Admin, Student | Get course details |
| POST | `/courses` | Admin | Create a course |
| PUT | `/courses/{id}` | Admin | Update a course |
| DELETE | `/courses/{id}` | Admin | Deactivate a course |
| POST | `/courses/feedback` | Student | Submit course feedback |
| GET | `/courses/feedback` | Admin | List feedback; optional `courseId` filter |
| GET | `/enrollments` | Admin | List all enrollments |
| GET | `/enrollments/my` | Student | List own enrollments |
| GET | `/enrollments/student/{studentId}` | Admin | List enrollments for a student |
| GET | `/enrollments/course/{courseId}` | Admin | List enrollments for a course |
| POST | `/enrollments` | Student | Enroll in a course |
| POST | `/enrollments/{enrollmentId}/cancellation-request` | Student | Request enrollment cancellation |
| GET | `/cancellation-requests` | Admin | List cancellation requests |
| GET | `/cancellation-requests/my` | Student | List own cancellation requests |
| PUT | `/cancellation-requests/{id}/approve` | Admin | Approve cancellation request |
| PUT | `/cancellation-requests/{id}/reject` | Admin | Reject cancellation request |
| GET | `/dashboard/summary` | Admin | Get dashboard KPIs |

### Feedback submission example

`POST /api/courses/feedback` (Student role):

```json
{
  "courseId": 1,
  "rating": 5,
  "comment": "The lessons were clear and the projects were useful."
}
```

The response includes feedback ID, course, student, rating, comment, and submission time. The server takes the student identity from the JWT. Students can submit feedback only for a course in which they have an enrollment. Ratings must be 1 through 5 and comments are limited to 2,000 characters.

`GET /api/courses/feedback?pageNumber=1&pageSize=10&courseId=1` is restricted to administrators. The `courseId` filter is optional.

## Pagination and filtering

Paged endpoints return this shape:

```json
{
  "items": [],
  "pageNumber": 1,
  "pageSize": 10,
  "totalRecords": 0,
  "totalPages": 0
}
```

Page numbers are normalized to at least 1; page size is limited to 1–100.

### Courses

```http
GET /api/courses?search=dotnet&isActive=true&availability=available&minFees=1000&maxFees=50000&minCapacity=10&maxCapacity=100&sortBy=fees&sortOrder=asc&pageNumber=1&pageSize=10
```

Filters: `search`, `isActive`, `availability` (`available` or `full`), `minFees`, `maxFees`, `minCapacity`, `maxCapacity`. Sort fields: `name`, `fees`, `duration`, `capacity`.

### Students

```http
GET /api/students?search=arun&status=Pending&department=Computer%20Science&minAge=18&maxAge=25&minCgpa=7&maxCgpa=10&sortBy=cgpa&sortOrder=desc&pageNumber=1&pageSize=10
```

Filters include search, status, department, age, and CGPA ranges. Sort fields include name, age, CGPA, and registration date.

### Enrollments and cancellation requests

Enrollment lists accept `search`, `courseId`, `status`, `fromDate`, `toDate`, `sortBy`, `sortOrder`, and pagination fields. Cancellation request lists accept search, course, status, date range, sort order, and pagination fields. Enum values may be passed by name, for example `Pending`, `Approved`, `Rejected`, `Active`, and `Cancelled`.

## Business rules

- Only approved students can sign in and enroll.
- Only active courses accept new enrollments.
- Duplicate active enrollment in the same course is blocked.
- Capacity is checked during enrollment using a serializable SQL transaction.
- Students cannot directly cancel or delete an enrollment; they submit a cancellation request.
- At most one pending cancellation request is allowed per enrollment.
- Approving a cancellation marks the enrollment cancelled and frees a seat; rejection keeps it active.
- Course deletion is implemented as deactivation to preserve historical records.
- A student with enrollment history cannot be hard-deleted.
- Course feedback is restricted to enrolled students and is visible through the administrator endpoint/UI.

## Troubleshooting

### `No project was found` from `dotnet ef`

Run the command from the API project directory or provide the project path:

```bash
dotnet ef database update --project Enrollora_Backend/Enrollora/src/Enrollora.Api/Enrollora.Api.csproj
```

### Pending model changes warning

This means the EF model and migration snapshot differ. Make sure the source includes the feedback migration and matching model snapshot, then build and retry the update command. Do not suppress this warning to work around an incomplete migration.

### Feedback form reports that submission failed

Confirm that the API is running at the URL in `environment.ts`, the browser has a valid Student bearer token, the student is enrolled in the selected course, and migrations were applied to the same database used by the API. Inspect the browser Network response and backend logs for the exact error.

### SQL Server connection errors

Ensure SQL Server is running and `DefaultConnection` has the correct server, port, credentials, and database settings. `TrustServerCertificate=True` is commonly needed for local development certificates.

## Security notes

- Replace development credentials and the sample JWT signing key before deployment.
- Prefer environment variables, .NET user-secrets, or a managed secret store over committing credentials.
- Use HTTPS and restrict CORS to trusted frontend origins.
- Passwords are stored as password hashes and are never included in API responses.
- Authorization is enforced by role on API endpoints; frontend route guards are for navigation and do not replace server-side authorization.
- Configure production logging, database backups, and monitoring before deployment.
