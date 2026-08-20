import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: Request) {
    try {
        const { text, options, correctOption, marks } = await request.json();
        if(text === undefined || options === undefined || correctOption === undefined || marks === undefined) {
            return NextResponse.json({ error: "Missing required fields!" }, { status: 400 });
        }
        if (!Array.isArray(options) || options.length !== 4) {
            return NextResponse.json({ error: "Options must be exactly 4" }, { status: 400 });
        }
        if (!Number.isInteger(correctOption) || correctOption < 0 || correctOption > 3) {
            return NextResponse.json({ error: "Correct Option must be between 1 and 3" }, { status: 400 });
        }

        const query = `
        INSERT INTO questions (text, options, correct_option, marks)
        VALUES ($1, $2::jsonb, $3, $4)
        RETURNING id, text, options, correct_option, marks`;

        const values = [ text, JSON.stringify(options), correctOption, marks ];

        const result = await pool.query(query, values);

        const newQuestion = result.rows[0];

        return NextResponse.json({ newQuestion }, { status: 201});
    } catch {
        return NextResponse.json({ error: "Something Unexpected Happened" }, { status: 500 });
    }
};

export async function GET() {
    const result = await pool.query(`SELECT id, text, options, correct_option, marks FROM questions ORDER BY id DESC`);
    return NextResponse.json({ questions: result.rows }, { status: 200 });
}