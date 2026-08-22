"use client";
import { useState, useEffect } from "react";
import { AssessmentWithQuestions, Question } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function AdminAssessments() {
    const [ title, setTitle ] = useState("");
    const [ description, setDescription ] = useState("");
    const [ duration_minutes, setDurationMinutes ] = useState("60");
    const [ starts_at, setStartsAt ] = useState("");
    const [ ends_at, setEndsAt ] = useState("");
    const [ show_result, setShowResult ] = useState(true);
    const [ error, setError ] = useState("");
    const [ selectedQuestionIds, setSelectedQuestionIds ] = useState<number[]>([]);
    const [ questions, setQuestions ] = useState<Question[]>([]);
    const [ assessments, setAssessments ] = useState<AssessmentWithQuestions[]>([])
    const [ success, setSuccess ] = useState("")
    const router = useRouter();

    useEffect(() => { loadAssessments(); }, []);
    useEffect(() => { loadQuestions(); }, []);

    const loadAssessments = async () => {
        const res = await fetch("/api/assessments");
        if(!res.ok) {
            const err = await res.json().catch(() => ({}));
            setError(err.error || "Failed to load assessments");
            return;
        }
        const data = await res.json();
        setAssessments(data.assessments);
    }
    const loadQuestions = async () => {
        const res = await fetch("/api/questions");
        if(!res.ok) {
            const err = await res.json().catch(() => ({}));
            setError(err.error || "Failed to load questions");
            return;
        }
        const data = await res.json();
        setQuestions(data.questions);
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
        const res = await fetch("/api/assessments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            title,
            description,
            duration_minutes: Number(duration_minutes),
            starts_at,
            ends_at,
            show_result,
            question_ids: selectedQuestionIds,
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            setError(err.error || "Something went wrong");
            return;
        }
        const data = await res.json();

        setSuccess("Assessment created");
        loadAssessments();
        setTitle("");
        setDescription("");
        setDurationMinutes("60");
        setStartsAt("");
        setEndsAt("");
        setSelectedQuestionIds([]);
        } catch {
        setError("An unexpected error occurred");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Assessment Manager</h1>
                        <p className="text-sm text-gray-500">Create timed assessments and link questions</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <nav className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
                            <button onClick={() => router.push("/admin")} className="text-gray-600 hover:text-gray-900 rounded-full px-3 py-1.5 text-sm font-medium transition-colors">
                                Questions
                            </button>
                            <span className="bg-white shadow-sm text-gray-900 rounded-full px-3 py-1.5 text-sm font-medium">Assessments</span>
                        </nav>
                        <button
                            onClick={() => router.push("/")}
                            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Log out →
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">New assessment</h2>
                    <p className="text-sm text-gray-500 mb-5">Define the window, time limit, and question set.</p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="title_id" className="text-sm font-medium text-gray-700">Title</label>
                            <input
                                id="title_id"
                                type="text"
                                placeholder="e.g. React Basics — Final"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="description_id" className="text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                id="description_id"
                                placeholder="Short description shown to students"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="duration_id" className="text-sm font-medium text-gray-700">Duration (min)</label>
                                <input
                                    id="duration_id"
                                    type="number"
                                    min="1"
                                    value={duration_minutes}
                                    onChange={(e) => setDurationMinutes(e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    id="show_result_id"
                                    type="checkbox"
                                    checked={show_result}
                                    onChange={(e) => setShowResult(e.target.checked)}
                                    className="accent-blue-600 h-4 w-4"
                                />
                                <span className="text-sm font-medium text-gray-700">Show results to students</span>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="starts_at_id" className="text-sm font-medium text-gray-700">Starts at</label>
                                <input
                                    id="starts_at_id"
                                    type="datetime-local"
                                    value={starts_at}
                                    onChange={(e) => setStartsAt(e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="ends_at_id" className="text-sm font-medium text-gray-700">Ends at</label>
                                <input
                                    id="ends_at_id"
                                    type="datetime-local"
                                    value={ends_at}
                                    onChange={(e) => setEndsAt(e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium text-gray-700">Questions ({selectedQuestionIds.length} selected)</span>
                            <div className="rounded-lg border border-gray-200 max-h-[280px] overflow-y-auto divide-y divide-gray-100">
                                {questions.length === 0 ? (
                                    <p className="p-4 text-sm text-gray-400">No questions in the pool yet.</p>
                                ) : (
                                    questions.map((q) => (
                                        <label key={q.id} className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${selectedQuestionIds.includes(q.id) ? "bg-blue-50" : ""}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedQuestionIds.includes(q.id)}
                                                onChange={() => {
                                                    if (selectedQuestionIds.includes(q.id)) {
                                                        setSelectedQuestionIds(
                                                            selectedQuestionIds.filter((id) => id !== q.id)
                                                        );
                                                    } else {
                                                        setSelectedQuestionIds([...selectedQuestionIds, q.id]);
                                                    }
                                                }}
                                                className="accent-blue-600 h-4 w-4 mt-0.5"
                                            />
                                            <span className="text-sm text-gray-900 flex-1">
                                                {q.text}
                                                <span className="text-xs text-gray-500 ml-2">{q.marks} mark{q.marks === 1 ? "" : "s"}</span>
                                            </span>
                                        </label>
                                    ))
                                )}
                            </div>
                            <p className="text-xs text-gray-400">Pick at least one — order is the order you pick them.</p>
                        </div>

                        {error && (
                            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>
                        )}
                        {success && (
                            <p className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">{success}</p>
                        )}

                        <button type="submit" className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 text-sm transition-colors">
                            Create Assessment
                        </button>
                    </form>
                </section>

                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Assessments</h2>
                    <p className="text-sm text-gray-500 mb-5">{assessments.length} assessment{assessments.length === 1 ? "" : "s"} total.</p>

                    {assessments.length === 0 ? (
                        <div className="rounded-lg border-2 border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
                            No assessments yet — create your first one.
                        </div>
                    ) : (
                        <ul className="flex flex-col gap-3 max-h-[560px] overflow-y-auto pr-1">
                            {assessments.map((a) => (
                                <li key={a.id} className="rounded-lg border border-gray-200 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="font-medium text-gray-900 text-sm">{a.title}</p>
                                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${a.show_result ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                            {a.show_result ? "Results visible" : "Results hidden"}
                                        </span>
                                    </div>
                                    {a.description && <p className="text-sm text-gray-600 mt-1">{a.description}</p>}
                                    <p className="text-xs text-gray-500 mt-2">
                                        {new Date(a.starts_at).toLocaleString()} → {new Date(a.ends_at).toLocaleString()} · {a.duration_minutes} min · {a.questions.length} question{a.questions.length === 1 ? "" : "s"}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </main>
        </div>
    )

}