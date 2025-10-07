-- Security Fix: Restrict Profile and User Role Visibility
-- This migration addresses critical PII exposure vulnerabilities

-- 1. Fix profiles table - restrict email visibility
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create restrictive policy: users can only see their own email
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create policy for viewing other users' limited data (no email)
-- This is handled by the above policy + application-level filtering
-- Since RLS doesn't support column-level restrictions, 
-- we rely on the frontend to not query emails of other users

-- Create admin policy to view all profiles including emails
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin_or_owner(auth.uid()));

-- 2. Fix user_roles table - prevent role enumeration
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- Users can only see their own roles
CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view all roles (needed for admin panel)
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.is_admin_or_owner(auth.uid()));