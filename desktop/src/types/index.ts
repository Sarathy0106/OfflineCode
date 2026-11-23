export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'student';
  full_name: string;
  student_id?: string;
  created_at?: string;
}

export interface TestCase {
  id?: string;
  question_id?: string;
  input: string;
  expected_output: string;
  is_hidden?: boolean;
  explanation?: string;
}

export interface Question {
  id: string;
  test_id?: string;
  order_index?: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
  description: string;
  constraints?: string;
  input_format?: string;
  output_format?: string;
  allowed_languages: string[];
  starter_templates: Record<string, string>;
  sample_test_cases?: TestCase[];
  hidden_test_cases?: TestCase[];
}

export interface Test {
  id: string;
  title: string;
  subject: string;
  topic?: string;
  duration_minutes: number;
  total_marks: number;
  passing_percentage: number;
  instructions: string[];
  is_published: boolean;
  created_by?: string;
  created_at?: string;
  questions?: Question[];
}

export interface AdminJsonTemplate {
  test_title: string;
  subject: string;
  topic?: string;
  duration_minutes: number;
  total_marks: number;
  passing_percentage: number;
  instructions: string[];
  questions: Array<{
    id?: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    marks: number;
    description: string;
    constraints?: string;
    input_format?: string;
    output_format?: string;
    allowed_languages: string[];
    starter_templates: Record<string, string>;
    sample_test_cases: Array<{
      input: string;
      expected_output: string;
      explanation?: string;
    }>;
    hidden_test_cases: Array<{
      input: string;
      expected_output: string;
    }>;
  }>;
}

export interface StudentSubmission {
  id?: string;
  attempt_id?: string;
  question_id: string;
  language: string;
  source_code: string;
  passed_sample_cases: number;
  total_sample_cases: number;
  passed_hidden_cases: number;
  total_hidden_cases: number;
  score: number;
  execution_logs?: any[];
}

export interface TestAttempt {
  id?: string;
  test_id: string;
  student_id: string;
  student_name: string;
  student_email?: string;
  started_at: string;
  submitted_at?: string;
  status: 'in_progress' | 'submitted' | 'evaluated';
  total_score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  integrity_hash?: string;
  submissions?: StudentSubmission[];
}
