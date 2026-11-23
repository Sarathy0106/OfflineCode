-- Offline Exam Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (Admins & Students)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'student')) DEFAULT 'student',
    full_name TEXT NOT NULL,
    student_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tests (Created by Admin)
CREATE TABLE IF NOT EXISTS public.tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    total_marks INTEGER NOT NULL DEFAULT 100,
    passing_percentage INTEGER NOT NULL DEFAULT 50,
    instructions JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT TRUE,
    created_by TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Questions (Coding questions belonging to tests)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 1,
    title TEXT NOT NULL,
    difficulty TEXT DEFAULT 'Medium',
    marks INTEGER DEFAULT 10,
    description TEXT NOT NULL,
    constraints TEXT,
    input_format TEXT,
    output_format TEXT,
    allowed_languages JSONB DEFAULT '["python", "cpp", "java", "c"]'::jsonb,
    starter_templates JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Test Cases (Sample and Hidden)
CREATE TABLE IF NOT EXISTS public.test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE,
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Test Attempts (Exam records submitted by students)
CREATE TABLE IF NOT EXISTS public.test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_email TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'submitted', 'evaluated')) DEFAULT 'submitted',
    total_score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    percentage NUMERIC(5, 2) DEFAULT 0,
    passed BOOLEAN DEFAULT FALSE,
    integrity_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Student Submissions (Detailed per-question code submissions)
CREATE TABLE IF NOT EXISTS public.student_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES public.test_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    source_code TEXT NOT NULL,
    passed_sample_cases INTEGER DEFAULT 0,
    total_sample_cases INTEGER DEFAULT 0,
    passed_hidden_cases INTEGER DEFAULT 0,
    total_hidden_cases INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    execution_logs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_submissions ENABLE ROW LEVEL SECURITY;

-- Permissive policies for anon and authenticated users
CREATE POLICY "Allow public read access to tests" ON public.tests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access to questions" ON public.questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access to test_cases" ON public.test_cases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public insert and read test_attempts" ON public.test_attempts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public insert and read student_submissions" ON public.student_submissions FOR ALL USING (true) WITH CHECK (true);
