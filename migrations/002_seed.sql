-- 002_seed.sql — demo data for QuizApp
-- Passwords: admin123 (admin), student123 (students)

INSERT INTO USERS(name, email, password_hash, role) VALUES
    ('Admin Users',  'admin@quizapp.com', crypt('admin123', gen_salt('bf')), 'admin'),
    ('Ada Lovelace', 'ada@quizapp.com', crypt('student123', gen_salt('bf')), 'student'),
    ('Alan Turing',   'alan@quizapp.com',     crypt('student123', gen_salt('bf')), 'student'),
    ('Grace Hopper',  'grace@quizapp.com',    crypt('student123', gen_salt('bf')), 'student');

INSERT INTO questions (text, options, correct_option, marks) VALUES
    ('Which language does React use for component rendering?',
    '["JavaScript", "Python", "C#", "Java"]', 0, 1),
    ('What does SQL stand for?',
    '["Structured Question Language", "Structured Query Language", "Simple Query Language", "Standard Query Language"]', 1, 1),
    ('Which hook manages state in React?',
    '["useEffect", "useState", "useRef", "useMemo"]', 1, 2),
    ('Which HTTP method creates a new resource?',
    '["GET", "PUT", "POST", "DELETE"]', 2, 1),
    ('What is the output of typeof null in JavaScript?',
    '["null", "undefined", "object", "boolean"]', 2, 2),
    ('Which Next.js router is used for file-based routing?',
    '["App Router", "Browser Router", "Hash Router", "Memory Router"]', 0, 1);

INSERT INTO assessments (title, description, duration_minutes, starts_at, ends_at, show_result, created_by) VALUES
    ('React Basics Quiz', 'Covers React and JS fundamentals.', 10,
    NOW() - INTERVAL '1 day', NOW() + INTERVAL '3 days', TRUE,
    (SELECT id FROM users WHERE email = 'admin@quizapp.com')),
    ('Database Fundamentals', 'Intro to SQL and databases.', 15,
    NOW() + INTERVAL '2 days', NOW() + INTERVAL '4 days', FALSE,
    (SELECT id FROM users WHERE email = 'admin@quizapp.com'));

INSERT INTO assessment_questions (assessment_id, question_id, order_index, marks) VALUES 
    (1, 1, 1, 1), (1, 2, 2, 1), (1, 3, 3, 2), (1, 5, 4, 2), (1, 6, 5, 1),
    (2, 2, 1, 1), (2, 4, 2, 1), (2, 5, 3, 2);