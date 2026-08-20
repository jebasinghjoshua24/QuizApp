"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Question } from "@/lib/types";

export default function Admin() {
  const [text, setText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(0);
  const [marks, setMarks] = useState("1");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          options,
          correctOption,
          marks: Number(marks),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setSuccess("Question created");
      loadQuestions();
      setText("");
      setOptions(["", "", "", ""]);
      setCorrectOption(0);
      setMarks("1");
    } catch {
      setError("An unexpected error occurred");
    }
  };

  useEffect(() => {loadQuestions(); }, []);

  const loadQuestions = async () => {
    const res = await fetch("/api/questions");
    const data = await res.json();
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to load questions");
        return;
    }
    setQuestions(data.questions);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Question Manager</h1>
            <p className="text-sm text-gray-500">Create and review MCQ questions</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Log out →
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">New question</h2>
          <p className="text-sm text-gray-500 mb-5">Fill in the fields below to add a question to the pool.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="question-text" className="text-sm font-medium text-gray-700">Question</label>
              <input
                id="question-text"
                type="text"
                placeholder="e.g. What does SQL stand for?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-gray-700">Options</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map((option, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors ${
                      correctOption === index ? "border-blue-400 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="correct"
                      checked={correctOption === index}
                      onChange={() => setCorrectOption(index)}
                      className="accent-blue-600 h-4 w-4"
                    />
                    <input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) =>
                        setOptions(options.map((o, i) => (i === index ? e.target.value : o)))
                      }
                      required
                      className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400">Select the radio next to the correct answer.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="marks" className="text-sm font-medium text-gray-700">Marks</label>
              <input
                id="marks"
                type="number"
                min="1"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                required
                className="w-28 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            {success && (
              <p className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">{success}</p>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 text-sm transition-colors"
            >
              Create Question
            </button>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Question pool</h2>
          <p className="text-sm text-gray-500 mb-5">
            {questions.length} question{questions.length === 1 ? "" : "s"} in the pool.
          </p>

          {questions.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
              No questions yet — create your first one.
            </div>
          ) : (
            <ul className="flex flex-col gap-3 max-h-[560px] overflow-y-auto pr-1">
              {questions.map((q) => (
                <li key={q.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-gray-900 text-sm">{q.text}</p>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      {q.marks} mark{q.marks === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {q.options.map((opt, i) => (
                      <span
                        key={i}
                        className={`rounded-full px-2.5 py-1 text-xs ${
                          i === q.correct_option
                            ? "bg-green-100 text-green-700 font-medium"
                            : "bg-gray-50 text-gray-600"
                        }`}
                      >
                        {String.fromCharCode(65 + i)}. {opt}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}