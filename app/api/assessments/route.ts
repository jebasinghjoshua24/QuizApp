import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { title, description, duration_minutes, starts_at, ends_at, show_result, question_ids } = await request.json();

    if (title === undefined || title.trim() === "") return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (duration_minutes === undefined || Number(duration_minutes) < 1) return NextResponse.json({ error: "Duration must be at least 1" }, { status: 400 });
    if (starts_at === undefined || starts_at === "") return NextResponse.json({ error: "Starts at is required" }, { status: 400 });
    if (new Date(starts_at) < new Date()) return NextResponse.json({ error: "Starts at must be in the future" }, { status: 400 });
    if (ends_at === undefined || ends_at === "") return NextResponse.json({ error: "Ends at is required" }, { status: 400 });
    if (ends_at < starts_at) return NextResponse.json({ error: "Ends at must be after Starts at" }, { status: 400 });
    if (question_ids === undefined || !Array.isArray(question_ids) || question_ids.length === 0) return NextResponse.json({ error: "Pick at least one question" }, { status: 400 });

    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: "Not Authenticated" }, { status: 401 });
    }

    if(user.role !== 'admin') {
        return NextResponse.json({ error: "Not Authorized" }, { status: 403 });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const insertAssessmentResult = await client.query(`INSERT INTO assessments (title, description, duration_minutes, starts_at, ends_at, show_result, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [
                title.trim(),
                description || null,
                duration_minutes,
                starts_at,
                ends_at,
                show_result || false,
                user.id
            ]
        );

        const assessmentId = insertAssessmentResult.rows[0].id;

        for( let i: number = 0; i < question_ids.length; i++) {
            const qId = question_ids[i];
            await client.query(
                `INSERT INTO assessment_questions(assessment_id, question_id, order_index, marks) VALUES ($1, $2, $3, $4)`,
                [ assessmentId, qId, i, 1]
            );
        }

        await client.query('COMMIT');

        const newAssignment = {
            id: assessmentId,
            title: title.trim(),
            description: description || null,
            duration_minutes: duration_minutes,
            starts_at: starts_at,
            ends_at: ends_at,
            show_result: show_result,
            created_by: user.id,
        };

        return NextResponse.json({ assessment: newAssignment }, { status: 201 });
    } catch {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }

    finally { 
        client.release();
    }
}

export async function GET() {
    const data = await pool.query(`SELECT
        a.id,
        a.title,
        a.description,
        a.duration_minutes,
        a.starts_at,
        a.ends_at,
        a.show_result,
        COALESCE(jsonb_agg(json_build_object(
            'id', q.id,
            'text', q.text,
            'options', q.options,
            'correct_option', q.correct_option,
            'marks', q.marks,
            'order_index', aq.order_index
            ) ORDER BY aq.order_index) FILTER (WHERE q.id IS NOT NULL), '[]'::jsonb) AS questions
        FROM assessments a
        LEFT JOIN assessment_questions aq ON aq.assessment_id = a.id
        LEFT JOIN questions q ON q.id = aq.question_id
        GROUP BY a.id
        ORDER BY a.starts_at DESC
    `);
    return NextResponse.json({ assessments: data.rows });
}