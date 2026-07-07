# Frontend Dashboard (Client & Admin)

The Dashboard module is the authorized workspace where the actual business operations occur. It dynamically adapts its UI based on the user's role (Client vs. Employee/Admin).

## Client Workspace Overview
When a user logs in with the `CLIENT` role, they are routed to the Client Dashboard.
- **Profile Management:** Clients can update their company details, contact information, and preferences.
- **Active Requests:** Clients can view the real-time status of their ordered services (e.g., "In Progress", "Awaiting Review").
- **Communication:** Clients have access to a dedicated chat interface to communicate directly with the employees handling their specific tasks.

## Employee & Admin Workspace (Kanban)
Users with the `EMPLOYEE` or `ADMIN` role are routed to the internal task management system.
- **TasksBoard (Kanban):** The core component is a heavily interactive Kanban board. Tasks are grouped into columns representing their current status (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`, `CANCELLED`).
- **Drag and Drop Interface:** Built using modern drag-and-drop libraries, allowing employees to seamlessly transition tasks between states. Moving a card triggers a `TaskStatusUpdateRequest` to the backend.
- **Global Overview:** Admins have access to high-level statistics, including employee workload distribution, financial summaries, and system alerts.

## State Management Architecture
The dashboard heavily relies on **TanStack Query (React Query)**.
- Query keys are strictly structured to ensure cache invalidation works perfectly. For example, moving a Kanban card will invalidate the `['tasks', 'kanban']` query, instantly syncing the UI with the server state without requiring a full page reload.

Back to index: [[Index]]
