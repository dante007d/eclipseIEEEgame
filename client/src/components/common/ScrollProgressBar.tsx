import { useEffect, useState } from 'react';

export default function ScrollProgressBar() {
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      if (total <= 0) {
        setScrollPct(0);
        return;
      }
      const pct = (window.scrollY / total) * 100;
      setScrollPct(Math.min(100, Math.max(0, pct)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[4px] z-50 bg-[#111111]/20 pointer-events-none">
      <div
        className="h-full bg-[#FF2A14] border-r-2 border-[#111111] transition-[width] duration-75 ease-out"
        style={{ width: `${scrollPct}%` }}
      />
    </div>
  );
}
