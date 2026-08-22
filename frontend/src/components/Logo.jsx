export default function Logo({ size = 32, className = "" }) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 32 32" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Outer Glowing Hexagon / Shield Backdrop */}
            <path 
                d="M16 2L28 8V16C28 22.6 22.8 28.4 16 30C9.2 28.4 4 22.6 4 16V8L16 2Z" 
                fill="url(#paint0_linear)" 
                fillOpacity="0.15" 
                stroke="url(#paint1_linear)" 
                strokeWidth="2"
            />
            
            {/* Inner Cyber Brackets & Check / Sentinel Core */}
            <path 
                d="M11 12L7 16L11 20" 
                stroke="#22d3ee" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            />
            <path 
                d="M21 12L25 16L21 20" 
                stroke="#a78bfa" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            />
            <path 
                d="M18 10L14 22" 
                stroke="#38bdf8" 
                strokeWidth="2" 
                strokeLinecap="round"
            />

            {/* Gradient Definitions */}
            <defs>
                <linearGradient id="paint0_linear" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#22d3ee" />
                    <stop offset="1" stopColor="#a78bfa" />
                </linearGradient>
                <linearGradient id="paint1_linear" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#22d3ee" />
                    <stop offset="1" stopColor="#a78bfa" stopOpacity="0.5" />
                </linearGradient>
            </defs>
        </svg>
    );
}