export default function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#logo-bg)" />
      <g transform="translate(128, 110)">
        <line x1="0" y1="30" x2="200" y2="30" stroke="white" strokeWidth="30" strokeLinecap="round" />
        <line x1="0" y1="95" x2="200" y2="95" stroke="white" strokeWidth="30" strokeLinecap="round" />
        <path d="M60 30 C110 30, 145 55, 145 95 C145 140, 110 170, 60 170" stroke="white" strokeWidth="30" strokeLinecap="round" fill="none" />
        <line x1="20" y1="280" x2="145" y2="130" stroke="white" strokeWidth="30" strokeLinecap="round" />
      </g>
    </svg>
  );
}
