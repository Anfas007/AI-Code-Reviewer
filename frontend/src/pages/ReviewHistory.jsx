import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../services/client';
import { 
    FileText, Calendar, Trash2, Eye, ChevronLeft, ChevronRight, 
    Loader2, AlertTriangle, ArrowLeft, LogOut 
} from 'lucide-react';

export default function ReviewHistory() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;
    
    // Auth context for logout
    const { logout } = useContext(AuthContext);

    const fetchHistory = async (currentPage) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(`/review/history?page=${currentPage}&limit=${limit}`);
            setReviews(response.data.reviews || []);
            setTotal(response.data.total || 0);
        } catch (err) {
            setError("Failed to load review history.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory(page);
    }, [page]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this scan log?")) return;
        try {
            await apiClient.delete(`/review/${id}`);
            fetchHistory(page);
        } catch (err) {
            alert("Failed to delete the review.");
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
        if (score >= 60) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
        if (score >= 40) return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
        return 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20';
    };

    const totalPages = Math.ceil(total / limit) || 1;

    return (
        <div className="min-h-screen bg-[#030712] font-sans pb-20 text-white relative overflow-hidden">
            {/* Cyber Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
                <div className="absolute top-0 left-1/4 h-100 w-100 rounded-full bg-cyan-600/10 blur-[120px]" />
            </div>
            
            <main className="max-w-5xl mx-auto px-6 py-12 relative z-10">
                <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-cyan-400 mb-8 transition-colors bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800 shadow-sm">
                    <ArrowLeft size={16} /> Return to Workspace
                </Link>

                <header className="mb-10 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-500">
                            Scan Archive
                        </h1>
                        <p className="text-slate-400 mt-2 font-mono text-sm">
                            Access and manage all previous AI code audits.
                        </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-4">
                        
                        <div className="text-sm font-mono text-cyan-400 bg-cyan-500/10 px-4 py-2 rounded-xl border border-cyan-500/30">
                            Total Records: <span className="font-bold text-white">{total}</span>
                        </div>
                    </div>
                </header>

                {error && (
                    <div className="mb-6 p-4 bg-fuchsia-500/10 text-fuchsia-400 rounded-xl border border-fuchsia-500/30 flex items-center gap-3 text-sm">
                        <AlertTriangle size={16} />{error}
                    </div>
                )}

                <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex justify-center items-center text-cyan-400">
                            <Loader2 className="animate-spin" size={32} />
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 font-mono">
                            No reviews found in the system.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800/50">
                            {reviews.map((review) => (
                                <div key={review.id} className="p-6 flex items-center justify-between hover:bg-slate-800/40 transition-colors group">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border ${getScoreColor(review.score)}`}>
                                            {review.score}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-200 flex items-center gap-2 group-hover:text-cyan-400 transition-colors">
                                                <FileText size={16} className="text-slate-500" />
                                                {review.filename}
                                            </h3>
                                            <p className="text-xs font-mono text-slate-500 flex items-center gap-1 mt-1.5">
                                                <Calendar size={13} />
                                                {new Date(review.created_at).toLocaleDateString()} // {new Date(review.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <Link 
                                            to={`/history/${review.id}`}
                                            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                                        >
                                            <Eye size={18} /> View Details
                                        </Link>
                                        <button 
                                            onClick={() => handleDelete(review.id)}
                                            className="p-2 text-slate-500 hover:text-fuchsia-400 hover:bg-fuchsia-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {!loading && totalPages > 1 && (
                    <div className="flex justify-between items-center mt-6 px-2">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-white disabled:opacity-50 transition-colors bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800"
                        >
                            <ChevronLeft size={16} /> Prev
                        </button>
                        <span className="text-sm font-mono text-slate-500">Page {page} of {totalPages}</span>
                        <button 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-white disabled:opacity-50 transition-colors bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800"
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}