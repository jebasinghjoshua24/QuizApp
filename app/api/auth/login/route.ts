import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import pool from "@/lib/db";

export async function POST(request: Request) {
    const { email, password } = await request.json();

    const result = await pool.query(
        "SELECT id, name, email, role, password_hash FROM users WHERE email = $1",
        [email]
    );

    if (result.rows.length === 0) {
        return NextResponse.json({ error: "Invalid email or password" }, {status: 401 });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
        return NextResponse.json({ error: "Invalid email or password"}, { status: 401 });
    }

    const token = crypto.randomUUID();
    await pool.query(
        "INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')",
        [token, user.id]
    );

    const cookieStore = await cookies();
    cookieStore.set("session_token", token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60  * 24 * 7,
        path: "/",
    });

    return NextResponse.json({
        user: {id: user.id, name: user.name, email: user.email, role: user.role },
    });
}