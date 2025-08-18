# Supabase Database Migrations

This directory contains SQL scripts to set up and update your Supabase database schema.

## How to Apply a Migration

To get your database up to date with the latest application features, you need to run the migration scripts in your Supabase project.

**Instructions:**

1.  **Navigate to the SQL Editor:**
    *   Go to your project's dashboard on [supabase.com](https://supabase.com).
    *   In the left sidebar, click on the **SQL Editor** icon.

2.  **Run the Migration Script:**
    *   Click on **"+ New query"**.
    *   Open the latest migration file from this directory (e.g., `001_init_teams_and_rls.sql`).
    *   Copy the **entire content** of the file.
    *   Paste the content into the Supabase SQL Editor.
    *   Click the **"Run"** button.

You should see a "Success. No rows returned" message. Your database is now up to date!
