-- Students and Admin Users Schema
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    register_number TEXT,
    enrollment_number TEXT,
    section TEXT,
    current_year TEXT,
    department TEXT,
    batch TEXT,
    phone TEXT,
    parent_phone TEXT,
    address TEXT,
    college_email TEXT,
    personal_email TEXT,
    dob TEXT,
    blood_group TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create public policies
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Students" ON public.students;
DROP POLICY IF EXISTS "Public Insert Students" ON public.students;
DROP POLICY IF EXISTS "Public Update Students" ON public.students;
DROP POLICY IF EXISTS "Public Delete Students" ON public.students;

CREATE POLICY "Public Read Students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Public Insert Students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Students" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Public Delete Students" ON public.students FOR DELETE USING (true);

-- Admin Users Table with the exact authorized credentials
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Admins" ON public.admin_users;
DROP POLICY IF EXISTS "Public Insert Admins" ON public.admin_users;

CREATE POLICY "Public Read Admins" ON public.admin_users FOR SELECT USING (true);
CREATE POLICY "Public Insert Admins" ON public.admin_users FOR INSERT WITH CHECK (true);

INSERT INTO public.admin_users (email, password, role, name)
VALUES 
    ('facadmin@offlinecode.com', 'Admin@aidssmvec', 'Faculty Admin', 'Faculty Administrator'),
    ('stuadmin@offlinecode.com', 'Admin@aidssmvec', 'Student Admin', 'Student Administrator')
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role;
