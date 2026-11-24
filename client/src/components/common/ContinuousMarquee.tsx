interface ContinuousMarqueeProps {
  items?: string[];
}

export default function ContinuousMarquee({
  items = [
    '⚡ PROJECT ECLIPSE',
    'THE ASCENSION QUIZ',
    '60 LEVELS',
    '4 RECOVERY ROOMS',
    'REAL-TIME MULTIPLAYER',
    'NEO-GOTHIC EXPERIENCE',
    'CHALLENGE THE ASCENSION',
  ],
}: ContinuousMarqueeProps) {
  // Repeat array twice to create seamless infinite loop
  const list = [...items, ...items, ...items, ...items];

  return (
    <div className="w-full overflow-hidden py-3 bg-gradient-to-r from-[#2d6bff]/20 via-[#ff007a]/20 to-[#ffe600]/20 border-y border-white/10 backdrop-blur-sm select-none">
      <div className="animate-marquee flex items-center gap-8 whitespace-nowrap">
        {list.map((text, i) => (
          <div key={i} className="flex items-center gap-6">
            <span className="font-cinzel text-xs font-black tracking-[0.25em] text-white/90 uppercase hover:text-[#00e0ff] transition-colors">
              {text}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff007a] shadow-[0_0_8px_#ff007a]" />
          </div>
        ))}
      </div>
    </div>
  );
}
