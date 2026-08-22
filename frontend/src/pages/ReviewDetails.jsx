import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../services/client';
import { 
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer 
} from 'recharts';
import {
    ArrowLeft, Loader2, AlertTriangle, ShieldAlert, Bug, Activity, FileCode2, 
    Sparkles, Lightbulb, Calendar, Gauge, Terminal, CheckCircle, Code2,
    BarChart3, Boxes, FileInput, Repeat2, ListChecks, Layers, GitBranch
} from 'lucide-react';

export default function ReviewDetails() {
    const { id } = useParams();
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Safe JSON Parser ---
    const safeParse = (dataField) => {
        if (typeof dataField === 'string') {
            try { return JSON.parse(dataField); } catch (e) { return {}; }
        }
        return dataField || {};
    };

    useEffect(() => {
        const fetchReview = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get(`/review/${id}`);
                
                // Parse the data safely
                const reviewData = response.data;
                reviewData.ai_review = safeParse(reviewData.ai_review);
                reviewData.summary = safeParse(reviewData.summary);
                reviewData.issues = safeParse(reviewData.issues);
                
                // Ensure metrics are available regardless of backend structure
                if (!reviewData.metrics) {
                    reviewData.metrics = reviewData.code_metrics || reviewData.analysis?.metrics || {};
                }
                reviewData.metrics = safeParse(reviewData.metrics);

                setReview(reviewData);
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to load review details.');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchReview();
    }, [id]);

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-cyan-400';
        if (score >= 60) return 'text-blue-400';
        if (score >= 40) return 'text-violet-400';
        return 'text-fuchsia-500';
    };

    const getSummaryText = () => {
        if (!review) return "";
        if (typeof review.ai_review?.summary === 'string') return review.ai_review.summary;
        if (typeof review.summary === 'string') return review.summary;
        return "Scan complete. Review the issues below.";
    };

    // --- CODE METRICS HELPER ---
    const getCodeMetrics = () => {
        if (!review) return {};
        const metrics = review.metrics || {};
        return {
            functions: metrics.functions ?? metrics.function_count ?? 0,
            classes: metrics.classes ?? metrics.class_count ?? 0,
            imports: metrics.imports ?? metrics.import_count ?? 0,
            loops: metrics.loops ?? metrics.loop_count ?? 0,
            conditions: metrics.conditions ?? metrics.condition_count ?? 0,
            max_nesting: metrics.max_nesting ?? metrics.maximum_nesting ?? 0,
            complexity: metrics.complexity ?? metrics.cyclomatic_complexity ?? 0
        };
    };
    const metrics = getCodeMetrics();

    const staticIssues = Array.isArray(review?.issues) ? review.issues : [];
    const aiIssueGroups = [
        review?.ai_review?.security,
        review?.ai_review?.bugs,
        review?.ai_review?.quality,
        review?.ai_review?.performance
    ];
    const allIssues = [
        ...aiIssueGroups.flatMap((issues) => Array.isArray(issues) ? issues : []),
        ...staticIssues
    ];
    const severityTotals = allIssues.reduce(
        (totals, issue) => {
            const severity = String(issue?.severity || '').toLowerCase();
            if (severity in totals) totals[severity] += 1;
            return totals;
        },
        { high: 0, medium: 0, low: 0 }
    );

    const radarData = review ? [
        { subject: 'Security', value: Math.min((review.ai_review?.security?.length || 0) + staticIssues.filter((issue) => String(issue?.category || '').toLowerCase().includes('security')).length, 5), fullMark: 5 },
        { subject: 'Quality', value: Math.min((review.ai_review?.quality?.length || 0) + staticIssues.filter((issue) => ['best-practice', 'maintainability'].includes(String(issue?.category || '').toLowerCase())).length, 5), fullMark: 5 },
        { subject: 'Bugs', value: Math.min((review.ai_review?.bugs?.length || 0) + staticIssues.filter((issue) => String(issue?.category || '').toLowerCase() === 'bug').length, 5), fullMark: 5 },
        { subject: 'Performance', value: Math.min((review.ai_review?.performance?.length || 0) + staticIssues.filter((issue) => String(issue?.category || '').toLowerCase() === 'performance').length, 5), fullMark: 5 },
    ] : [];

    // --- METRIC CARD COMPONENT ---
    const MetricCard = ({ label, value, icon: Icon, color }) => (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm transition-all hover:border-slate-700 hover:bg-slate-900/60">
            <div className="flex items-center justify-between mb-4">
                <div className={`rounded-xl p-2.5 ${color}`}>
                    <Icon size={18} />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-600">METRIC</span>
            </div>
            <p className="text-3xl font-bold font-mono text-white">{value}</p>
            <p className="mt-1 text-xs font-mono uppercase tracking-wider text-slate-500">{label}</p>
        </div>
    );

    // --- REUSABLE CYBER ISSUE LIST ---
    const CyberIssueList = ({ title, icon: Icon, issues, themeColor }) => {
        if (!Array.isArray(issues) || issues.length === 0) return null;

        const themes = {
            fuchsia: { bg: 'bg-fuchsia-500/5', border: 'border-fuchsia-500/20', hover: 'hover:bg-fuchsia-500/10', text: 'text-fuchsia-100', desc: 'text-fuchsia-200/70', badgeBg: 'bg-fuchsia-500/20', badgeText: 'text-fuchsia-300', icon: 'text-fuchsia-400' },
            amber: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', hover: 'hover:bg-amber-500/10', text: 'text-amber-100', desc: 'text-amber-200/70', badgeBg: 'bg-amber-500/20', badgeText: 'text-amber-300', icon: 'text-amber-400' },
            cyan: { bg: 'bg-cyan-500/5', border: 'border-cyan-500/20', hover: 'hover:bg-cyan-500/10', text: 'text-cyan-100', desc: 'text-cyan-200/70', badgeBg: 'bg-cyan-500/20', badgeText: 'text-cyan-300', icon: 'text-cyan-400' },
            violet: { bg: 'bg-violet-500/5', border: 'border-violet-500/20', hover: 'hover:bg-violet-500/10', text: 'text-violet-100', desc: 'text-violet-200/70', badgeBg: 'bg-violet-500/20', badgeText: 'text-violet-300', icon: 'text-violet-400' },
            slate: { bg: 'bg-slate-500/5', border: 'border-slate-500/20', hover: 'hover:bg-slate-500/10', text: 'text-slate-100', desc: 'text-slate-400', badgeBg: 'bg-slate-500/20', badgeText: 'text-slate-300', icon: 'text-slate-400' }
        };
        const t = themes[themeColor] || themes.slate;

        return (
            <div className="mb-8">
                <h3 className={`text-sm font-mono uppercase tracking-widest ${t.badgeText} mb-4 flex items-center gap-2`}>
                    <Icon size={16} className={t.icon} /> {title}
                </h3>
                <div className="space-y-4">
                    {issues.map((issue, idx) => (
                        <div key={idx} className={`p-5 rounded-2xl border ${t.border} ${t.bg} transition-all ${t.hover}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h4 className={`font-semibold ${t.text}`}>{issue.title || issue.rule_id || 'Issue Detected'}</h4>
                                    <p className={`text-sm mt-2 leading-relaxed ${t.desc}`}>{issue.description || issue.message}</p>
                                    {issue.impact && <p className={`text-sm mt-3 font-semibold ${t.badgeText}`}>Impact: {issue.impact}</p>}
                                    {issue.recommendation && <p className={`text-sm mt-3 font-mono ${t.badgeText}`}>&gt; Fix: {issue.recommendation}</p>}
                                    {issue.line && <p className={`text-xs mt-3 font-mono bg-black/40 inline-block px-2 py-1 rounded ${t.badgeText}`}>Line: {issue.line}</p>}
                                </div>
                                <span className={`px-3 py-1 rounded-lg ${t.badgeBg} ${t.badgeText} text-xs font-bold uppercase tracking-wider shrink-0`}>
                                    {issue.severity || 'info'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030712] font-sans flex items-center justify-center text-cyan-400">
                <Loader2 className="animate-spin" size={40} />
            </div>
        );
    }

    if (error || !review) {
        return (
            <div className="min-h-screen bg-[#030712] font-sans pb-20 text-white">
                <main className="max-w-4xl mx-auto px-6 py-12">
                    <Link to="/history" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8">
                        <ArrowLeft size={16} /> Back to History
                    </Link>
                    <div className="p-6 bg-fuchsia-500/10 text-fuchsia-400 rounded-2xl border border-fuchsia-500/30 flex items-center gap-3">
                        <AlertTriangle size={20} /> {error || "Review data is not available."}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030712] font-sans pb-20 text-white relative overflow-hidden">
            {/* Cyber Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
                <div className="absolute top-0 right-1/4 h-100 w-100 rounded-full bg-violet-600/10 blur-[120px]" />
            </div>

            <main className="max-w-5xl mx-auto px-6 py-12 relative z-10">
                <Link to="/history" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-cyan-400 mb-8 transition-colors bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800">
                    <ArrowLeft size={16} /> Back to Archive
                </Link>

                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Header */}
                    <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-slate-800 pb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                <Code2 className="text-cyan-400" size={32} />
                                <span className="break-all">{review.filename}</span>
                            </h2>
                            <p className="text-slate-500 font-mono mt-2 text-sm flex items-center gap-2">
                                <Calendar size={14} /> Scan ID: #{review.id} // {new Date(review.created_at).toLocaleString()}
                            </p>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">Quality Index</p>
                            <p className={`text-5xl font-extrabold font-mono ${getScoreColor(review.score)}`}>
                                {review.score}%
                            </p>
                        </div>
                    </header>

                    {/* AI Summary */}
                    <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm flex gap-6">
                        <div className="rounded-xl bg-violet-500/10 p-4 text-violet-400 shrink-0 h-fit">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-2">AI Summary</h3>
                            <p className="text-slate-300 leading-relaxed">{getSummaryText()}</p>
                        </div>
                    </div>

                    {/* ================================================= */}
                    {/* CODE METRICS GRID                                 */}
                    {/* ================================================= */}
                    <section className="mb-8">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <BarChart3 size={21} className="text-cyan-400" />
                                    Code Metrics
                                </h2>
                                <p className="text-xs text-slate-500 font-mono mt-1">
                                    Structural analysis of the uploaded Python source
                                </p>
                            </div>
                            <span className="hidden sm:block text-[10px] font-mono uppercase tracking-widest text-slate-600">
                                AST ANALYSIS
                            </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                            <MetricCard label="Functions" value={metrics.functions} icon={Code2} color="bg-cyan-500/10 text-cyan-400" />
                            <MetricCard label="Classes" value={metrics.classes} icon={Boxes} color="bg-violet-500/10 text-violet-400" />
                            <MetricCard label="Imports" value={metrics.imports} icon={FileInput} color="bg-blue-500/10 text-blue-400" />
                            <MetricCard label="Loops" value={metrics.loops} icon={Repeat2} color="bg-amber-500/10 text-amber-400" />
                            <MetricCard label="Conditions" value={metrics.conditions} icon={ListChecks} color="bg-emerald-500/10 text-emerald-400" />
                            <MetricCard label="Max Nesting" value={metrics.max_nesting} icon={Layers} color="bg-fuchsia-500/10 text-fuchsia-400" />
                            <MetricCard label="Complexity" value={metrics.complexity} icon={GitBranch} color="bg-orange-500/10 text-orange-400" />
                        </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Issue Breakdown */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
                            <h3 className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-6">Severity Matrix</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 rounded-xl bg-fuchsia-500/5 border border-fuchsia-500/10">
                                    <div className="flex items-center gap-3 text-fuchsia-400 font-medium"><ShieldAlert size={18}/> High Risk</div>
                                    <span className="font-mono text-lg text-white">{severityTotals.high}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                    <div className="flex items-center gap-3 text-amber-400 font-medium"><AlertTriangle size={18}/> Medium Risk</div>
                                    <span className="font-mono text-lg text-white">{severityTotals.medium}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                                    <div className="flex items-center gap-3 text-cyan-400 font-medium"><CheckCircle size={18}/> Low Risk</div>
                                    <span className="font-mono text-lg text-white">{severityTotals.low}</span>
                                </div>
                            </div>
                        </div>

                        {/* Radar Chart */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm flex flex-col">
                            <h3 className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-2">Detection Vectors</h3>
                            <div className="flex-1 min-h-60">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                        <PolarGrid stroke="#1e293b" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                                        <Radar name="Count" dataKey="value" stroke="#22d3ee" strokeWidth={2} fill="#22d3ee" fillOpacity={0.2} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Findings */}
                    <div className="mt-12 border-t border-slate-800/60 pt-8">
                        <div className="flex items-center gap-3 mb-8">
                            <Activity size={24} className="text-cyan-400" />
                            <div>
                                <h2 className="text-2xl font-bold text-white">Detailed Findings</h2>
                                <p className="text-xs text-slate-500 font-mono mt-1">AI and static analysis results</p>
                            </div>
                        </div>
                        
                        <CyberIssueList title="AI Security Analysis" icon={ShieldAlert} issues={review.ai_review?.security} themeColor="fuchsia" />
                        <CyberIssueList title="AI Bug Detection" icon={Bug} issues={review.ai_review?.bugs} themeColor="amber" />
                        <CyberIssueList title="Code Quality (AI)" icon={Activity} issues={review.ai_review?.quality} themeColor="cyan" />
                        <CyberIssueList title="Performance Analysis (AI)" icon={Gauge} issues={review.ai_review?.performance} themeColor="violet" />
                        <CyberIssueList title="Static Analysis Rules" icon={FileCode2} issues={review.issues} themeColor="slate" />

                        {/* Success Fallback */}
                        {(!review.ai_review?.security?.length && !review.ai_review?.bugs?.length && !review.ai_review?.quality?.length && !review.issues?.length) && (
                            <div className="p-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center mb-8">
                                <CheckCircle className="mx-auto text-emerald-500 mb-3" size={32} />
                                <p className="text-slate-300 font-medium">No issues detected in the codebase.</p>
                                <p className="text-xs text-slate-500 font-mono mt-2">The analyzed source passed the available security and quality checks.</p>
                            </div>
                        )}

                        {/* Recommendations Block */}
                        {Array.isArray(review.ai_review?.recommendations) && review.ai_review.recommendations.length > 0 && (
                            <div className="p-6 rounded-2xl border border-amber-500/20 bg-linear-to-br from-amber-500/10 to-transparent">
                                <h3 className="text-lg font-semibold text-amber-100 mb-4 flex items-center gap-2">
                                    <Lightbulb size={20} className="text-amber-400" /> General Recommendations
                                </h3>
                                <ul className="list-disc pl-5 space-y-3 text-amber-200/80 text-sm">
                                    {review.ai_review.recommendations.map((rec, index) => (
                                        <li key={index} className="leading-relaxed">{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}