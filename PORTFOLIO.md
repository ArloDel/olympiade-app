# 🏆 OlymApp — Modern Academic Olympiad & Secure Online Examination Platform

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-blue?style=for-the-badge&logo=vercel)](https://olympiade-app-kappa.vercel.app/login)
[![Tech Stack](https://img.shields.io/badge/Next.js_16-React_19-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-PostgreSQL-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)

> **Live Application**: [https://olympiade-app-kappa.vercel.app/login](https://olympiade-app-kappa.vercel.app/login)

---

## 🌟 Executive Summary

**OlymApp** is an enterprise-grade, high-concurrency online examination and academic competition platform engineered with **Next.js 16 (Turbopack)**, **TypeScript**, **PostgreSQL (Supabase)**, and **Prisma ORM**. 

Engineered specifically to solve integrity vulnerabilities and proctoring bottlenecks in digital assessments, OlymApp features **Safe Exam Browser (SEB) verification**, **live proctoring with automated violation telemetry**, **real-time session lockouts**, and **LaTeX/KaTeX mathematical formula rendering**.

---

## 🔑 Demo Access Credentials

| Role | Username / Identifier | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **👑 Superadmin** | `superadmin@olym.app` | `password123` | Global system health, emergency mode, admin delegation, audit logs |
| **🛡️ Admin** | `admin@olym.app` | `password123` | Live exam proctoring, session lock/unlock, question bank, PDF/Excel export |
| **🎓 Student** | `student@olym.app` | `password123` | Exam runner, KaTeX formula support, anti-cheat state tracker, countdown timer |

---

## 📸 Visual Showcase & Architecture Walkthrough

### 1. 🔐 Centralized Authentication & Seamless Role Routing
The gateway dynamically parses role claims and routes users directly to their designated workspaces (**Superadmin Command**, **Admin Proctoring Room**, or **Student Assessment Hub**).

![Centralized Login Gateway](/public/portfolio/01_login_page.png)

---

### 2. ⚡ Real-Time Admin Command Center (Live Proctoring)
Proctors monitor active participants simultaneously with real-time infraction indicators (tab-switch triggers, unauthorized app detection). Admins can inspect activity timelines and remotely revoke/restore access with a single click.

![Admin Command Center](/public/portfolio/03_admin_command_center.png)

---

### 3. 📊 Instant Grading & Automated PDF / Excel Reports
Automated scoring calculates right, wrong, and blank responses instantly. Proctors can generate audit-ready PDF reports and spreadsheets for institutional compliance.

![Admin Results & Reporting](/public/portfolio/04_admin_results_export.png)

---

### 4. 🎓 Distraction-Free Student Exam Interface
Equipped with live countdown timers, anti-cheat visibility tracking, question grid navigators, and native KaTeX formatting for complex scientific and mathematical expressions.

![Student Workspace](/public/portfolio/05_student_dashboard.png)

---

### 5. 🛡️ Superadmin Control Center & Governance
Provides system diagnostics, database connection status, kill-switch maintenance toggles, and administrator access management.

![Superadmin Control Center](/public/portfolio/02_superadmin_dashboard.png)

---

## 🛠️ Technical Highlights & Engineering Decisions

- **Full-Stack Architecture**: Next.js 16 App Router with server-side rendered pages and dynamic API route handlers.
- **Strict Anti-Cheat Engine**: Integration with **Safe Exam Browser (SEB)** HTTP header hash verification and browser visibility state listeners.
- **Relational Data Modeling**: PostgreSQL database managed via Prisma ORM with connection pooling for high-concurrency exam starts.
- **Reactive Glassmorphism UI**: Custom Tailwind CSS 4 design system with unified Dark & Light mode synchronizers.
- **Complex Formula Support**: Integrated KaTeX rendering supporting multi-line equations and scientific notations.

---

## 💻 Tech Stack Overview

- **Frontend**: Next.js 16 (React 19), Tailwind CSS 4, Lucide Icons, KaTeX
- **Backend & APIs**: Next.js Server Components, Edge Middleware, NextAuth.js JWT
- **Database & Storage**: PostgreSQL (Supabase), Prisma ORM
- **Export Engines**: jsPDF, jspdf-autotable, XLSX
- **Deployment**: Vercel CI/CD Pipeline
