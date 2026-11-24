/**
 * TECH DROP – Playground Route  (/playground)
 *
 * Shows every primitive in every room theme – a Storybook-style showcase.
 * Zero external Storybook dependency; it's just a regular React page.
 */

import { useState, type ReactNode, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { ROOM_THEMES, type RoomId } from '@/theme/tokens';
import { staggerContainer, staggerItem, confettiBurst } from '@/animations/motionPresets';

import Button   from '@/components/Button';
import Card     from '@/components/Card';
import Badge    from '@/components/Badge';
import ProgressBar from '@/components/ProgressBar';
import TimerRing   from '@/components/TimerRing';
import Lives       from '@/components/Lives';
import Modal       from '@/components/Modal';
import { ToastContainer, type ToastData } from '@/components/Toast';

const ROOM_KEYS = Object.keys(ROOM_THEMES) as RoomId[];

export default function Playground() {
  const [activeRoom, setActiveRoom] = useState<RoomId>('MAIN');
  const [progress,   setProgress]   = useState(42);
  const [timer,      setTimer]       = useState(55);
  const [lives,      setLives]       = useState(3);
  const [modalOpen,  setModalOpen]   = useState(false);
  const [loading,    setLoading]     = useState(false);
  const [toasts,     setToasts]      = useState<ToastData[]>([]);

  const theme = ROOM_THEMES[activeRoom];

  const addToast = (variant: ToastData['variant'], message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, variant, message }]);
  };

  const removeToast = (id: string) =>
    setToasts(prev => prev.filter(t => t.id !== id));

  const handleConfetti = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    confettiBurst({
      origin: {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top  + rect.height / 2) / window.innerHeight,
      },
      colors: [theme.bg, theme.accent, theme.card],
    });
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: theme.bg, transition: 'background 0.4s ease' }}
    >
      {/* ── Page Header ── */}
      <header
        className="sticky top-0 z-10 border-b-[3px] border-ink py-4 px-6"
        style={{ background: theme.accent, boxShadow: '0 4px 0 #111111' }}
      >
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading text-2xl font-extrabold">
            🚀 TECH DROP – Component Playground
          </h1>
          {/* Room switcher */}
          <div className="flex flex-wrap gap-2">
            {ROOM_KEYS.map(key => (
              <button
                key={key}
                onClick={() => setActiveRoom(key)}
                className={[
                  'font-heading font-extrabold text-sm px-3 py-1',
                  'border-2 border-ink rounded-full',
                  'transition-all duration-150',
                  activeRoom === key
                    ? 'shadow-[3px_3px_0_#111] scale-105'
                    : 'opacity-70 hover:opacity-100',
                ].join(' ')}
                style={{
                  background: ROOM_THEMES[key].accent,
                  color:      ROOM_THEMES[key].text,
                }}
              >
                {ROOM_THEMES[key].label.split('–')[0].trim()}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Theme info banner */}
        <Card theme={theme} sticker={theme.id} className="mb-10">
          <h2 className="font-heading text-xl font-extrabold mb-1">{theme.label}</h2>
          <p className="text-sm opacity-70">
            Mascot mood: <strong>{theme.mascotMood}</strong> · Shapes: <strong>{theme.shapeSet}</strong> ·
            Sound pitch: <strong>×{theme.soundPitch}</strong>
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            {(['bg', 'card', 'accent', 'shadow'] as const).map(key => (
              <div key={key} className="flex items-center gap-2 text-xs font-mono">
                <span
                  className="w-6 h-6 rounded border-2 border-ink inline-block"
                  style={{ background: theme[key] }}
                />
                <span className="opacity-60">{key}:</span>
                <span className="font-bold">{theme[key]}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Buttons ── */}
        <Section title="🔘 Buttons" theme={theme}>
          <div className="flex flex-wrap gap-4 items-center">
            <Button theme={theme} variant="primary"   size="sm" onClick={handleConfetti}>Small 🎉</Button>
            <Button theme={theme} variant="primary"   size="md">Medium Button</Button>
            <Button theme={theme} variant="primary"   size="lg">Large Button 🚀</Button>
            <Button theme={theme} variant="secondary" size="md">Secondary</Button>
            <Button theme={theme} variant="danger"    size="md">Danger ⚠️</Button>
            <Button theme={theme} variant="ghost"     size="md">Ghost</Button>
            <Button theme={theme} variant="primary"   size="md" disabled>Disabled</Button>
            <Button
              theme={theme}
              variant="primary"
              size="md"
              loading={loading}
              onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 2000); }}
            >
              {loading ? 'Loading…' : 'Loading demo'}
            </Button>
          </div>
        </Section>

        {/* ── Badges ── */}
        <Section title="🏷️ Badges" theme={theme}>
          <div className="flex flex-wrap gap-3 items-center">
            <Badge theme={theme} size="sm">Small</Badge>
            <Badge theme={theme} size="md">Medium</Badge>
            <Badge theme={theme} size="lg">Large</Badge>
            <Badge color="#2D6BFF" size="md" className="text-white">Blue</Badge>
            <Badge color="#FF4D4D" size="md">Error</Badge>
            <Badge color="#00F5A0" size="md">Success</Badge>
            <Badge color="#FFC400" size="md">Warning</Badge>
          </div>
        </Section>

        {/* ── Progress bars ── */}
        <Section title="📊 Progress Bars" theme={theme}>
          <div className="space-y-4">
            <ProgressBar value={progress} color={theme.accent} showLabel />
            <ProgressBar value={75}   color="#00F5A0" height={12} />
            <ProgressBar value={30}   color="#FF4D4D" height={28} showLabel />
            <input
              type="range" min={0} max={100} value={progress}
              onChange={e => setProgress(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </Section>

        {/* ── Timer Ring ── */}
        <Section title="⏱️ Timer Ring" theme={theme}>
          <div className="flex flex-wrap gap-8 items-center">
            <TimerRing seconds={timer} total={90} size={80} />
            <TimerRing seconds={8}     total={30} size={64} />
            <TimerRing seconds={45}    total={90} size={96} />
            <TimerRing seconds={0}     total={90} size={72} />
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">Scrub timer: {timer}s</label>
              <input
                type="range" min={0} max={90} value={timer}
                onChange={e => setTimer(Number(e.target.value))}
                className="w-48 accent-blue-500"
              />
            </div>
          </div>
        </Section>

        {/* ── Lives ── */}
        <Section title="❤️ Lives" theme={theme}>
          <div className="flex flex-col gap-4">
            <Lives current={lives} max={4} icon="heart" />
            <Lives current={2}     max={5} icon="star"  size={32} />
            <Lives current={0}     max={3} icon="heart" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setLives(l => Math.max(0, l - 1))}>−</Button>
              <Button size="sm" onClick={() => setLives(l => Math.min(4, l + 1))}>+</Button>
            </div>
          </div>
        </Section>

        {/* ── Cards ── */}
        <Section title="🃏 Cards" theme={theme}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card theme={theme} sticker="NEW!" hoverable>
              <h3 className="font-heading text-lg font-extrabold mb-2">Hoverable Card</h3>
              <p className="text-sm opacity-70">Hover me for a lift effect.</p>
            </Card>
            <Card theme={theme} hoverable>
              <h3 className="font-heading text-lg font-extrabold mb-2">Plain Card</h3>
              <p className="text-sm opacity-70">No sticker, clean and simple.</p>
            </Card>
            <Card theme={theme} sticker="LEVEL 42">
              <h3 className="font-heading text-lg font-extrabold mb-2">Level Card</h3>
              <ProgressBar value={70} color={theme.accent} className="mt-2" />
            </Card>
          </div>
        </Section>

        {/* ── Toasts ── */}
        <Section title="🔔 Toasts" theme={theme}>
          <div className="flex flex-wrap gap-3">
            {(['success', 'error', 'warning', 'info'] as const).map(v => (
              <Button
                key={v}
                size="sm"
                variant="secondary"
                onClick={() => addToast(v, `This is a ${v} toast!`)}
              >
                {v}
              </Button>
            ))}
          </div>
        </Section>

        {/* ── Modal ── */}
        <Section title="💬 Modal" theme={theme}>
          <Button theme={theme} onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Level Complete! 🎉"
            theme={theme}
          >
            <p className="mb-6 text-base opacity-80">
              You solved <strong>Level 7</strong> in <strong>42 seconds</strong>!
            </p>
            <ProgressBar value={70} color={theme.accent} showLabel className="mb-6" />
            <div className="flex gap-3 justify-end">
              <Button variant="ghost"   size="sm" onClick={() => setModalOpen(false)}>Close</Button>
              <Button theme={theme}     size="sm" onClick={() => { setModalOpen(false); confettiBurst(); }}>
                Next Level 🚀
              </Button>
            </div>
          </Modal>
        </Section>

        {/* ── Motion showcase ── */}
        <Section title="✨ Motion Stagger" theme={theme}>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {['shake', 'squishDrop', 'rocketLaunch', 'confettiBurst', 'slotFlip', 'jellyHover', 'glitchlessBoom', 'wave'].map(name => (
              <motion.div
                key={name}
                variants={staggerItem}
                className="border-[3px] border-ink rounded-card p-3 text-center font-mono text-xs font-bold"
                style={{ background: theme.card, boxShadow: `4px 4px 0 ${theme.shadow}` }}
              >
                {name}
              </motion.div>
            ))}
          </motion.div>
        </Section>
      </main>

      {/* Global toast portal */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

/* ── Section wrapper ── */
import type { RoomTheme as RoomThemeT } from '@/theme/tokens';

function Section({ title, children }: {
  title:    string;
  theme?:   RoomThemeT;
  children: ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="font-heading text-xl font-extrabold mb-4 pb-2 border-b-[3px] border-ink inline-block">
        {title}
      </h2>
      {children}
    </section>
  );
}
