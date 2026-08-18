import { cookies } from "next/headers";
import pool from "@/lib/db";

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) return null;

    const result = await pool.query(
        `SELECT u.id, u.name, u.email, u.role
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = $1 AND s.expires_at > NOW()`,
        [token]
    );

    return result.rows[0] ?? null;
}