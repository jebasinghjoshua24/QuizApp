import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
    try {
        const user = await getCurrentUser();
        if(!user) {
            return NextResponse.json({ error: "Bad Request" }, { status: 401 });
        }

        if(user.role !== 'student') {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const upcoming = await pool.query(`
            SELECT id, title, description, starts_at, ends_at, duration_minutes, show_result
            FROM assessments
            WHERE id NOT IN (SELECT assessment_id FROM attempts WHERE student_id = $1)
            ORDER BY starts_at`, 
            [user.id]
        );
        
        const finished = await pool.query(`
            SELECT a.id, a.title, a.show_result, att.score, att.submitted_at
            FROM attempts att JOIN assessments a ON a.id = att.assessment_id
            WHERE att.student_id = $1 AND att.status = 'submitted'
            ORDER BY att.submitted_at DESC`,
            [user.id]
        );

        return NextResponse.json({ upcoming: upcoming.rows || [], finished: finished.rows || [], user }, { status: 200 });
    } catch {
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}