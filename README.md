# 🍽️ Mess Master

![Mess Master Banner](https://img.shields.io/badge/Mess%20Master-Premium%20Management-7c3aed?style=for-the-badge&logo=appwrite&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

> **The Ultimate Solution for Hostel & Bachelor Mess Management.**
> Streamline your daily meals, finances, and member management with a modern, glassmorphic interface and robust accounting logic.

---

## 🌟 Overview

**Mess Master** is a comprehensive full-stack web application designed to solve the chaotic accounting problems of bachelor messes and hostels. It replaces manual notebooks and spreadsheets with a smart, automated system that handles everything from daily meal counts to complex cost splitting.

Built with **Next.js 16** and **Supabase**, it offers real-time updates, secure role-based access, and professional PDF reporting with full **Bengali language support**.

---

## 🚀 Key Features

### 👥 Advanced Member Management
*   **Role-Based Access Control (RBAC)**: Distinct roles for **Managers** and **Members**.
*   **Granular Permissions**: Delegate specific powers (e.g., `can_manage_meals`, `can_manage_finance`) to trusted members.
*   **Single Membership Policy**: Enforced constraints ensure a user belongs to only one mess at a time.
*   **Seamless Onboarding**: Add members via email or unique Mess Codes.

### 🍛 Smart Meal Management
*   **Daily & Bulk Entry**: Log meals for one or all members instantly.
*   **Auto-Calculation**: Real-time updates of Total Meals and dynamic **Meal Rate** calculation.
*   **Historical Data**: View detailed daily logs grouped by date.

### 💰 Robust Finance Tracking
*   **Multi-Category Expenses**:
    *   **Meal Costs**: Record daily shopping with multiple shoppers (supports "Shared Shoppers").
    *   **Shared Costs**: Split utility bills (WiFi, Gas) among specific members automatically.
    *   **Individual Costs**: Track personal debts or individual fines.
*   **Transparent Accounting**:
    *   **Mess Balance**: `Total Deposits - Total Expenses`.
    *   **Member Balance**: Calculated dynamically based on deposits, meal consumption, and shared costs.
*   **Audit Trails**: Every transaction records who added it and who is responsible.

### 📊 Professional Reporting
*   **PDF Generation**: Download detailed monthly reports.
*   **Bengali Support**: Native support for Bengali text in reports (using embedded `Noto Sans Bengali`) and UI.
*   **Watermarking**: Official branding on all generated documents.

### 🔔 Notifications & System Health
*   **Cascading Cleanup**: Deleting a month or mess automatically cleans up related notifications and data.
*   **Real-time Alerts**: Notifications for new deposits, expenses, and role changes.
*   **Account Control**: Users can permanently delete their accounts with safe data anonymization.

---

## 🛠️ Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 16** | App Router, Server Actions, React 19 |
| **Styling** | **Tailwind CSS** | Custom Glassmorphism, Responsive Design |
| **Components** | **Shadcn UI** | Radix UI Primitives, Lucide Icons |
| **Backend** | **Supabase** | PostgreSQL, Auth, Realtime, RLS |
| **Language** | **TypeScript** | Strict type safety throughout |
| **PDF** | **jsPDF** | Client-side report generation with AutoTable |
| **State** | **Server Actions** | Mutation and data fetching without API routes |

---

## 📸 Interface

The application features a "Modern & Premium" aesthetic utilizing:
*   **Glassmorphism**: `.glass`, `.glass-card` utilities.
*   **Vibrant Palette**: Violet/Purple primary theme (`hsl(262 83% 58%)`).
*   **Responsive Grid**: Optimized for Mobile, Tablet, and Desktop screens.

---

## ⚡ Getting Started

### Prerequisites
*   Node.js 18+
*   Supabase Project

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/mess-master.git
cd mess-master
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# Required for "Delete Account" functionality
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Database Setup
Run the SQL scripts in your Supabase SQL Editor in the following order to set up the schema, triggers, and Row Level Security (RLS).

1.  **Schema Initialization**: Copy content from `supabase/full_reset_schema.sql`.
2.  **Patches & Fixes** (If migrating):
    *   `supabase/fix_db.sql` (Schema corrections)
    *   `supabase/fix_db_v2.sql` (Unique constraints)
    *   `supabase/fix_db_v3.sql` (Duplicate cleanup)
    *   `supabase/fix_db_v4.sql` (Notification cascading)
    *   `supabase/fix_db_v5.sql` (Account deletion cascading)

*Note: The `full_reset_schema.sql` should ideally contain the final state, but the versioned scripts document the evolution of constraints.*

### 5. Run the Application
```bash
npm run dev
```
Visit `http://localhost:3000` to start managing your mess!

---

## 🛡️ Security & Permissions

*   **Row Level Security (RLS)**: Strictly enforced. Users can only access data belonging to their own mess.
*   **Secure Actions**: Server Actions validate user sessions and permissions before any mutation.
*   **Data Integrity**: Foreign keys with `ON DELETE CASCADE` and `SET NULL` ensure database consistency when users or messes are removed.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by <strong>Jules</strong>
</p>
