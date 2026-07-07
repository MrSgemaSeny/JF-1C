# Zhan Finance Architectural Overview

Welcome to the central knowledge base of the Zhan Finance platform. This document serves as the primary entry point for understanding the entire system architecture, which is divided into independent but highly integrated functional modules.

## System Purpose
Zhan Finance is a comprehensive B2B/B2C platform designed to streamline legal and accounting services. It provides a public catalog for prospective clients, a seamless conversion pipeline to turn prospects into registered users, and a robust internal Kanban-based task management system for employees.

## Technology Stack
- **Frontend Framework:** React 18, Vite, TypeScript.
- **Frontend State Management:** TanStack Query (React Query) for server state caching and synchronization.
- **Backend Framework:** Spring Boot 3.x, Java 17, Spring Security.
- **Primary Database:** PostgreSQL (managed by Flyway migrations).
- **Caching & Sessions:** Redis (specifically used for JWT Refresh Tokens and rate limiting).
- **Deployment & Infrastructure:** Dockerized environments hosted on Fly.io (Backend) and GitHub Pages (Frontend).

## Core Modules

### Client Interface (Frontend)
- [[Frontend_Landing]] - Detailed documentation of the public-facing landing page, hero section, and the service catalog. Covers the seamless conversion funnel logic.
- [[Frontend_Auth]] - Documentation regarding the authentication UI, including standard email login, Google OAuth integration, complex registration flows, and route protection.
- [[Frontend_Dashboard]] - Comprehensive overview of the authorized workspaces. This includes the client profile management zone and the administrative Kanban board for employees.

### Server Logic (Backend)
- [[Backend_Core]] - The heart of the business logic. Documentation of the Task module (Kanban states, comments), CRM module (services, clients), notifications, and file storage.
- [[Backend_Auth]] - Security infrastructure documentation. Explains Spring Security configurations, JWT issuance and validation, Redis refresh tokens, and the global audit logging system.

## Project Management & Notes
- [[JF-1C_FULL_ANALYSIS_PLAN]] - The initial comprehensive audit and strategic plan.
- [[COURSES_FEATURE_PLAN]] - Blueprint for the upcoming educational courses module.
- [[daily_report]] - Running log of daily development progress and solved issues.
