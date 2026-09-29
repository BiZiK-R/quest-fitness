type GuildMarkProps = {
  /** Visual size in px (24–32 per DESIGN.md). */
  size?: number;
  className?: string;
};

/**
 * Monochrome guild mark (kettlebell motif), line art 1.5px stroke.
 */
export function GuildMark({ size = 28, className }: GuildMarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Знак Гильдии"
    >
      <path
        d="M12 3c-2.2 0-4 1.6-4 3.6v1.2c-2.1.8-3.5 2.7-3.5 5v2.2c0 3 2.4 5.4 5.4 5.4h4.2c3 0 5.4-2.4 5.4-5.4v-2.2c0-2.3-1.4-4.2-3.5-5V6.6C16 4.6 14.2 3 12 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 6.5h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10 11.5c.8-.5 1.7-.8 2.7-.8s1.9.3 2.7.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="14.5" r="1" fill="currentColor" />
    </svg>
  );
}
