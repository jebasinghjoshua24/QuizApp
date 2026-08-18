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
        <div className='flex min-h-screen items-center justify-center'>
            <form onSubmit={handleSubmit}>
                <label>E-Mail</label><br></br>
                <input className='border rounded px-3 py-2 focus:ring-2 focus:ring-blue-300 outline-none'
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                /><br></br>
                <label>Password</label><br></br>
                <input className='border rounded px-3 py-2 focus:ring-2 focus:ring-blue-300 outline-none'
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                /><br></br>
                { error && <p className='text-red-600 text-sm'>{error}</p>}
                <button type='submit'>Log In</button>
            </form>
        </div>
    );
}