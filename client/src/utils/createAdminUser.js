// Admin User Creation Script
// Run this in the browser console or create a temporary page to execute it

import { createAdminUser } from '../lib/api/admin';

export const setupAdminUser = async () => {
  try {
    // Replace these with your desired admin credentials
    const adminEmail = 'admin@cineverse.com';
    const adminPassword = 'admin123456';
    const adminName = 'Admin User';

    console.log('Creating admin user...');
    
    const result = await createAdminUser(adminEmail, adminPassword, adminName);
    
    if (result.user) {
      console.log('✅ Admin user created successfully!');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
      console.log('Name:', adminName);
      console.log('You can now log in with these credentials to access the admin panel.');
    } else {
      console.log('❌ Failed to create admin user');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
};

// Alternative: Manual SQL to create admin user
export const createAdminUserSQL = `
-- Run this SQL in your Supabase SQL Editor to manually create an admin user

-- First, create the user in auth.users (you'll need to sign up normally first)
-- Then run this to mark them as admin:

UPDATE public.users 
SET is_admin = true, 
    display_name = 'Admin User'
WHERE email = 'your-admin-email@example.com';

-- Or insert a new admin user directly:
INSERT INTO public.users (id, email, display_name, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@cineverse.com',
  'Admin User',
  true,
  NOW(),
  NOW()
);
`; 