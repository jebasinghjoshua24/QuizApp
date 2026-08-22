"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation";
import { AssessmentWithQuestions, User, FinishedItem } from "@/lib/types";
export default function Dashboard() {
    const [ upcoming, setUpcoming ] = useState<AssessmentWithQuestions[]>([]);
    const [ finished, setFinished ] = useState<FinishedItem[]>([]);
    const [ error, setError ] = useState("");
    const [ user, setUser ] = useState<User | null>(null)
    const router = useRouter();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const res = await fetch("/api/student/dashboard");
        if(!res.ok) {
            const err = await res.json().catch(() => ({}));
            setError(err.error || "Failed to load data");
            return;
        }
        const data = await res.json();
        setUser(data.user);
        setUpcoming(data.upcoming);
        setFinished(data.finished);
    }
    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Student Dashboard</h1>
                        <p className="text-sm text-gray-500">Your assessments — upcoming and finished</p>
                    </div>
                    <button
                        onClick={() => router.push("/")}
                        className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Log out →
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
                {error && (
                    <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>
                )}

                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Profile</h2>
                    {user ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">{user.name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                            <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-medium capitalize">{user.role}</span>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">Loading profile…</p>
                    )}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">Upcoming</h2>
                        <p className="text-sm text-gray-500 mb-5">{upcoming.length} assessment{upcoming.length === 1 ? "" : "s"} to attempt.</p>
                        {upcoming.length === 0 ? (
                            <div className="rounded-lg border-2 border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
                                No upcoming assessments.
                            </div>
                        ) : (
                            <ul className="flex flex-col gap-3 max-h-[560px] overflow-y-auto pr-1">
                                {upcoming.map(a =>
                                    <li key={a.id} className="rounded-lg border border-gray-200 p-4">
                                        <p className="font-medium text-gray-900 text-sm">{a.title}</p>
                                        {a.description && <p className="text-sm text-gray-600 mt-1">{a.description}</p>}
                                        <p className="text-xs text-gray-500 mt-2">
                                            {new Date(a.starts_at).toLocaleString()} → {new Date(a.ends_at).toLocaleString()} · {a.duration_minutes} min
                                        </p>
                                        <button onClick={() => router.push(`/exam/${a.id}`)} className="mt-3 w-full rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2 text-sm transition-colors">
                                            Start Assessment
                                        </button>
                                    </li>
                                )}
                            </ul>
                        )}
                    </section>

                    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">Finished</h2>
                        <p className="text-sm text-gray-500 mb-5">{finished.length} assessment{finished.length === 1 ? "" : "s"} completed.</p>
                        {finished.length === 0 ? (
                            <div className="rounded-lg border-2 border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
                                No finished assessments yet.
                            </div>
                        ) : (
                            <ul className="flex flex-col gap-3 max-h-[560px] overflow-y-auto pr-1">
                                {finished.map(f =>
                                    <li key={f.id} className="rounded-lg border border-gray-200 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="font-medium text-gray-900 text-sm">{f.title}</p>
                                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${f.show_result ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                                {f.show_result ? `Score: ${f.score}` : "Results hidden"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">Submitted {new Date(f.submitted_at).toLocaleString()}</p>
                                    </li>
                                )}
                            </ul>
                        )}
                    </section>
                </div>
            </main>
        </div>
    )
}