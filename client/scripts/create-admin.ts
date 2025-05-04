// This script creates an admin account in Supabase
// Run with: npx tsx scripts/create-admin.ts
import { createClient } from "@supabase/supabase-js";
import * as readline from "readline";

// Get environment variables from .env.local or set them directly here
const supabaseUrl = "https://rrpdaimpfskenvxzhoub.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJycGRhaW1wZnNrZW52eHpob3ViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjM0MTMyOSwiZXhwIjoyMDYxOTE3MzI5fQ.4OTOCvU_gorXX2LxksukKZAfamyy0LOIarm_DzikBi0";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables!");
  console.error(
    "Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create interface for reading user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function createAdmin() {
  console.log("=== Create Admin User ===");

  // Get admin email
  const email = await new Promise<string>((resolve) => {
    rl.question(
      "Enter admin email (recommended: admin@admin.com): ",
      (answer) => {
        resolve(answer);
      }
    );
  });

  // Get admin password
  const password = await new Promise<string>((resolve) => {
    rl.question(
      "Enter admin password (must be at least 6 characters): ",
      (answer) => {
        resolve(answer);
      }
    );
  });

  if (password.length < 6) {
    console.error("Password must be at least 6 characters!");
    rl.close();
    process.exit(1);
  }

  try {
    // Create the admin user using the admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
    });

    if (error) {
      console.error("Error creating admin user:", error.message);
      process.exit(1);
    }

    console.log("Admin user created successfully!");
    console.log("User ID:", data.user.id);
    console.log("Email:", data.user.email);
    console.log(
      "\nYou can now log in to the admin dashboard with these credentials."
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

createAdmin();
