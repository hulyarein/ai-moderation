# Supabase Database Schema Setup

This guide explains how to set up your Supabase database schema to work with the AI Moderation app.

## Posts Table

You need to create a 'posts' table with the following schema:

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your project
3. Go to "Table Editor"
4. Click "Create a new table"
5. Name the table: `posts`
6. Add the following columns:

| Name      | Type      | Default Value      | Primary | Is Nullable |
| --------- | --------- | ------------------ | ------- | ----------- |
| id        | uuid      | uuid_generate_v4() | Yes     | No          |
| file      | text      | -                  | No      | No          |
| type      | text      | -                  | No      | No          |
| reviewed  | boolean   | false              | No      | No          |
| userId    | uuid      | -                  | No      | Yes         |
| createdAt | timestamp | now()              | No      | No          |

7. Click "Save" to create the table

## Row-Level Security (RLS) Policies

To secure your data, set up the following Row-Level Security policies:

1. In your Supabase dashboard, go to "Authentication" → "Policies"
2. Find the 'posts' table and click "Add Policies"

### Policy for Reading Posts:

- Policy name: `Users can read their own posts`
- Policy definition: `(auth.uid() = userId)`
- Policy command: `SELECT`

### Policy for Creating Posts:

- Policy name: `Users can insert their own posts`
- Policy definition: `(auth.uid() = userId)`
- Policy command: `INSERT`

### Policy for Admins (create a separate policy):

- Policy name: `Admins can read all posts`
- Policy definition: `(auth.uid() IN (SELECT id FROM auth.users WHERE email LIKE '%@admin.com'))`
- Policy command: `ALL`

This setup will ensure that:

- Regular users can only see and create their own posts
- Admin users (with emails ending in @admin.com) can see, update, and delete all posts

Remember to enable Row-Level Security on the 'posts' table to activate these policies.
