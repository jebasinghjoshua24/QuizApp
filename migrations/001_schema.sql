CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK ( role IN ('student', 'admin'))
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    options JSONB NOT NULL CHECK (jsonb_array_length(options) = 4),
    correct_option INTEGER NOT NULL CHECK (correct_option BETWEEN 0 AND 3),
    marks INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE assessments (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    starts_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMP NOT NULL,
    show_result BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INTEGER NOT NULL REFERENCES users(id),
    CHECK (ends_at > starts_at)
);

CREATE TABLE assessment_questions (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES assessments(id),
    question_id INTEGER NOT NULL REFERENCES questions(id),
    order_index INTEGER NOT NULL,
    marks INTEGER NOT NULL DEFAULT 1,
    UNIQUE (assessment_id, question_id)
);

CREATE TABLE attempts (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id),
    assessment_id INTEGER NOT NULL REFERENCES assessments(id),
    started_at TIMESTAMP DEFAULT NOW(),
    submitted_at TIMESTAMP,
    score INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted'))
);

CREATE TABLE answers (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER NOT NULL REFERENCES attempts(id),
    question_id INTEGER NOT NULL REFERENCES questions(id),
    selected_option INTEGER NOT NULL
);