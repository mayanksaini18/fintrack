export default function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 158 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* wallet body */}
      <rect x="0" y="0" width="158" height="112" rx="20" fill="#0ea5e9" />
      {/* top flap */}
      <rect x="0" y="0" width="158" height="40" rx="20" fill="#0284c7" />
      <rect x="0" y="26" width="158" height="14" fill="#0284c7" />
      {/* card strip detail */}
      <rect x="18" y="12" width="72" height="18" rx="6" fill="#fff" fillOpacity="0.18" />
      {/* card chip */}
      <rect x="22" y="16" width="14" height="10" rx="3" fill="#fff" fillOpacity="0.35" />
      {/* magnetic stripe */}
      <line x1="22" y1="38" x2="140" y2="38" stroke="#0369a1" strokeWidth="8" />
      {/* coin pocket outer */}
      <circle cx="118" cy="80" r="30" fill="#0284c7" />
      {/* coin pocket inner */}
      <circle cx="118" cy="80" r="22" fill="#0369a1" />
      {/* ₹ symbol */}
      <text
        x="118"
        y="88"
        fontFamily="system-ui,sans-serif"
        fontSize="26"
        fontWeight="800"
        fill="#f59e0b"
        textAnchor="middle"
      >
        ₹
      </text>
      {/* shine lines */}
      <line x1="18" y1="62" x2="72" y2="62" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.25" />
      <line x1="18" y1="74" x2="54" y2="74" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.15" />
    </svg>
  );
}
