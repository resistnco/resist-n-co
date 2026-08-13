export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      aria-label="Resist N Co"
    >
      {/* Raised fist inside a circle */}
      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" />
      {/* Fist shape */}
      <path
        d="M14 28 L14 20 Q14 16 17 16 L17 13 Q17 11 19 11 Q21 11 21 13 L21 16 L23 16 Q25 16 25 18 L25 13 Q25 11 27 11 Q29 11 29 13 L29 20 Q29 24 26 26 L26 28 Z"
        fill="currentColor"
      />
      {/* Forearm */}
      <rect x="16" y="28" width="11" height="5" rx="1" fill="currentColor" />
    </svg>
  );
}

export function SunIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

export function MoonIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function CartIcon({ className = "w-5 h-5", count }: { className?: string; count?: number }) {
  return (
    <div className="relative">
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count && count > 0 && (
        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {count}
        </span>
      )}
    </div>
  );
}
