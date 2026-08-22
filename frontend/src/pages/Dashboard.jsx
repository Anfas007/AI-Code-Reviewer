import { useState, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../services/client';
import Logo from '../components/Logo';

import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer
} from 'recharts';

import {
    ShieldAlert,
    Code2,
    AlertTriangle,
    CheckCircle,
    Bug,
    RefreshCw,
    Sparkles,
    BrainCircuit,
    Terminal,
    FileUp,
    ArrowRight,
    MessageSquareCode,
    Plus,
    PanelLeftClose,
    PanelLeftOpen,
    Activity,
    Gauge,
    FileCode2,
    Lightbulb,
    LogOut,
    BarChart3,
    Layers,
    GitBranch,
    Repeat2,
    ListChecks,
    Boxes,
    FileInput
} from 'lucide-react';

export default function Dashboard() {
    const [history, setHistory] = useState([]);
    const [activeReview, setActiveReview] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const fileInputRef = useRef(null);

    const { logout } = useContext(AuthContext);

    /* =========================================================
       SAFE ERROR MESSAGE
    ========================================================= */

    const getErrorMessage = (
        err,
        fallback = 'Something went wrong.'
    ) => {
        const detail = err?.response?.data?.detail;

        if (typeof detail === 'string' && detail.trim()) {
            return detail;
        }

        if (Array.isArray(detail)) {
            const messages = detail
                .map((item) => {
                    if (typeof item === 'string') {
                        return item;
                    }

                    if (item?.msg) {
                        return item.msg;
                    }

                    if (item?.message) {
                        return item.message;
                    }

                    return null;
                })
                .filter(Boolean);

            if (messages.length > 0) {
                return messages.join(' ');
            }
        }

        if (detail && typeof detail === 'object') {
            if (detail.message) {
                return String(detail.message);
            }

            if (detail.error) {
                if (typeof detail.error === 'string') {
                    return detail.error;
                }

                if (detail.error?.message) {
                    return String(detail.error.message);
                }
            }

            if (detail.msg) {
                return String(detail.msg);
            }

            if (
                detail.type ||
                detail.line ||
                detail.column ||
                detail.offset
            ) {
                const parts = [];

                if (detail.type) {
                    parts.push(String(detail.type));
                }

                if (detail.message) {
                    parts.push(String(detail.message));
                }

                if (detail.line) {
                    parts.push(`Line ${detail.line}`);
                }

                if (detail.column) {
                    parts.push(`Column ${detail.column}`);
                }

                if (detail.offset) {
                    parts.push(`Column ${detail.offset}`);
                }

                if (parts.length > 0) {
                    return parts.join(' — ');
                }
            }

            try {
                return JSON.stringify(detail);
            } catch {
                return fallback;
            }
        }

        if (err?.message) {
            return String(err.message);
        }

        return fallback;
    };

    /* =========================================================
       SAFE JSON PARSER
    ========================================================= */

    const safeParse = (value, fallback) => {
        if (value === null || value === undefined) {
            return fallback;
        }

        if (typeof value !== 'string') {
            return value;
        }

        let parsed = value;

        /*
         * Supports both:
         *
         * JSONB response:
         * {
         *   "high": 2
         * }
         *
         * Legacy stringified JSON:
         * "{\"high\": 2}"
         */

        for (let i = 0; i < 2; i += 1) {
            if (typeof parsed !== 'string') {
                break;
            }

            try {
                parsed = JSON.parse(parsed);
            } catch {
                return fallback;
            }
        }

        return parsed;
    };

    /* =========================================================
       SAFE ARRAY
    ========================================================= */

    const safeArray = (value) => {
        const parsed = safeParse(value, []);

        return Array.isArray(parsed)
            ? parsed
            : [];
    };

    /* =========================================================
       SAFE OBJECT
    ========================================================= */

    const safeObject = (value) => {
        const parsed = safeParse(value, {});

        if (
            parsed &&
            typeof parsed === 'object' &&
            !Array.isArray(parsed)
        ) {
            return parsed;
        }

        return {};
    };

    /* =========================================================
       FETCH HISTORY
    ========================================================= */

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await apiClient.get(
                '/review/history',
                {
                    params: {
                        page: 1,
                        limit: 10
                    }
                }
            );

            const reviews = Array.isArray(
                response.data?.reviews
            )
                ? response.data.reviews
                : [];

            setHistory(reviews);
        } catch (err) {
            console.error(
                'Failed to load history:',
                err
            );

            setError(
                getErrorMessage(
                    err,
                    'Failed to load review history.'
                )
            );
        }
    };

    /* =========================================================
       FILE INPUT RESET
    ========================================================= */

    const resetFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    /* =========================================================
       HANDLE SYNTAX ERROR
    ========================================================= */

    const handleSyntaxErrorResponse = (data) => {
        const syntaxError = data?.error || {};

        const parts = [];

        if (syntaxError.type) {
            parts.push(String(syntaxError.type));
        }

        if (syntaxError.message) {
            parts.push(String(syntaxError.message));
        }

        if (syntaxError.line) {
            parts.push(`Line ${syntaxError.line}`);
        }

        if (syntaxError.offset) {
            parts.push(`Column ${syntaxError.offset}`);
        }

        if (syntaxError.text) {
            parts.push(`Code: ${String(syntaxError.text).trim()}`);
        }

        setError(
            parts.length > 0
                ? parts.join(' — ')
                : 'The uploaded Python file contains a syntax error.'
        );
    };

    /* =========================================================
       FILE UPLOAD
    ========================================================= */

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setError(null);
        setActiveReview(null);

        /* -----------------------------------------------------
           Validate extension
        ----------------------------------------------------- */

        if (
            !file.name
                .toLowerCase()
                .endsWith('.py')
        ) {
            setError(
                'Please upload a valid Python (.py) file.'
            );

            resetFileInput();
            return;
        }

        /* -----------------------------------------------------
           Validate empty file
        ----------------------------------------------------- */

        if (file.size === 0) {
            setError(
                'Uploaded file is empty. Please select a Python file containing code.'
            );

            resetFileInput();
            return;
        }

        /* -----------------------------------------------------
           Validate file size
        ----------------------------------------------------- */

        if (file.size > 1024 * 1024) {
            setError(
                'File size must be less than or equal to 1 MB.'
            );

            resetFileInput();
            return;
        }

        setIsAnalyzing(true);

        const formData = new FormData();

        formData.append(
            'file',
            file
        );

        try {
            const response = await apiClient.post(
                '/review/file',
                formData
            );

            const data = response.data || {};

            /* -------------------------------------------------
               Backend returned syntax error
            ------------------------------------------------- */

            if (data.valid === false) {
                handleSyntaxErrorResponse(data);
                return;
            }

            /* -------------------------------------------------
               Backend must return review_id for successful review
            ------------------------------------------------- */

            const reviewId = data.review_id;

            if (!reviewId) {
                throw new Error(
                    'The server did not return a review ID.'
                );
            }

            /* -------------------------------------------------
               Add temporary history item
            ------------------------------------------------- */

            const newScan = {
                id: reviewId,

                filename:
                    data.filename ||
                    file.name,

                language:
                    data.language ||
                    'python',

                score:
                    Number(data.score) || 0,

                created_at:
                    data.created_at ||
                    new Date().toISOString()
            };

            setHistory((previousHistory) => {
                const filteredHistory =
                    previousHistory.filter(
                        (scan) =>
                            scan.id !== reviewId
                    );

                return [
                    newScan,
                    ...filteredHistory
                ].slice(0, 10);
            });

            /* -------------------------------------------------
               Load complete review
            ------------------------------------------------- */

            await loadReviewDetails(reviewId);

            /* -------------------------------------------------
               Refresh history from backend
            ------------------------------------------------- */

            await fetchHistory();

        } catch (err) {
            console.error(
                'Upload failed:',
                err
            );

            setActiveReview(null);

            setError(
                getErrorMessage(
                    err,
                    'Analysis failed. Please try again.'
                )
            );

        } finally {
            setIsAnalyzing(false);
            resetFileInput();
        }
    };

    /* =========================================================
       LOAD REVIEW DETAILS
    ========================================================= */

    const loadReviewDetails = async (id) => {
        if (!id) {
            setError(
                'Invalid review ID.'
            );

            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const response = await apiClient.get(
                `/review/${id}`
            );

            const rawData =
                response.data || {};

            /* -------------------------------------------------
               Normalize backend response
            ------------------------------------------------- */

            const reviewData = {
                ...rawData,

                score:
                    Number(rawData.score) || 0,

                metrics: safeObject(
                    rawData.metrics
                ),

                issues: safeArray(
                    rawData.issues
                ),

                summary: safeObject(
                    rawData.summary
                ),

                ai_review: safeObject(
                    rawData.ai_review
                )
            };

            setActiveReview(
                reviewData
            );

            if (
                typeof window !== 'undefined' &&
                window.innerWidth < 1024
            ) {
                setIsSidebarOpen(false);
            }

        } catch (err) {
            console.error(
                'Failed to load review:',
                err
            );

            setActiveReview(null);

            setError(
                getErrorMessage(
                    err,
                    'Failed to load review details.'
                )
            );

        } finally {
            setIsAnalyzing(false);
        }
    };

    /* =========================================================
       RESET WORKSPACE
    ========================================================= */

    const resetWorkspace = () => {
        setActiveReview(null);
        setError(null);
        setIsAnalyzing(false);
        setIsSidebarOpen(true);

        resetFileInput();
    };

    /* =========================================================
       DATE FORMAT
    ========================================================= */

    const formatDate = (date) => {
        if (!date) {
            return '';
        }

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return '';
        }

        return parsedDate.toLocaleDateString(
            undefined,
            {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }
        );
    };

    /* =========================================================
       SCORE COLOR
    ========================================================= */

    const getScoreColor = (score) => {
        const numericScore =
            Number(score) || 0;

        if (numericScore >= 80) {
            return 'text-cyan-400';
        }

        if (numericScore >= 60) {
            return 'text-blue-400';
        }

        if (numericScore >= 40) {
            return 'text-violet-400';
        }

        return 'text-fuchsia-500';
    };

    /* =========================================================
       SUMMARY
    ========================================================= */

    const getSummaryText = () => {
        if (!activeReview) {
            return '';
        }

        const aiReview =
            safeObject(
                activeReview.ai_review
            );

        const summary =
            safeObject(
                activeReview.summary
            );

        if (
            typeof aiReview.summary ===
            'string'
        ) {
            return aiReview.summary;
        }

        if (
            typeof activeReview.summary ===
            'string'
        ) {
            return activeReview.summary;
        }

        if (
            typeof summary.text ===
            'string'
        ) {
            return summary.text;
        }

        if (
            typeof summary.message ===
            'string'
        ) {
            return summary.message;
        }

        if (
            typeof summary.summary ===
            'string'
        ) {
            return summary.summary;
        }

        return 'Scan complete. Review the issues below.';
    };

    /* =========================================================
       CODE METRICS
    ========================================================= */

    const getCodeMetrics = () => {
        if (!activeReview) {
            return {
                functions: 0,
                classes: 0,
                imports: 0,
                loops: 0,
                conditions: 0,
                max_nesting: 0,
                complexity: 0
            };
        }

        const metrics =
            safeObject(
                activeReview.metrics
            );

        const functionComplexity =
            safeObject(
                metrics.function_complexity
            );

        const complexityValues = Object.values(
            functionComplexity
        )
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value));

        return {
            functions:
                Number(
                    metrics.functions ??
                    metrics.function_count ??
                    metrics.total_functions ??
                    0
                ) || 0,

            classes:
                Number(
                    metrics.classes ??
                    metrics.class_count ??
                    metrics.total_classes ??
                    0
                ) || 0,

            imports:
                Number(
                    metrics.imports ??
                    metrics.import_count ??
                    metrics.total_imports ??
                    0
                ) || 0,

            loops:
                Number(
                    metrics.loops ??
                    metrics.loop_count ??
                    metrics.total_loops ??
                    0
                ) || 0,

            conditions:
                Number(
                    metrics.conditions ??
                    metrics.condition_count ??
                    metrics.total_conditions ??
                    0
                ) || 0,

            max_nesting:
                Number(
                    metrics.max_nesting ??
                    metrics.maximum_nesting ??
                    metrics.max_depth ??
                    0
                ) || 0,

            complexity:
                complexityValues.length > 0
                    ? Math.max(...complexityValues)
                    : Number(
                          metrics.complexity ??
                          metrics.cyclomatic_complexity ??
                          0
                      ) || 0
        };
    };

    const metrics =
        getCodeMetrics();

    /* =========================================================
       AI ISSUE GROUPS
    ========================================================= */

    const aiReview =
        safeObject(
            activeReview?.ai_review
        );

    const securityIssues =
        safeArray(
            aiReview.security
        );

    const bugIssues =
        safeArray(
            aiReview.bugs
        );

    const qualityIssues =
        safeArray(
            aiReview.quality
        );

    const performanceIssues =
        safeArray(
            aiReview.performance
        );

    const staticIssues =
        safeArray(
            activeReview?.issues
        );

    const staticSecurityCount = staticIssues.filter(
        (issue) => {
            const category = String(
                issue?.category || ''
            ).toLowerCase();

            return category.includes('security');
        }
    ).length;

    const staticBugCount = staticIssues.filter(
        (issue) => {
            const category = String(
                issue?.category || ''
            ).toLowerCase();

            return category === 'bug';
        }
    ).length;

    const staticQualityCount = staticIssues.filter(
        (issue) => {
            const category = String(
                issue?.category || ''
            ).toLowerCase();

            return (
                category === 'best-practice' ||
                category === 'maintainability'
            );
        }
    ).length;

    const staticPerformanceCount = staticIssues.filter(
        (issue) => {
            const category = String(
                issue?.category || ''
            ).toLowerCase();

            return category === 'performance';
        }
    ).length;

    const totalSecurityIssues =
        securityIssues.length + staticSecurityCount;

    const totalBugIssues =
        bugIssues.length + staticBugCount;

    const totalQualityIssues =
        qualityIssues.length + staticQualityCount;

    const totalPerformanceIssues =
        performanceIssues.length + staticPerformanceCount;

    /* =========================================================
       RADAR DATA
    ========================================================= */

    const radarData = activeReview
        ? [
              {
                  subject: 'Security',
                  value: Math.min(
                      totalSecurityIssues,
                      5
                  ),
                  fullMark: 5
              },
              {
                  subject: 'Quality',
                  value: Math.min(
                      totalQualityIssues,
                      5
                  ),
                  fullMark: 5
              },
              {
                  subject: 'Bugs',
                  value: Math.min(
                      totalBugIssues,
                      5
                  ),
                  fullMark: 5
              },
              {
                  subject: 'Performance',
                  value: Math.min(
                      totalPerformanceIssues,
                      5
                  ),
                  fullMark: 5
              }
          ]
        : [];

    /* =========================================================
       CYBER ISSUE LIST
    ========================================================= */

    const CyberIssueList = ({
        title,
        icon: Icon,
        issues,
        themeColor
    }) => {
        if (
            !Array.isArray(issues) ||
            issues.length === 0
        ) {
            return null;
        }

        const themes = {
            fuchsia: {
                bg: 'bg-fuchsia-500/5',
                border: 'border-fuchsia-500/20',
                hover: 'hover:bg-fuchsia-500/10',
                text: 'text-fuchsia-100',
                desc: 'text-fuchsia-200/70',
                badgeBg: 'bg-fuchsia-500/20',
                badgeText: 'text-fuchsia-300',
                icon: 'text-fuchsia-400'
            },

            amber: {
                bg: 'bg-amber-500/5',
                border: 'border-amber-500/20',
                hover: 'hover:bg-amber-500/10',
                text: 'text-amber-100',
                desc: 'text-amber-200/70',
                badgeBg: 'bg-amber-500/20',
                badgeText: 'text-amber-300',
                icon: 'text-amber-400'
            },

            cyan: {
                bg: 'bg-cyan-500/5',
                border: 'border-cyan-500/20',
                hover: 'hover:bg-cyan-500/10',
                text: 'text-cyan-100',
                desc: 'text-cyan-200/70',
                badgeBg: 'bg-cyan-500/20',
                badgeText: 'text-cyan-300',
                icon: 'text-cyan-400'
            },

            violet: {
                bg: 'bg-violet-500/5',
                border: 'border-violet-500/20',
                hover: 'hover:bg-violet-500/10',
                text: 'text-violet-100',
                desc: 'text-violet-200/70',
                badgeBg: 'bg-violet-500/20',
                badgeText: 'text-violet-300',
                icon: 'text-violet-400'
            },

            slate: {
                bg: 'bg-slate-500/5',
                border: 'border-slate-500/20',
                hover: 'hover:bg-slate-500/10',
                text: 'text-slate-100',
                desc: 'text-slate-400',
                badgeBg: 'bg-slate-500/20',
                badgeText: 'text-slate-300',
                icon: 'text-slate-400'
            }
        };

        const t =
            themes[themeColor] ||
            themes.slate;

        return (
            <div className="mb-8">
                <h3
                    className={`text-sm font-mono uppercase tracking-widest ${t.badgeText} mb-4 flex items-center gap-2`}
                >
                    <Icon
                        size={16}
                        className={t.icon}
                    />

                    {title}
                </h3>

                <div className="space-y-4">
                    {issues.map(
                        (issue, idx) => {
                            const safeIssue =
                                issue &&
                                typeof issue ===
                                    'object'
                                    ? issue
                                    : {
                                          message:
                                              String(
                                                  issue
                                              )
                                      };

                            const issueTitle =
                                safeIssue.title ||
                                safeIssue.rule_id ||
                                safeIssue.id ||
                                'Issue Detected';

                            const description =
                                safeIssue.description ||
                                safeIssue.message ||
                                '';

                            return (
                                <div
                                    key={
                                        safeIssue.id ||
                                        safeIssue.rule_id ||
                                        idx
                                    }
                                    className={`p-5 rounded-2xl border ${t.border} ${t.bg} transition-all ${t.hover}`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h4
                                                className={`font-semibold ${t.text}`}
                                            >
                                                {String(
                                                    issueTitle
                                                )}
                                            </h4>

                                            {description && (
                                                <p
                                                    className={`text-sm mt-2 leading-relaxed ${t.desc}`}
                                                >
                                                    {String(
                                                        description
                                                    )}
                                                </p>
                                            )}

                                            {safeIssue.impact && (
                                                <p
                                                    className={`text-sm mt-3 font-semibold ${t.badgeText}`}
                                                >
                                                    Impact:{' '}
                                                    {String(
                                                        safeIssue.impact
                                                    )}
                                                </p>
                                            )}

                                            {safeIssue.recommendation && (
                                                <p
                                                    className={`text-sm mt-3 font-mono ${t.badgeText}`}
                                                >
                                                    &gt; Fix:{' '}
                                                    {String(
                                                        safeIssue.recommendation
                                                    )}
                                                </p>
                                            )}

                                            {safeIssue.line !==
                                                undefined &&
                                                safeIssue.line !==
                                                    null && (
                                                    <p
                                                        className={`text-xs mt-3 font-mono bg-black/40 inline-block px-2 py-1 rounded ${t.badgeText}`}
                                                    >
                                                        Line:{' '}
                                                        {String(
                                                            safeIssue.line
                                                        )}
                                                    </p>
                                                )}
                                        </div>

                                        <span
                                            className={`px-3 py-1 rounded-lg ${t.badgeBg} ${t.badgeText} text-xs font-bold uppercase tracking-wider shrink-0`}
                                        >
                                            {String(
                                                safeIssue.severity ||
                                                    'info'
                                            )}
                                        </span>
                                    </div>
                                </div>
                            );
                        }
                    )}
                </div>
            </div>
        );
    };

    /* =========================================================
       METRIC CARD
    ========================================================= */

    const MetricCard = ({
        label,
        value,
        icon: Icon,
        color
    }) => {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm transition-all hover:border-slate-700 hover:bg-slate-900/60">
                <div className="flex items-center justify-between mb-4">
                    <div
                        className={`rounded-xl p-2.5 ${color}`}
                    >
                        <Icon size={18} />
                    </div>

                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-600">
                        METRIC
                    </span>
                </div>

                <p className="text-3xl font-bold font-mono text-white">
                    {value}
                </p>

                <p className="mt-1 text-xs font-mono uppercase tracking-wider text-slate-500">
                    {label}
                </p>
            </div>
        );
    };

    /* =========================================================
       SUMMARY COUNTS
    ========================================================= */

    const allIssues = [
        ...securityIssues,
        ...bugIssues,
        ...qualityIssues,
        ...performanceIssues,
        ...staticIssues
    ];

    const severityTotals = {
        high: 0,
        medium: 0,
        low: 0
    };

    for (const issue of allIssues) {
        const safeIssue =
            issue && typeof issue === 'object'
                ? issue
                : {};

        const severity = String(
            safeIssue.severity || 'low'
        ).toLowerCase();

        if (severity in severityTotals) {
            severityTotals[severity] += 1;
        }
    }

    const fallbackSummary =
        safeObject(
            activeReview?.summary
        );

    const highRisk =
        allIssues.length > 0
            ? severityTotals.high
            : Number(fallbackSummary.high) || 0;

    const mediumRisk =
        allIssues.length > 0
            ? severityTotals.medium
            : Number(fallbackSummary.medium) || 0;

    const lowRisk =
        allIssues.length > 0
            ? severityTotals.low
            : Number(fallbackSummary.low) || 0;

    /* =========================================================
       RECOMMENDATIONS
    ========================================================= */

    const recommendations =
        safeArray(
            aiReview.recommendations
        );

    /* =========================================================
       NO ISSUES
    ========================================================= */

    const hasIssues =
        securityIssues.length > 0 ||
        bugIssues.length > 0 ||
        qualityIssues.length > 0 ||
        performanceIssues.length > 0 ||
        staticIssues.length > 0;

    /* =========================================================
       RENDER
    ========================================================= */

    return (
        <div className="flex flex-col h-screen bg-[#030712] font-sans text-white overflow-hidden">
            <div className="flex flex-1 overflow-hidden relative">

                {/* =====================================================
                    BACKGROUND
                ===================================================== */}

                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />

                    <div className="absolute top-1/4 left-1/4 h-125 w-125 rounded-full bg-cyan-600/10 blur-[120px]" />

                    <div className="absolute bottom-1/4 right-1/4 h-100 w-100 rounded-full bg-violet-600/10 blur-[120px]" />
                </div>

                {/* =====================================================
                    SIDEBAR
                ===================================================== */}

                <aside
                    className={`transition-all duration-300 ease-in-out flex flex-col z-20 border-slate-800 bg-slate-950/40 backdrop-blur-2xl shadow-2xl ${
                        isSidebarOpen
                            ? 'w-72 border-r opacity-100'
                            : 'w-0 opacity-0 overflow-hidden border-r-0'
                    }`}
                >
                    <div className="p-4 border-b border-slate-800/60 w-72 shrink-0">
                        <button
                            onClick={resetWorkspace}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-4 py-3 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500/20"
                        >
                            <Plus size={18} />

                            Analyze New File
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1 w-72">
                        <div className="flex items-center justify-between px-2 pt-2 pb-2">
                            <p className="text-[11px] font-mono text-slate-500 uppercase tracking-widest font-semibold">
                                Recent Logs
                            </p>
                        </div>

                        {history.length === 0 ? (
                            <div className="px-3 py-8 text-center">
                                <MessageSquareCode
                                    size={24}
                                    className="mx-auto text-slate-700 mb-3"
                                />

                                <p className="text-xs font-mono text-slate-600">
                                    No scans yet
                                </p>
                            </div>
                        ) : (
                            history.map(
                                (scan) => (
                                    <button
                                        key={
                                            scan.id
                                        }
                                        onClick={() =>
                                            loadReviewDetails(
                                                scan.id
                                            )
                                        }
                                        className={`group w-full text-left flex items-center gap-3 rounded-xl p-3 transition-all duration-200 ${
                                            activeReview?.id ===
                                            scan.id
                                                ? 'bg-linear-to-r from-cyan-500/10 to-transparent border-l-2 border-l-cyan-400 text-cyan-50'
                                                : 'hover:bg-white/4 text-slate-400 hover:text-slate-200 border-l-2 border-l-transparent'
                                        }`}
                                    >
                                        <MessageSquareCode
                                            size={16}
                                            className={`shrink-0 ${
                                                activeReview?.id ===
                                                scan.id
                                                    ? 'text-cyan-400'
                                                    : 'text-slate-500'
                                            }`}
                                        />

                                        <div className="flex-1 min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {scan.filename ||
                                                    'Unnamed file'}
                                            </p>

                                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                {formatDate(
                                                    scan.created_at
                                                )}
                                            </p>
                                        </div>

                                        <span
                                            className={`text-xs font-mono font-bold shrink-0 ${getScoreColor(
                                                scan.score
                                            )}`}
                                        >
                                            {Number(
                                                scan.score
                                            ) || 0}
                                        </span>
                                    </button>
                                )
                            )
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-800/60 w-72 shrink-0 bg-slate-950/50">
                        <Link
                            to="/history"
                            className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-mono tracking-wide text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                        >
                            View Full Archive

                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </aside>

                {/* =====================================================
                    MAIN
                ===================================================== */}

                <main className="flex-1 overflow-y-auto relative z-10 flex flex-col">

                    {/* TOP BAR */}

                    <header className="h-17 flex items-center justify-between px-4 shrink-0 mt-2">
                        <div className="flex items-center gap-3 ml-12">
                            <div className="flex items-center gap-3">
                                <Logo size={30} />

                                <div className="flex flex-col">
                                    <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-violet-400 leading-tight">
                                        SYNTAX SENTINEL
                                    </h1>

                                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest leading-none mt-1">
                                        AN AI CODE REVIEWER
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="flex items-center gap-2 h-9 px-4 rounded-full bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-fuchsia-400 hover:border-fuchsia-500/50 transition-all shadow-lg group"
                        >
                            <LogOut
                                size={14}
                                className="group-hover:-translate-x-0.5 transition-transform"
                            />

                            <span className="text-xs font-mono tracking-widest uppercase font-bold">
                                Logout
                            </span>
                        </button>
                    </header>

                    {/* SIDEBAR TOGGLE */}

                    <div className="absolute top-4 left-4 z-20">
                        <button
                            onClick={() =>
                                setIsSidebarOpen(
                                    !isSidebarOpen
                                )
                            }
                            className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 backdrop-blur-md transition-all shadow-sm"
                            title={
                                isSidebarOpen
                                    ? 'Close sidebar'
                                    : 'Open sidebar'
                            }
                        >
                            {isSidebarOpen ? (
                                <PanelLeftClose size={20} />
                            ) : (
                                <PanelLeftOpen size={20} />
                            )}
                        </button>
                    </div>

                    {/* ERROR */}

                    {error && (
                        <div className="mx-6 mt-4 mb-2 flex items-start justify-between gap-4 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-4 shrink-0">
                            <div className="flex items-start gap-3 text-fuchsia-400 min-w-0">
                                <AlertTriangle
                                    size={20}
                                    className="shrink-0 mt-0.5"
                                />

                                <p className="text-sm wrap-break-word">
                                    {String(error)}
                                </p>
                            </div>

                            <button
                                onClick={() =>
                                    setError(null)
                                }
                                className="text-slate-400 hover:text-white shrink-0"
                                title="Dismiss"
                            >
                                <RefreshCw size={15} />
                            </button>
                        </div>
                    )}

                    <div
                        className={`flex-1 flex flex-col p-6 lg:p-10 ${
                            !error
                                ? 'pt-4'
                                : ''
                        }`}
                    >

                        {/* =================================================
                            EMPTY STATE
                        ================================================= */}

                        {!isAnalyzing &&
                            !activeReview && (
                                <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
                                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono text-cyan-400">
                                        <Terminal size={14} />

                                        SYS.ONLINE // AI_READY
                                    </div>

                                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-500 to-violet-600 mb-4 text-center">
                                        Initialize Code Scan
                                    </h1>

                                    <p className="text-slate-400 font-mono text-sm mb-12 text-center">
                                        Upload a Python script to trigger
                                        heuristic and LLM vulnerability
                                        scanning.
                                    </p>

                                    <div className="w-full relative group">
                                        <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-cyan-500 to-violet-500 opacity-20 blur transition duration-500 group-hover:opacity-40" />
                                        <label className="relative flex flex-col items-center justify-center w-full h-64 rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900/60 backdrop-blur-xl cursor-pointer hover:border-cyan-500/50 transition-colors">
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".py"
                                                ref={
                                                    fileInputRef
                                                }
                                                onChange={
                                                    handleFileUpload
                                                }
                                            />

                                            <div className="rounded-full bg-slate-800 p-4 mb-4 text-cyan-400 group-hover:scale-110 transition-transform">
                                                <FileUp size={32} />
                                            </div>

                                            <p className="text-lg font-medium text-slate-200">
                                                Select a file to analyze
                                            </p>

                                            <p className="text-sm text-slate-500 font-mono mt-2">
                                                Only .py files supported
                                                (Max 1MB)
                                            </p>
                                        </label>
                                    </div>
                                </div>
                            )}

                        {/* =================================================
                            LOADING
                        ================================================= */}

                        {isAnalyzing && (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="relative flex items-center justify-center w-32 h-32 mb-8">
                                    <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" />

                                    <div className="absolute inset-2 rounded-full border-r-2 border-violet-500 animate-spin" />

                                    <BrainCircuit
                                        size={40}
                                        className="text-cyan-400 animate-pulse"
                                    />
                                </div>

                                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                                    Processing Neural Scan...
                                </h2>

                                <p className="text-slate-400 font-mono text-sm">
                                    Executing AST heuristics and AI LLM
                                    analysis.
                                </p>
                            </div>
                        )}

                        {/* =================================================
                            REVIEW RESULT
                        ================================================= */}

                        {!isAnalyzing &&
                            activeReview && (
                                <div className="max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

                                    {/* HEADER */}

                                    <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-slate-800 pb-6">
                                        <div>
                                            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                                <Code2
                                                    className="text-cyan-400"
                                                    size={32}
                                                />

                                                <span className="break-all">
                                                    {activeReview.filename ||
                                                        'Python File'}
                                                </span>
                                            </h2>

                                            <p className="text-slate-500 font-mono mt-2 text-sm">
                                                Scan ID: #
                                                {activeReview.id}
                                                {' // '}
                                                {formatDate(
                                                    activeReview.created_at
                                                )}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">
                                                Quality Index
                                            </p>

                                            <p
                                                className={`text-5xl font-extrabold font-mono ${getScoreColor(
                                                    activeReview.score
                                                )}`}
                                            >
                                                {Number(
                                                    activeReview.score
                                                ) || 0}
                                                %
                                            </p>
                                        </div>
                                    </header>

                                    {/* AI SUMMARY */}

                                    <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm flex gap-6">
                                        <div className="rounded-xl bg-violet-500/10 p-4 text-violet-400 shrink-0 h-fit">
                                            <Sparkles size={24} />
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-2">
                                                AI Summary
                                            </h3>

                                            <p className="text-slate-300 leading-relaxed">
                                                {getSummaryText()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* CODE METRICS */}

                                    <section className="mb-8">
                                        <div className="flex items-center justify-between mb-5">
                                            <div>
                                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                                    <BarChart3
                                                        size={21}
                                                        className="text-cyan-400"
                                                    />

                                                    Code Metrics
                                                </h2>

                                                <p className="text-xs text-slate-500 font-mono mt-1">
                                                    Structural analysis of the
                                                    uploaded Python source
                                                </p>
                                            </div>

                                            <span className="hidden sm:block text-[10px] font-mono uppercase tracking-widest text-slate-600">
                                                AST ANALYSIS
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                            <MetricCard
                                                label="Functions"
                                                value={
                                                    metrics.functions
                                                }
                                                icon={Code2}
                                                color="bg-cyan-500/10 text-cyan-400"
                                            />

                                            <MetricCard
                                                label="Classes"
                                                value={
                                                    metrics.classes
                                                }
                                                icon={Boxes}
                                                color="bg-violet-500/10 text-violet-400"
                                            />

                                            <MetricCard
                                                label="Imports"
                                                value={
                                                    metrics.imports
                                                }
                                                icon={FileInput}
                                                color="bg-blue-500/10 text-blue-400"
                                            />

                                            <MetricCard
                                                label="Loops"
                                                value={
                                                    metrics.loops
                                                }
                                                icon={Repeat2}
                                                color="bg-amber-500/10 text-amber-400"
                                            />

                                            <MetricCard
                                                label="Conditions"
                                                value={
                                                    metrics.conditions
                                                }
                                                icon={ListChecks}
                                                color="bg-emerald-500/10 text-emerald-400"
                                            />

                                            <MetricCard
                                                label="Max Nesting"
                                                value={
                                                    metrics.max_nesting
                                                }
                                                icon={Layers}
                                                color="bg-fuchsia-500/10 text-fuchsia-400"
                                            />

                                            <MetricCard
                                                label="Complexity"
                                                value={
                                                    metrics.complexity
                                                }
                                                icon={GitBranch}
                                                color="bg-orange-500/10 text-orange-400"
                                            />
                                        </div>
                                    </section>

                                    {/* SEVERITY + RADAR */}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

                                        {/* Severity */}

                                        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
                                            <h3 className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-6">
                                                Severity Matrix
                                            </h3>

                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center p-3 rounded-xl bg-fuchsia-500/5 border border-fuchsia-500/10">
                                                    <div className="flex items-center gap-3 text-fuchsia-400 font-medium">
                                                        <ShieldAlert size={18} />

                                                        High Risk
                                                    </div>

                                                    <span className="font-mono text-lg text-white">
                                                        {highRisk}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                                    <div className="flex items-center gap-3 text-amber-400 font-medium">
                                                        <AlertTriangle size={18} />

                                                        Medium Risk
                                                    </div>

                                                    <span className="font-mono text-lg text-white">
                                                        {mediumRisk}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                                                    <div className="flex items-center gap-3 text-cyan-400 font-medium">
                                                        <CheckCircle size={18} />

                                                        Low Risk
                                                    </div>

                                                    <span className="font-mono text-lg text-white">
                                                        {lowRisk}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Radar */}

                                        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm flex flex-col">
                                            <h3 className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-2">
                                                Detection Vectors
                                            </h3>

                                            <div className="flex-1 min-h-60">
                                                <ResponsiveContainer
                                                    width="100%"
                                                    height="100%"
                                                >
                                                    <RadarChart
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius="70%"
                                                        data={
                                                            radarData
                                                        }
                                                    >
                                                        <PolarGrid
                                                            stroke="#1e293b"
                                                        />

                                                        <PolarAngleAxis
                                                            dataKey="subject"
                                                            tick={{
                                                                fill: '#94a3b8',
                                                                fontSize: 12
                                                            }}
                                                        />

                                                        <PolarRadiusAxis
                                                            angle={30}
                                                            domain={[
                                                                0,
                                                                5
                                                            ]}
                                                            tick={false}
                                                            axisLine={false}
                                                        />

                                                        <Radar
                                                            name="Count"
                                                            dataKey="value"
                                                            stroke="#22d3ee"
                                                            strokeWidth={2}
                                                            fill="#22d3ee"
                                                            fillOpacity={0.2}
                                                        />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>

                                    {/* DETAILED FINDINGS */}

                                    <div className="mt-12 border-t border-slate-800/60 pt-8">
                                        <div className="flex items-center gap-3 mb-8">
                                            <Activity
                                                size={24}
                                                className="text-cyan-400"
                                            />

                                            <div>
                                                <h2 className="text-2xl font-bold text-white">
                                                    Detailed Findings
                                                </h2>

                                                <p className="text-xs text-slate-500 font-mono mt-1">
                                                    AI and static analysis
                                                    results
                                                </p>
                                            </div>
                                        </div>

                                        <CyberIssueList
                                            title="AI Security Analysis"
                                            icon={ShieldAlert}
                                            issues={
                                                securityIssues
                                            }
                                            themeColor="fuchsia"
                                        />

                                        <CyberIssueList
                                            title="AI Bug Detection"
                                            icon={Bug}
                                            issues={
                                                bugIssues
                                            }
                                            themeColor="amber"
                                        />

                                        <CyberIssueList
                                            title="Code Quality (AI)"
                                            icon={Activity}
                                            issues={
                                                qualityIssues
                                            }
                                            themeColor="cyan"
                                        />

                                        <CyberIssueList
                                            title="Performance Analysis (AI)"
                                            icon={Gauge}
                                            issues={
                                                performanceIssues
                                            }
                                            themeColor="violet"
                                        />

                                        <CyberIssueList
                                            title="Static Analysis Rules"
                                            icon={FileCode2}
                                            issues={
                                                staticIssues
                                            }
                                            themeColor="slate"
                                        />

                                        {!hasIssues && (
                                            <div className="p-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center mb-8">
                                                <CheckCircle
                                                    className="mx-auto text-emerald-500 mb-3"
                                                    size={32}
                                                />

                                                <p className="text-slate-300 font-medium">
                                                    No issues detected in
                                                    the codebase.
                                                </p>

                                                <p className="text-xs text-slate-500 font-mono mt-2">
                                                    The analyzed source
                                                    passed the available
                                                    security and quality
                                                    checks.
                                                </p>
                                            </div>
                                        )}

                                        {/* RECOMMENDATIONS */}

                                        {recommendations.length >
                                            0 && (
                                            <div className="p-6 rounded-2xl border border-amber-500/20 bg-linear-to-br from-amber-500/10 to-transparent">
                                                <h3 className="text-lg font-semibold text-amber-100 mb-4 flex items-center gap-2">
                                                    <Lightbulb
                                                        size={20}
                                                        className="text-amber-400"
                                                    />

                                                    General Recommendations
                                                </h3>

                                                <ul className="list-disc pl-5 space-y-3 text-amber-200/80 text-sm">
                                                    {recommendations.map(
                                                        (
                                                            rec,
                                                            index
                                                        ) => (
                                                            <li
                                                                key={
                                                                    index
                                                                }
                                                                className="leading-relaxed"
                                                            >
                                                                {typeof rec ===
                                                                'string'
                                                                    ? rec
                                                                    : rec?.text ||
                                                                      rec?.message ||
                                                                      JSON.stringify(
                                                                          rec
                                                                      )}
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                    </div>
                </main>
            </div>
        </div>
    );
}