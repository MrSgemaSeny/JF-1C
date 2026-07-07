# Backend Core Business Logic

The Core module encapsulates the primary business domain of Zhan Finance. It handles data persistence, complex entity relationships, and operational endpoints.

## Task Management Domain (Kanban)
- **Task Entity:** The central entity of the system. Tasks have priorities, deadlines, statuses, and are linked to both a Client and an assigned Employee.
- **Subtasks & Comments:** A Task can be broken down into multiple `Subtask` entities. The `TaskComment` entity allows continuous communication between clients and employees directly inside the task context.
- **Batch Updates:** The `TaskController` exposes endpoints specifically designed for Kanban operations, such as mass-updating task statuses or reordering priorities.

## CRM Domain (Clients & Services)
- **Client Profiles:** The `ClientProfile` entity extends the base `User` entity with business-specific data (IIN/BIN, legal address, company structure).
- **Service Catalog:** The `ServiceEntity` represents an offering (e.g., "Tax Audit", "LLC Registration"). These are managed by Admins and exposed to the public landing page via the `ServiceController`.
- **Invoices:** Generates and tracks financial documents related to completed tasks.

## Notifications & File Storage
- **Event-Driven Notifications:** The system uses Spring asynchronous events to trigger notifications. For example, when a Task reaches the `DONE` status, an email notification is automatically queued for the client.
- **Storage Service:** Interfaces for handling file uploads (e.g., legal documents attached to tasks). The architecture supports swapping between local storage and cloud storage (AWS S3) without modifying the core business logic.

Back to index: [[Index]]
