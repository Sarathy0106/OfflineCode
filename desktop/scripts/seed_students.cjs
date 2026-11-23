const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://leobcfruebikreiuhcvw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlb2JjZnJ1ZWJpa3JlaXVoY3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU0MjE2MTQsImV4cCI6MjExMDk5NzYxNH0.Qiu82DeU1PNfR7tvCC9riav-oc2mKvCxEarEwqtylz0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function seedStudents() {
  const csvPath = path.join(__dirname, '../../students_dataset.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = fileContent.split(/\r?\n/).filter(l => l.trim().length > 0);

  const students = [];

  for (const line of lines) {
    if (line.startsWith('name,register_number') || line.replace(/,/g, '').trim().length === 0) {
      continue;
    }
    const cols = parseCSVLine(line);
    if (cols.length < 5 || !cols[0]) continue;

    students.push({
      name: cols[0],
      register_number: cols[1] || '',
      enrollment_number: cols[2] || '',
      section: cols[3] || 'A',
      current_year: cols[4] || 'II Year',
      department: cols[5] || 'AI&DS',
      batch: cols[6] || '2025-2029',
      phone: cols[7] || '',
      parent_phone: cols[8] || '',
      address: (cols[9] || '').replace(/^"|"$/g, ''),
      college_email: cols[10] || '',
      personal_email: cols[11] || '',
      dob: cols[12] || '',
      blood_group: cols[13] || '',
      status: 'Active'
    });
  }

  console.log(`Parsed ${students.length} students from CSV.`);

  // Clear existing students to avoid duplicates
  await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Insert in batches of 40
  const batchSize = 40;
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);
    const { error } = await supabase.from('students').insert(batch);
    if (error) {
      console.error(`Error inserting batch ${i}:`, error);
    } else {
      console.log(`Inserted batch ${i} to ${i + batch.length}`);
    }
  }

  const { count, error: countErr } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });

  console.log(`Total students in Supabase DB: ${count}`);
}

seedStudents().catch(console.error);
