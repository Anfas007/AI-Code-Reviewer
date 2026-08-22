import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/client';
import { Terminal, Lock, Mail, User, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        
        try {
            await apiClient.post('/auth/register', { 
                username: username,
                email: email, 
                password: password 
            });
            
            navigate('/login', { state: { message: "Account created successfully! Please sign in." } });
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#030712] font-sans text-white relative overflow-hidden px-4">
            
            {/* --- Futuristic Background Grid & Glows --- */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
                <div className="absolute -right-32 top-10 h-96 w-96 rounded-full bg-violet-600/15 blur-[120px]" />
                <div className="absolute left-0 bottom-0 h-96 w-96 rounded-full bg-cyan-600/15 blur-[120px]" />
            </div>

            {/* Glassmorphism Cyber Card */}
            <div className="w-full max-w-md p-8 relative z-10 bg-slate-900/60 backdrop-blur-2xl border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-3xl">
                
                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-3">
                        <Logo size={30} />
                        <div className="flex flex-col">
                            <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-violet-400 leading-tight">
                                Syntax Sentinel
                            </h1>
                            <p className="text-[9.5px] font-mono text-slate-500 uppercase tracking-widest leading-none mt-1">
                                AN AI CODE REVIEWER
                            </p>
                        </div>
                    </div>
                </div>

                <h2 className="text-3xl font-extrabold text-white mb-2 text-center tracking-tight">Create Account</h2>
                <p className="text-slate-400 text-sm mb-8 text-center font-mono">Join the AI Code Review platform</p>

                {error && (
                    <div className="mb-6 p-4 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-xl text-fuchsia-400 text-sm flex items-center gap-3">
                        <AlertTriangle size={18} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Username</label>
                        <div className="relative flex items-center">
                            <User size={18} className="absolute left-4 text-slate-500" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-slate-200 placeholder-slate-600 font-mono text-sm"
                                placeholder="dev_guru"
                                required
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Email</label>
                        <div className="relative flex items-center">
                            <Mail size={18} className="absolute left-4 text-slate-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-slate-200 placeholder-slate-600 font-mono text-sm"
                                placeholder="developer@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Password</label>
                        <div className="relative flex items-center">
                            <Lock size={18} className="absolute left-4 text-slate-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-slate-200 placeholder-slate-600 font-mono text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-3.5 px-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] flex items-center justify-center gap-2 group"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Provisioning...</span>
                            </>
                        ) : (
                            <>
                                <span>Sign Up</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-slate-400">
                    Already have an account?{' '}
                    <Link to="/login" className="text-cyan-400 font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}