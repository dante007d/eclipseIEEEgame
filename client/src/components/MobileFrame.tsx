import type { ReactNode } from 'react';

interface MobileFrameProps {
  children: ReactNode;
  activeScreenName?: string;
}

export default function MobileFrame({ children, activeScreenName }: MobileFrameProps) {
  return (
    <div className="relative mx-auto flex flex-col items-center">
      {/* Phone chassis */}
      <div
        className="w-full max-w-[390px] h-[780px] bg-[#07070a] rounded-[44px] p-3 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9),0_0_0_8px_#18151b,0_0_0_10px_#2d131a] relative overflow-hidden flex flex-col border border-red-950/40"
      >
        {/* Dynamic Island / Speaker notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#000000] rounded-full z-50 flex items-center justify-end px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0a0a14] border border-[#1f1e29]" />
        </div>

        {/* Inner Phone Screen Content */}
        <div className="relative flex-1 w-full bg-[#060709] rounded-[36px] overflow-hidden flex flex-col select-none">
          {children}
        </div>

        {/* Home Indicator Bar */}
        <div className="w-32 h-1 bg-gray-600/50 rounded-full mx-auto mt-2 mb-0.5 z-50" />
      </div>

      {activeScreenName && (
        <div className="mt-3 text-center">
          <span className="font-cinzel text-xs tracking-[0.2em] text-red-400/80 uppercase font-semibold">
            {activeScreenName}
          </span>
        </div>
      )}
    </div>
  );
}
