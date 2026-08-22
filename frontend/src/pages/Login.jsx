
import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../services/client';
import {
    Lock,
    Mail,
    ArrowRight,
    AlertTriangle,
    CheckCircle,
    Loader2
} from 'lucide-react';
import Logo from '../components/Logo';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { login, isAuthenticated } = useContext(AuthContext);

    const navigate = useNavigate();
    const location = useLocation();

    const successMessage = location.state?.message;

    // ========================================================
    // If already authenticated, don't show login page
    // ========================================================

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // ========================================================
    // Login
    // ========================================================

    const handleLogin = async (event) => {
        event.preventDefault();

        if (loading) {
            return;
        }

        setError(null);
        setLoading(true);

        try {
            console.log('Attempting login...');

            const response = await apiClient.post('/auth/login', {
                email: email.trim(),
                password: password
            });

            console.log('Login response:', response.data);

            const accessToken = response.data?.access_token;

            if (!accessToken) {
                throw new Error(
                    'Login succeeded but no access token was returned by the server.'
                );
            }

            // Save token + update AuthContext
            login(accessToken);

            console.log('Login successful. Redirecting...');

            // Navigate directly after successful login
            navigate('/dashboard', { replace: true });

        } catch (err) {
            console.error('Login error:', err);
            console.error('Backend response:', err.response?.data);

            let message =
                'Login failed. Please check your email and password.';

            const detail = err.response?.data?.detail;

            if (typeof detail === 'string') {
                message = detail;
            } else if (Array.isArray(detail)) {
                message = detail
                    .map((item) => {
                        const location = Array.isArray(item.loc)
                            ? item.loc.slice(1).join('.')
                            : '';

                        return location
                            ? `${location}: ${item.msg}`
                            : item.msg;
                    })
                    .join(', ');
            } else if (detail && typeof detail === 'object') {
                message = JSON.stringify(detail);
            } else if (err.message) {
                message = err.message;
            }

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#030712] font-sans text-white relative overflow-hidden px-4">

            {/* ==================================================
                Background
            ================================================== */}

            <div className="absolute inset-0 z-0 pointer-events-none">

                <div
                    className="
                        absolute inset-0
                        bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)]
                        bg-size-[3rem_3rem]
                        opacity-20
                    "
                />

                <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-cyan-600/15 blur-[120px]" />

                <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-violet-600/15 blur-[120px]" />

            </div>

            {/* ==================================================
                Login Card
            ================================================== */}

            <div className="
                w-full
                max-w-md
                p-8
                relative
                z-10
                bg-slate-900/60
                backdrop-blur-2xl
                border
                border-slate-800
                shadow-[0_0_50px_rgba(0,0,0,0.8)]
                rounded-3xl
            ">

                {/* Logo */}

                <div className="flex justify-center mb-6">

                    <div className="flex items-center gap-3">

                        <Logo size={36} />

                        <div className="flex flex-col">

                            <h1 className="
                                text-xl
                                font-extrabold
                                text-transparent
                                bg-clip-text
                                bg-linear-to-r
                                from-cyan-400
                                to-violet-400
                                leading-tight
                            ">
                                Syntax Sentinel
                            </h1>

                            <p className="
                                text-[9.5px]
                                font-mono
                                text-slate-500
                                uppercase
                                tracking-widest
                                leading-none
                                mt-1
                            ">
                                AN AI CODE REVIEWER
                            </p>

                        </div>

                    </div>

                </div>

                <h2 className="
                    text-3xl
                    font-extrabold
                    text-white
                    mb-2
                    text-center
                    tracking-tight
                ">
                    Welcome Back
                </h2>

                <p className="
                    text-slate-400
                    text-sm
                    mb-8
                    text-center
                    font-mono
                ">
                    Authenticate to access AI core workspace
                </p>

                {/* ==================================================
                    Success Message
                ================================================== */}

                {successMessage && (
                    <div className="
                        mb-6
                        p-4
                        bg-emerald-500/10
                        border
                        border-emerald-500/30
                        rounded-xl
                        text-emerald-400
                        text-sm
                        flex
                        items-center
                        gap-3
                    ">
                        <CheckCircle size={18} />

                        <span>
                            {successMessage}
                        </span>
                    </div>
                )}

                {/* ==================================================
                    Error Message
                ================================================== */}

                {error && (
                    <div className="
                        mb-6
                        p-4
                        bg-fuchsia-500/10
                        border
                        border-fuchsia-500/30
                        rounded-xl
                        text-fuchsia-400
                        text-sm
                        flex
                        items-start
                        gap-3
                    ">
                        <AlertTriangle
                            size={18}
                            className="shrink-0 mt-0.5"
                        />

                        <span>
                            {error}
                        </span>
                    </div>
                )}

                {/* ==================================================
                    Login Form
                ================================================== */}

                <form
                    onSubmit={handleLogin}
                    className="space-y-5"
                >

                    {/* Email */}

                    <div>

                        <label className="
                            block
                            text-xs
                            font-mono
                            uppercase
                            tracking-wider
                            text-slate-400
                            mb-2
                        ">
                            Email Identity
                        </label>

                        <div className="relative flex items-center">

                            <Mail
                                size={18}
                                className="
                                    absolute
                                    left-4
                                    text-slate-500
                                "
                            />

                            <input
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                disabled={loading}
                                autoComplete="email"
                                className="
                                    w-full
                                    pl-12
                                    pr-4
                                    py-3.5
                                    rounded-xl
                                    bg-slate-950/60
                                    border
                                    border-slate-800
                                    focus:outline-none
                                    focus:border-cyan-400
                                    focus:ring-1
                                    focus:ring-cyan-400
                                    transition-all
                                    text-slate-200
                                    placeholder-slate-600
                                    font-mono
                                    text-sm
                                    disabled:opacity-60
                                    disabled:cursor-not-allowed
                                "
                                placeholder="developer@example.com"
                                required
                            />

                        </div>

                    </div>

                    {/* Password */}

                    <div>

                        <label className="
                            block
                            text-xs
                            font-mono
                            uppercase
                            tracking-wider
                            text-slate-400
                            mb-2
                        ">
                            Access Key
                        </label>

                        <div className="relative flex items-center">

                            <Lock
                                size={18}
                                className="
                                    absolute
                                    left-4
                                    text-slate-500
                                "
                            />

                            <input
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                disabled={loading}
                                autoComplete="current-password"
                                className="
                                    w-full
                                    pl-12
                                    pr-4
                                    py-3.5
                                    rounded-xl
                                    bg-slate-950/60
                                    border
                                    border-slate-800
                                    focus:outline-none
                                    focus:border-cyan-400
                                    focus:ring-1
                                    focus:ring-cyan-400
                                    transition-all
                                    text-slate-200
                                    placeholder-slate-600
                                    font-mono
                                    text-sm
                                    disabled:opacity-60
                                    disabled:cursor-not-allowed
                                "
                                placeholder="••••••••"
                                required
                            />

                        </div>

                    </div>

                    {/* Submit */}

                    <button
                        type="submit"
                        disabled={loading}
                        className="
                            w-full
                            mt-2
                            py-3.5
                            px-4
                            bg-cyan-500
                            hover:bg-cyan-400
                            text-slate-950
                            font-bold
                            rounded-xl
                            transition-all
                            shadow-[0_0_20px_rgba(34,211,238,0.2)]
                            disabled:opacity-70
                            disabled:bg-slate-700
                            disabled:cursor-not-allowed
                            flex
                            items-center
                            justify-center
                            gap-2
                            group
                        "
                    >

                        {loading ? (
                            <>
                                <Loader2
                                    size={18}
                                    className="animate-spin"
                                />

                                <span>
                                    Authenticating...
                                </span>
                            </>
                        ) : (
                            <>
                                <span>
                                    Initialize Session
                                </span>

                                <ArrowRight
                                    size={16}
                                    className="
                                        group-hover:translate-x-1
                                        transition-transform
                                    "
                                />
                            </>
                        )}

                    </button>

                </form>

                {/* ==================================================
                    Register
                ================================================== */}

                <p className="
                    mt-8
                    text-center
                    text-sm
                    text-slate-400
                ">
                    Need neural clearance?{' '}

                    <Link
                        to="/register"
                        className="
                            text-cyan-400
                            font-medium
                            hover:underline
                        "
                    >
                        Register account
                    </Link>
                </p>

            </div>

        </div>
    );
}
