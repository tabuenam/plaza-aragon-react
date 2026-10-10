# Project Overview: Plaza Aragón Rental Management App

## 1. Context & Goal

I own a commercial building in Olanchito, Honduras, operating under the domain `plaza-aragon.com`. Currently, there are 2 rented commercial spaces (locales) and 3 more under construction. Leases run for 6-12 months.
We need a lightweight web application to solve two problems:

1. Provide a public-facing website on `plaza-aragon.com` to advertise available spaces.
2. Provide a private dashboard where tenants log in and upload their monthly bank transfer receipts directly, eliminating the current manual WhatsApp process and creating a clean historical record.

## 2. Tech Stack

* **Framework:** Next.js (React) using the App Router.
* **Styling:** Tailwind CSS. The UI must be **mobile-first and fully responsive**, as tenants will primarily access the app via their smartphones.
* **Backend/Database:** Supabase (PostgreSQL, Auth, Storage).
* **Deployment:** Vercel (Target environment, mapped to `plaza-aragon.com`).

## 3. Core Features & Scope

### A. Public Listings (Unauthenticated)

* A simple landing page showing the commercial spaces.
* Each space should have: Name/ID, Status (Available/Occupied), Price, Description, and a few photos.
* **Language:** The entire application (public site, tenant portal, and owner dashboard) must be strictly in Spanish.

### B. Tenant Portal (Authenticated)

* Tenants log in (email/password).
* View their current active lease details.
* **Self-Service Payment Submission:** Tenants submit their monthly rent payment by uploading the bank transfer screenshot directly into the system (stored in Supabase Storage) and selecting the payment month/year. The camera/upload flow must be heavily optimized for mobile devices.
* View past payment history and status (Pending/Approved).

### C. Owner Dashboard (Authenticated - Admin)

* Overview of all 5 spaces and their current occupancy.
* **Payment Verification:** View all uploaded transfer receipts for the current month.
* Mark a tenant's monthly payment as "Verified" or "Rejected".
* Basic historical ledger to see who paid what and when over the past year.

### D. Design & Aesthetics

* **Modern Honduran Look & Feel:** The styling should reflect a modern take on Honduran and Olanchito culture. It should balance a clean, professional web aesthetic with warm, local design elements, colors, or motifs that resonate with the region while remaining accessible and intuitive.
* **Cross-Device Fluidity:** All tables, dashboards, and image galleries must scale perfectly down to small mobile screens without horizontal scrolling issues.

## 4. Database Schema (Guideline)

*Keep it simple. Suggested core tables in Supabase:*

* `spaces`: id, name, description, price, status, image_url.
* `tenants`: id (maps to auth.users), name, contact_info.
* `leases`: id, space_id, tenant_id, start_date, end_date, active.
* `payments`: id, lease_id, amount, payment_date, period_month, period_year, receipt_image_url, status (pending/verified).

## 5. Strict Coding Guidelines

As the AI Tech Lead executing this project, you must strictly adhere to the following rules:

* **No Overengineering:** Keep the architecture simple, direct, and easy to read. Do not introduce unnecessary abstractions, complex state management libraries, or boilerplate.
* **Zero Comments:** Commenting the code or writing Javadoc is completely forbidden. The code must be self-explanatory. We will only document things and create a README when a feature is fully completed.
* **Open Exploration:** I am not providing an exact, step-by-step implementation plan. Explore the repository, leverage your capabilities, and implement the features logically based on the stack provided.