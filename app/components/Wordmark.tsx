function XMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path d="M4 6L20 18" stroke="#FFB020" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M20 6L4 18" stroke="#7C5CFC" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M16 3.5L20 6L16 8.5" stroke="#FFB020" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M8 15.5L4 18L8 20.5" stroke="#7C5CFC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export default function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center font-[var(--font-display)] font-bold text-[#EDEFF2] leading-none"
      style={{ fontSize: size }}
    >
      Asset
      <span className="inline-flex items-center mx-[1px]" style={{ transform: `translateY(${size * 0.02}px)` }}>
        <XMark size={size * 0.62} />
      </span>
      tack
    </span>
  );
}