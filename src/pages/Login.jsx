import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { MapPin } from 'lucide-react';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login, signup, googleSignIn, currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) {
            navigate('/', { replace: true });
        }
    }, [currentUser, navigate]);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password, name);
            }
        } catch (error) {
            if (isLogin) {
                toast.error('Email or password is incorrect');
            } else {
                if (error.code === 'auth/email-already-in-use') {
                    toast.error('User already exists. Please sign in');
                } else {
                    toast.error('Error during sign up: ' + error.message);
                }
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleSignIn() {
        try {
            await googleSignIn();
        } catch (error) {
            if (error.code !== 'auth/popup-closed-by-user') {
                toast.error('Failed to sign in with Google');
            }
        }
    }

    return (
        <div className="min-h-screen flex flex-col justify-center items-center px-6 bg-white max-w-md mx-auto">
            <div className="w-full flex flex-col items-center mb-8">
                <div className="bg-primary/10 p-4 rounded-full mb-4 text-primary">
                    <MapPin size={40} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">NearNotice</h1>
                <p className="text-gray-500 text-sm mt-1 text-center">Discover local notices in your community</p>
            </div>

            <button 
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-xl py-3 px-4 text-gray-700 font-medium hover:bg-gray-50 transition-colors mb-6"
            >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Continue with Google
            </button>

            <div className="flex items-center w-full mb-6">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-4 text-gray-400 text-sm">or</span>
                <div className="flex-1 border-t border-gray-200"></div>
            </div>

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                {!isLogin && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input 
                            type="text" 
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="John Doe"
                        />
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="you@example.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="••••••••"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-primary text-white rounded-xl py-3 font-semibold mt-2 hover:bg-primary-dark transition-colors disabled:opacity-70"
                >
                    {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
                </button>
            </form>

            <p className="mt-6 text-gray-600 text-sm">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-primary font-semibold hover:underline"
                >
                    {isLogin ? 'Sign Up' : 'Login'}
                </button>
            </p>
        </div>
    );
}
