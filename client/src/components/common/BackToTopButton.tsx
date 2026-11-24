import { useEffect, useState } from 'react';

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-40 px-3 py-2 bg-[#CCFF00] text-[#111111] border-[3px] border-[#111111] shadow-[4px_4px_0_#111111] font-mono text-xs font-bold uppercase transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#111111] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none cursor-pointer"
    >
      TOP [↑]
    </button>
  );
}
