import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function DatashakeLogo({ className, size = "md", showText = false }: LogoProps) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("relative shrink-0 rounded-xl overflow-hidden", sizes[size])}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <defs>
            <linearGradient id="ds-grad" x1="20" y1="90" x2="60" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00D4FF"/>
              <stop offset="100%" stopColor="#1B35C4"/>
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="20" fill="white"/>
          <path d="M35 20v60" stroke="url(#ds-grad)" strokeWidth="14" strokeLinecap="round"/>
          <path d="M35 28h12c11 0 20 9 20 20s-9 20-20 20H35" stroke="url(#ds-grad)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <circle cx="35" cy="68" r="7" fill="url(#ds-grad)"/>
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight">Databoard</span>
          <span className="text-[9px] uppercase tracking-widest opacity-50">
            by datashake
          </span>
        </div>
      )}
    </div>
  );
}
