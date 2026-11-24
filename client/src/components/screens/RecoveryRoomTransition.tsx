import { useEffect } from 'react';
import { soundFX } from '../../lib/sound';
import { EclipseStage, RoomDepthIndicator, GoldDivider } from '../GothicPrimitives';

interface RecoveryRoomTransitionProps {
  onContinue: () => void;
  roomNumber?: number;
  roast?: string;
  isTimeout?: boolean;
}

export default function RecoveryRoomTransition({
  onContinue,
  roomNumber = 1,
  roast,
  isTimeout = false,
}: RecoveryRoomTransitionProps) {
  useEffect(() => {
    soundFX.playEnterRecovery(roomNumber);
    const t = setTimeout(onContinue, 1600);
    return () => clearTimeout(t);
  }, [onContinue, roomNumber]);

  return (
    <div className="fixed inset-0 z-40">
      <EclipseStage
        backgroundImage="/images/recovery-guardian.jpg"
        overlayClassName="bg-gradient-to-b from-black/50 via-black/68 to-black/92"
        redPulse={false}
        squeeze={0.45 + roomNumber * 0.12}
        maxWidthClass="max-w-lg"
      >
        <div className="flex-1 flex flex-col justify-between py-4">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="px-2.5 py-1 bg-[#29050b] border border-[#ff0033] text-[#ff0033] uppercase tracking-widest">
              CASCADE DROP
            </span>
            <span className="px-2.5 py-1 bg-[#080508] border border-[#c69c5d]/60 text-[#e6d7be] uppercase">
              ROOM {roomNumber} / 4
            </span>
          </div>

          <div className="my-auto flex flex-col items-center text-center">
            <div className="gothic-panel-crimson p-6 sm:p-8 w-full">
              <h2 className="font-display text-2xl tracking-[0.25em] text-[#f3ece0] uppercase">
                ENTERING
              </h2>
              <h3 className="font-display text-4xl sm:text-5xl tracking-[0.18em] text-[#ff0033] uppercase mt-1 animate-glitch">
                RECOVERY ROOM
              </h3>

              <GoldDivider className="my-3.5 w-44 mx-auto" />

              <p className="font-mono text-xs text-gray-300 leading-relaxed mb-4 uppercase">
                {isTimeout ? 'CLOCK EXPIRED.' : 'INCORRECT TRANSMISSION.'} RECOVERY TRIAL ENGAGED:
              </p>

              <RoomDepthIndicator room={roomNumber} totalRooms={4} />

              {roast && (
                <p className="mt-4 pt-3 border-t border-[#ff0033]/40 font-mono text-xs text-red-200 leading-snug">
                  &ldquo;{roast}&rdquo;
                </p>
              )}

              {roomNumber === 4 && (
                <p className="mt-3 font-mono text-xs text-[#ffe000] font-bold tracking-wider uppercase">
                  !! FINAL ROOM -- NEXT MISS RESETS TO LEVEL 0 !!
                </p>
              )}
            </div>
          </div>

          <div className="pb-2">
            <button
              type="button"
              onClick={() => {
                soundFX.playButtonClick();
                onContinue();
              }}
              className="eclipse-btn-crimson w-full py-3.5 px-6 font-display text-2xl tracking-[0.22em] uppercase"
            >
              ENTER ROOM {roomNumber} &gt;&gt;
            </button>
          </div>
        </div>
      </EclipseStage>
    </div>
  );
}
