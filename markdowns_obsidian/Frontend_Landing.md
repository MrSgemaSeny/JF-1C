# Frontend Landing Page & Public Catalog

The Landing module represents the public face of the Zhan Finance application. It is explicitly designed to maximize conversion rates and provide immediate value to unauthenticated guests.

## Primary Responsibilities

### 1. Hero and Value Proposition
The landing page immediately greets users with the company's value proposition. It utilizes highly optimized, fast-loading assets to ensure an excellent first impression. 

### 2. Services Catalog
The `ServicesCatalog` component dynamically fetches available legal and accounting services from the backend. Guests can filter, search, and view detailed information about each service via the `ServiceModal`.

### 3. The Seamless Conversion Funnel
A critical feature of the landing page is the "Seamless Conversion Funnel".
- **Concept:** Unauthenticated users must not be blocked from interacting with the platform. If a guest clicks "Order" on a service, the application intercepts this action.
- **Execution:** Instead of showing a rigid "Please log in" error, the system stores the `serviceId` and the guest's intent inside the browser's `sessionStorage`.
- **Redirection:** The guest is seamlessly redirected to the registration/login flow. Once they successfully authenticate, the system reads the `sessionStorage` and automatically routes them to the final confirmation page, preserving their original intent.

## Key Components
- `LandingPage.tsx`: The main aggregator component.
- `ServicesCatalog.tsx`: Displays the grid of available services.
- `ServiceModal.tsx`: A detailed overlay showing service descriptions and pricing.

Back to index: [[Index]]
