"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [ email, setEmail ] = useState("");
    const [ password, setPassword ] = useState("");
    const [ error, setError ] = useState("");
    const router = useRouter();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            const res = await fetch('/api/auth/login', {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                setError(errorData.error || 'Login Failed');
                return;
            }

            const { user } = await res.json();

            if(user.role === 'admin') {
                router.push('/admin');
            } else if(user.role === 'student') {
                router.push('/dashboard');
            } else {
                router.push('/');
            }
        } catch(err) {
            setError('An unexpected error occurred');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <h1 className="text-2xl font-bold text-gray-900 text-center">Welcome back</h1>
                    <p className="text-sm text-gray-500 text-center mt-1 mb-6">
                        Sign in to your college account
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="email" className="text-sm font-medium text-gray-700">
                                E-Mail
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="password" className="text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        { error && (
                            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 text-sm transition-colors"
                        >
                            Log In
                        </button>
                    </form>
                </div>

                <p className="text-xs text-gray-400 text-center mt-4">
                    QuizApp — college unit project
                </p>
            </div>
        </div>
    );
}