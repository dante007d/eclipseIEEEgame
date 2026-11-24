import { useEffect } from 'react';
import { soundFX } from '../../lib/sound';
import { EclipseStage, GoldDivider } from '../GothicPrimitives';

interface LevelClearedScreenProps {
  currentLevel?: number;
  pointsGained?: number;
  onNextLevel: () => void;
}

export default function LevelClearedScreen({
  currentLevel = 1,
  pointsGained = 0,
  onNextLevel,
}: LevelClearedScreenProps) {
  const nextLevel = Math.min(60, currentLevel + 1);

  useEffect(() => {
    soundFX.playLevelCleared();
    const t = setTimeout(onNextLevel, 1600);
    return () => clearTimeout(t);
  }, [onNextLevel]);

  return (
    <div className="fixed inset-0 z-40">
      <EclipseStage
        backgroundImage="/images/level-cleared.jpg"
        overlayClassName="bg-gradient-to-b from-black/35 via-black/55 to-black/90"
        brightenDoorway={true}
        maxWidthClass="max-w-lg"
      >
        <div className="flex-1 flex flex-col justify-between py-4">
          <div />

          <div className="my-auto flex flex-col items-center text-center">
            <div className="eclipse-slab-box w-full">
              <span className="eclipse-slab-label">[ CHAMBER CLEARED ]</span>
              <h2 className="font-display text-4xl sm:text-5xl tracking-[0.2em] text-[#f3ece0] uppercase pt-2">
                LEVEL {currentLevel}
              </h2>
              <h2 className="font-display text-4xl sm:text-5xl tracking-[0.2em] text-[#e6c48a] uppercase">
                CLEARED
              </h2>

              <GoldDivider className="my-3.5 w-44 mx-auto" />

              {pointsGained > 0 && (
                <div className="inline-block mb-3 px-3 py-1 bg-[#140e06] border border-[#c69c5d] font-mono text-xs font-bold text-[#e6c48a] tabular-nums">
                  +{pointsGained} PTS
                </div>
              )}

              <p className="font-mono text-xs tracking-[0.24em] text-gray-300 uppercase">
                ADVANCING TO
              </p>
              <div className="font-display text-3xl tracking-[0.2em] text-[#e6c48a] uppercase mt-1">
                LEVEL {nextLevel}
              </div>
            </div>
          </div>

          <div className="pb-2">
            <button
              type="button"
              onClick={() => {
                soundFX.playButtonClick();
                onNextLevel();
              }}
              className="eclipse-btn-obsidian w-full py-3.5 px-6 font-display text-2xl tracking-[0.22em] uppercase"
            >
              ENTER LEVEL {nextLevel} &gt;&gt;
            </button>
          </div>
        </div>
      </EclipseStage>
    </div>
  );
}
