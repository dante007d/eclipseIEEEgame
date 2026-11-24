/**
 * TECH DROP – ProgressBar with liquid wave animation
 */

interface ProgressBarProps {
  /** 0–100 */
  value:    number;
  /** Filled color (CSS). */
  color?:   string;
  /** Bar height in px. */
  height?:  number;
  /** Show percentage label. */
  showLabel?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  color     = '#2D6BFF',
  height    = 20,
  showLabel = false,
  className = '',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={['flex items-center gap-3', className].join(' ')}>
      <div
        className="relative flex-1 rounded-full border-[3px] border-ink overflow-hidden"
        style={{ height, background: '#FFFFFF', boxShadow: '3px 3px 0 #111111' }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-500 ease-out"
          style={{ width: `${clamped}%`, background: color }}
        >
          {/* Liquid wave overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent 0px,
                transparent 10px,
                rgba(255,255,255,0.4) 10px,
                rgba(255,255,255,0.4) 20px
              )`,
              backgroundSize:   '40px 100%',
              animation:        'wave 1.5s linear infinite',
            }}
          />
        </div>
      </div>

      {showLabel && (
        <span className="font-mono text-sm font-bold w-12 text-right">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
