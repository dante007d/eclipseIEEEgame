import { useEffect, useState } from 'react';

interface EclipseSkyProps {
  glowIntensity?: 'normal' | 'high' | 'gold';
  subtleCity?: boolean;
}

export default function EclipseSky({ glowIntensity = 'normal', subtleCity = true }: EclipseSkyProps) {
  const [embers, setEmbers] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    // Generate atmospheric floating embers
    const items = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 5,
    }));
    setEmbers(items);
  }, []);

  const coronaColor =
    glowIntensity === 'gold'
      ? 'rgba(251, 191, 36, 0.75)'
      : glowIntensity === 'high'
      ? 'rgba(239, 68, 68, 0.85)'
      : 'rgba(225, 29, 72, 0.65)';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Dark sky gradient with crimson horizon */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#040407] via-[#09080d] to-[#17060a]" />

      {/* Radial red ambient glow behind eclipse */}
      <div
        className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[280px] h-[280px] rounded-full blur-[60px]"
        style={{
          background: glowIntensity === 'gold'
            ? 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(225, 29, 72, 0.5) 0%, rgba(185, 28, 28, 0.2) 50%, transparent 75%)',
        }}
      />

      {/* The Solar Eclipse Ring */}
      <div className="absolute top-[9%] left-1/2 -translate-x-1/2 flex items-center justify-center">
        {/* Glowing corona outer ring */}
        <div
          className="w-24 h-24 rounded-full relative"
          style={{
            boxShadow: `0 0 35px 8px ${coronaColor}, inset 0 0 15px rgba(255, 255, 255, 0.3)`,
            background: 'radial-gradient(circle, #020204 88%, #ef4444 98%, #ffffff 100%)',
          }}
        >
          {/* Subtle rim highlight */}
          <div className="absolute inset-0 rounded-full border border-red-500/50" />
        </div>
      </div>

      {/* Gothic cathedral & spire silhouettes at the bottom */}
      {subtleCity && (
        <div className="absolute bottom-0 inset-x-0 h-44 opacity-40">
          <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="w-full h-full fill-[#040406]">
            <path d="M0,120 L0,70 L20,70 L30,40 L40,70 L60,65 L70,20 L80,65 L100,70 L110,50 L120,70 L140,60 L150,10 L160,60 L180,65 L200,30 L220,65 L240,60 L250,15 L260,60 L280,70 L290,45 L300,70 L330,65 L340,25 L350,65 L380,70 L400,60 L400,120 Z" />
          </svg>
        </div>
      )}

      {/* Floating crimson embers */}
      {embers.map((e) => (
        <div
          key={e.id}
          className="ember"
          style={{
            left: `${e.left}%`,
            animationDelay: `${e.delay}s`,
            animationDuration: `${e.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
