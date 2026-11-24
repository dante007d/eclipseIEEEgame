/**
 * PROJECT ECLIPSE // THE ASCENSION QUIZ
 * Art-directed editorial / neo-brutalist tournament broadsheet.
 *
 * SPEC COMPLIANCE (xe3):
 *  1. ENTRY GATE: Full-screen ticket pass with strict validation, snappy shake,
 *     split-panel wipe reveal. sessionStorage tab memory.
 *  2. NO NAVBAR: Completely removed. Replaced by scroll progress bar, section wayfinding (01..06),
 *     hero jump buttons, and fixed TOP [↑] button.
 *  3. BRIGHT, HIGH-ENERGY COLOR: Tomato Red (#FF2A14) + Acid Lime (#CCFF00) + Ink Black (#111111) on Cream (#F5F2EB).
 *     Solid blocks, thick 3px black borders, hard 6px offset shadows. Zero blurry gradients.
 *  4. DISTINCTIVE TYPE: Bricolage Grotesque (display) + Space Mono & JetBrains Mono (data/labels).
 *  5. ANIMATIONS: Masked text reveals (cubic-bezier(0.22, 1, 0.36, 1)), physical button presses,
 *     continuous marquee ticker, custom desktop crosshair cursor, animated counters.
 *  6. ALL CONTENT INTACT: Mobile Arena, 60-Level Cascade, Host Dashboard, Heatmap, Leaderboard, Projector.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Gate & Utilities
import EntryGate, { getGateSession, clearGateSession } from './components/gate/EntryGate';
import ScrollProgressBar from './components/common/ScrollProgressBar';
import BackToTopButton from './components/common/BackToTopButton';
import CustomCursorGlow from './components/common/CustomCursorGlow';
import AnimatedCounter from './components/common/AnimatedCounter';
import MobileFrame from './components/MobileFrame';

// Preserved Screens & Modules
import PlayScreen from './components/player/PlayScreen';
import LandingScreen from './components/screens/LandingScreen';
import JoinMatchScreen from './components/screens/JoinMatchScreen';
import MainQuestionScreen from './components/screens/MainQuestionScreen';
import RecoveryRoomTransition from './components/screens/RecoveryRoomTransition';
import RoomQuestionScreen from './components/screens/RoomQuestionScreen';
import LevelClearedScreen from './components/screens/LevelClearedScreen';
import HostCreateScreen from './components/host/HostCreateScreen';
import HostLiveDashboard from './components/host/HostLiveDashboard';
import ProjectorView from './components/projector/ProjectorView';

import type { Transition } from './types/game';

type InteractiveScreen = 'play' | 'landing' | 'join' | 'main_q' | 'recovery' | 'room_q' | 'cleared';
const OUTCOME_OPTIONS: Transition[] = ['ADVANCE', 'ENTER_ROOM', 'NEXT_ROOM', 'RETURN_TO_MAIN', 'RESET', 'FINISH'];

export default function App() {
  const [authenticatedTeam, setAuthenticatedTeam] = useState<string | null>(() => {
    const s = getGateSession();
    return s ? s.teamName : null;
  });

  const [activeScreen, setActiveScreen] = useState<InteractiveScreen>('play');
  const [playerRoom, setPlayerRoom] = useState(0);
  const [previewOutcome, setPreviewOutcome] = useState<Transition | null>(null);

  // Lock scroll while gate is open
  useEffect(() => {
    if (!authenticatedTeam) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [authenticatedTeam]);

  const handleGateSuccess = (teamName: string) => {
    setAuthenticatedTeam(teamName);
  };

  const handleLeaveSession = () => {
    clearGateSession();
    setAuthenticatedTeam(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#111111] font-mono selection:bg-[#CCFF00] selection:text-[#111111] relative grain-overlay">
      {/* ── REQUIREMENT 1: ENTRY GATE ── */}
      {!authenticatedTeam && (
        <EntryGate onSuccess={handleGateSuccess} />
      )}

      {/* ── REQUIREMENT 2 & 4: UTILITIES (NO NAVBAR!) ── */}
      <ScrollProgressBar />
      <BackToTopButton />
      <CustomCursorGlow />

      {/* ── MAIN BROADSHEET ── */}
      <div className={`w-full flex flex-col ${authenticatedTeam ? 'block' : 'hidden'}`}>

        {/* ══════════════════════════════════════════════════════════
            HERO BROADSHEET (Masked staggered type, bold color blocks)
            ══════════════════════════════════════════════════════════ */}
        <header className="relative border-b-[3px] border-[#111111] px-4 sm:px-8 pt-10 pb-16 bg-[#F5F2EB]">
          {/* Top Broadside Header */}
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-[3px] border-[#111111] pb-4 mb-8 gap-4">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 bg-[#FF2A14] border-2 border-[#111111] inline-block" />
              <span className="font-mono text-xs font-bold tracking-widest uppercase text-[#111111]">
                OFFICIAL TOURNAMENT ISSUE // 2026.11
              </span>
            </div>

            {/* Team label once in the hero */}
            <div className="flex items-center gap-2 bg-[#CCFF00] border-2 border-[#111111] px-3 py-1 font-mono text-xs font-bold uppercase shadow-[3px_3px_0_#111111]">
              <span>AUTHENTICATED:</span>
              <span className="underline decoration-[#FF2A14] decoration-2">
                {authenticatedTeam ? `${authenticatedTeam.toUpperCase()} // 01` : 'GUEST // 00'}
              </span>
            </div>
          </div>

          {/* Massive Display Headlines (Masked Staggered Reveals) */}
          <div className="max-w-7xl mx-auto">
            <div className="overflow-hidden mb-1">
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                className="font-display font-black text-6xl sm:text-8xl md:text-9xl tracking-tighter uppercase leading-[0.88] text-[#111111]"
                style={{ fontSize: 'clamp(3.5rem, 13vw, 11rem)' }}
              >
                PROJECT
              </motion.div>
            </div>

            <div className="overflow-hidden mb-6 flex flex-wrap items-baseline gap-4 sm:gap-8">
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="font-display font-black text-6xl sm:text-8xl md:text-9xl tracking-tighter uppercase leading-[0.88] text-[#FF2A14]"
                style={{ fontSize: 'clamp(3.5rem, 13vw, 11rem)' }}
              >
                ECLIPSE
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="bg-[#111111] text-[#CCFF00] px-4 py-2 font-mono text-xs sm:text-sm font-bold uppercase tracking-widest border-2 border-[#111111] rotate-[-2deg] shadow-[4px_4px_0_#CCFF00]"
              >
                THE ASCENSION QUIZ
              </motion.div>
            </div>

            {/* Deck & Action Tags */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6 border-t-[3px] border-[#111111]">
              <div className="lg:col-span-7">
                <p className="font-mono text-sm sm:text-base text-[#111111] font-bold leading-relaxed max-w-2xl">
                  A 60-level technical tournament quiz. Answer the Main question to climb, or plummet through 4 recovery rooms with strictly decreasing difficulty before room 4 forces a full progress reset.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-6">
                  <a
                    href="#arena"
                    className="h-12 px-6 bg-[#CCFF00] hover:bg-[#b8e600] text-[#111111] font-display font-black text-sm uppercase tracking-wider btn-press flex items-center justify-center gap-2"
                  >
                    <span>ENTER ARENA</span>
                    <span>[→]</span>
                  </a>
                  <a
                    href="#rules"
                    className="h-12 px-6 bg-[#FFFFFF] hover:bg-[#F5F2EB] text-[#111111] font-display font-bold text-sm uppercase tracking-wider btn-press flex items-center justify-center"
                  >
                    02 // PROTOCOL
                  </a>
                  <a
                    href="#host"
                    className="h-12 px-6 bg-[#FFFFFF] hover:bg-[#F5F2EB] text-[#111111] font-display font-bold text-sm uppercase tracking-wider btn-press flex items-center justify-center"
                  >
                    03 // HOST
                  </a>
                  <a
                    href="#standings"
                    className="h-12 px-6 bg-[#FFFFFF] hover:bg-[#F5F2EB] text-[#111111] font-display font-bold text-sm uppercase tracking-wider btn-press flex items-center justify-center"
                  >
                    05 // STANDINGS
                  </a>
                </div>
              </div>

              {/* Hard Stat Blocks */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                <div className="brut-box p-4 bg-[#FFFFFF]">
                  <div className="font-mono text-[11px] text-[#777570] uppercase font-bold">TOTAL LEVELS</div>
                  <div className="font-display text-4xl sm:text-5xl font-black text-[#111111] mt-1">
                    <AnimatedCounter target={60} />
                  </div>
                </div>
                <div className="brut-box p-4 bg-[#CCFF00]">
                  <div className="font-mono text-[11px] text-[#111111] uppercase font-bold">ROOMS / LVL</div>
                  <div className="font-display text-4xl sm:text-5xl font-black text-[#111111] mt-1">
                    <AnimatedCounter target={4} />
                  </div>
                </div>
                <div className="brut-box p-4 bg-[#FFFFFF]">
                  <div className="font-mono text-[11px] text-[#777570] uppercase font-bold">LIVE PLAYERS</div>
                  <div className="font-display text-4xl sm:text-5xl font-black text-[#FF2A14] mt-1">
                    <AnimatedCounter target={24} />
                  </div>
                </div>
                <div className="brut-box p-4 bg-[#111111] text-[#FFFFFF]">
                  <div className="font-mono text-[11px] text-[#CCFF00] uppercase font-bold">QUESTION POOL</div>
                  <div className="font-display text-4xl sm:text-5xl font-black text-[#FFFFFF] mt-1">
                    <AnimatedCounter target={120} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Jump Wayfinding Strip */}
          <div className="max-w-7xl mx-auto mt-10 pt-4 flex flex-wrap items-center justify-between font-mono text-xs font-bold text-[#777570]">
            <a href="#arena" className="hover:text-[#FF2A14] transition-colors">
              SCROLL [↓] TO COMMENCE
            </a>
            <div className="flex gap-4">
              <span>WAYFINDING:</span>
              <a href="#arena" className="hover:text-[#111111]">[01 ARENA]</a>
              <a href="#rules" className="hover:text-[#111111]">[02 PROTOCOL]</a>
              <a href="#host" className="hover:text-[#111111]">[03 HOST]</a>
              <a href="#standings" className="hover:text-[#111111]">[05 STANDINGS]</a>
            </div>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════════
            CONTINUOUS TICKER STRIP
            ══════════════════════════════════════════════════════════ */}
        <div className="w-full bg-[#111111] text-[#CCFF00] py-3.5 border-b-[3px] border-[#111111] overflow-hidden select-none">
          <div className="marquee-track flex items-center gap-8 whitespace-nowrap">
            {[
              'PROJECT ECLIPSE',
              '60 TECHNICAL LEVELS',
              '4 RECOVERY ROOMS',
              'ROOM 4 = FULL PROGRESS RESET',
              'NO CHECKPOINTS',
              'REAL-TIME MATCH ENGINE',
              'THE ASCENSION TOURNAMENT',
              'PROJECT ECLIPSE',
              '60 TECHNICAL LEVELS',
              '4 RECOVERY ROOMS',
              'ROOM 4 = FULL PROGRESS RESET',
              'NO CHECKPOINTS',
              'REAL-TIME MATCH ENGINE',
              'THE ASCENSION TOURNAMENT',
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-6">
                <span className="font-mono text-xs font-bold tracking-[0.25em] uppercase text-[#CCFF00]">
                  {text}
                </span>
                <span className="w-2.5 h-2.5 bg-[#FF2A14] rotate-45 inline-block" />
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 01: ARENA (Interactive Mobile Tournament Client)
            ══════════════════════════════════════════════════════════ */}
        <section id="arena" className="py-20 px-4 sm:px-8 border-b-[3px] border-[#111111] bg-[#F5F2EB]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-[3px] border-[#111111] pb-4 mb-10 gap-4">
              <div>
                <span className="font-mono text-xs font-bold text-[#FF2A14] tracking-widest uppercase block mb-1">
                  01 // INTERACTIVE CLIENT
                </span>
                <h2 className="font-display font-black text-4xl sm:text-6xl text-[#111111] uppercase tracking-tight">
                  THE MATCH ARENA
                </h2>
              </div>
              <p className="font-mono text-xs text-[#777570] max-w-md">
                Live interactive client preview. Cycle through the 6 core client screens or test real-time transition overlays.
              </p>
            </div>

            {/* Screen Selection Tabs */}
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                { id: 'play', label: 'PLAY (XE2)' },
                { id: 'landing', label: 'TITLE SCREEN' },
                { id: 'join', label: 'JOIN MATCH' },
                { id: 'main_q', label: 'MAIN QUESTION' },
                { id: 'recovery', label: 'RECOVERY TRANSITION' },
                { id: 'room_q', label: 'ROOM QUESTION' },
                { id: 'cleared', label: 'LEVEL CLEARED' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveScreen(s.id as InteractiveScreen)}
                  className={`px-4 py-2 font-mono text-xs font-bold uppercase transition-all ${
                    activeScreen === s.id
                      ? 'bg-[#111111] text-[#CCFF00] border-2 border-[#111111] shadow-[3px_3px_0_#CCFF00]'
                      : 'bg-[#FFFFFF] text-[#111111] border-2 border-[#111111] hover:bg-[#CCFF00]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Outcome Simulator for Play Screen */}
            {activeScreen === 'play' && (
              <div className="brut-box p-4 mb-8 bg-[#FFFFFF]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#111111] uppercase">
                      TEST OUTCOME ANIMATIONS:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {OUTCOME_OPTIONS.map((o) => (
                        <button
                          key={o}
                          onClick={() => setPreviewOutcome((prev) => (prev === o ? null : o))}
                          className={`px-2.5 py-1 font-mono text-[11px] font-bold uppercase transition-all ${
                            previewOutcome === o
                              ? 'bg-[#FF2A14] text-[#FFFFFF] border-2 border-[#111111]'
                              : 'bg-[#F5F2EB] text-[#111111] border border-[#111111] hover:bg-[#CCFF00]'
                          }`}
                        >
                          {o}
                        </button>
                      ))}
                      {previewOutcome && (
                        <button
                          onClick={() => setPreviewOutcome(null)}
                          className="px-2 py-1 font-mono text-[10px] font-bold text-[#FF2A14] underline"
                        >
                          CLEAR [✕]
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Room Depth Selector */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#777570] uppercase">DEPTH:</span>
                    {[0, 1, 2, 3, 4].map((r) => (
                      <button
                        key={r}
                        onClick={() => setPlayerRoom(r)}
                        className={`w-7 h-7 font-mono text-xs font-bold border-2 border-[#111111] transition-all ${
                          playerRoom === r
                            ? 'bg-[#CCFF00] text-[#111111] shadow-[2px_2px_0_#111111]'
                            : 'bg-[#FFFFFF] text-[#111111] hover:bg-[#F5F2EB]'
                        }`}
                      >
                        {r === 0 ? 'M' : r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Simulator Frame */}
            <MobileFrame activeScreenName={`SCREEN // ${activeScreen.toUpperCase()}`}>
              {activeScreen === 'play' && (
                <PlayScreen
                  player={{
                    id: 'preview',
                    name: authenticatedTeam || 'You',
                    level: 18,
                    phase: playerRoom === 0 ? 'MAIN' : 'ROOM',
                    room: playerRoom,
                    resets: 1,
                    finished: false,
                    bestLevel: 20,
                  }}
                  previewTransition={previewOutcome}
                />
              )}
              {activeScreen === 'landing' && (
                <LandingScreen
                  onJoinMatch={() => setActiveScreen('join')}
                  onOpenDashboard={() => {
                    document.getElementById('host')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
              )}
              {activeScreen === 'join' && (
                <JoinMatchScreen
                  onJoin={() => setActiveScreen('main_q')}
                  onBack={() => setActiveScreen('landing')}
                />
              )}
              {activeScreen === 'main_q' && (
                <MainQuestionScreen
                  onSelectOption={() => setActiveScreen('cleared')}
                  onWrongAnswer={() => setActiveScreen('recovery')}
                  onOpenLeaderboard={() => {
                    document.getElementById('standings')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
              )}
              {activeScreen === 'recovery' && (
                <RecoveryRoomTransition onContinue={() => setActiveScreen('room_q')} />
              )}
              {activeScreen === 'room_q' && (
                <RoomQuestionScreen
                  onSuccess={() => setActiveScreen('cleared')}
                  onOpenLeaderboard={() => {
                    document.getElementById('standings')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
              )}
              {activeScreen === 'cleared' && (
                <LevelClearedScreen onNextLevel={() => setActiveScreen('main_q')} />
              )}
            </MobileFrame>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 02: PROTOCOL (60-Level Fall Cascade Rules)
            ══════════════════════════════════════════════════════════ */}
        <section id="rules" className="py-20 px-4 sm:px-8 border-b-[3px] border-[#111111] bg-[#FFFFFF]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-[3px] border-[#111111] pb-4 mb-10 gap-4">
              <div>
                <span className="font-mono text-xs font-bold text-[#FF2A14] tracking-widest uppercase block mb-1">
                  02 // GAME ENGINE PROTOCOL
                </span>
                <h2 className="font-display font-black text-4xl sm:text-6xl text-[#111111] uppercase tracking-tight">
                  THE CASCADE RULES
                </h2>
              </div>
              <p className="font-mono text-xs text-[#777570] max-w-md">
                Every level has 1 Main question and 4 Room recovery questions. Difficulty strictly decreases across rooms.
              </p>
            </div>

            {/* 5 Cascade Step Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { title: 'MAIN QUESTION', tag: 'LVL + 1', bg: 'bg-[#FFFFFF]', text: 'text-[#111111]', desc: 'Primary challenge. Correct advances player to Level + 1. Wrong answer drops player to Room 1.' },
                { title: 'ROOM 1 // BUFFER', tag: '0.8 FRACTION', bg: 'bg-[#F5F2EB]', text: 'text-[#111111]', desc: 'First recovery chance with easier question. Correct returns player to the Main question.' },
                { title: 'ROOM 2 // CACHE', tag: '0.6 FRACTION', bg: 'bg-[#F5F2EB]', text: 'text-[#111111]', desc: 'Easier again. Falling here occurs after 2 consecutive wrong answers.' },
                { title: 'ROOM 3 // SANDBOX', tag: '0.4 FRACTION', bg: 'bg-[#F5F2EB]', text: 'text-[#111111]', desc: 'Critical tier. 3 consecutive mistakes. 40% difficulty fraction of base level.' },
                { title: 'ROOM 4 // VOID', tag: '0.2 DANGER', bg: 'bg-[#111111]', text: 'text-[#CCFF00]', desc: 'FINAL CHANCE. One mistake triggers FULL RESET: level = 0, resets += 1, progress wiped.' },
              ].map((step, idx) => (
                <div key={step.title} className={`brut-box p-5 ${step.bg} flex flex-col justify-between`}>
                  <div>
                    <div className="flex items-center justify-between border-b-2 border-[#111111] pb-2 mb-3">
                      <span className="font-mono text-xs font-bold text-[#777570]">STEP 0{idx + 1}</span>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#FF2A14] text-[#FFFFFF]">
                        {step.tag}
                      </span>
                    </div>
                    <h3 className={`font-display font-black text-xl mb-3 uppercase leading-tight ${step.text}`}>
                      {step.title}
                    </h3>
                    <p className={`font-mono text-xs leading-relaxed ${idx === 4 ? 'text-[#FFFFFF]/90' : 'text-[#111111]'}`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Hard Policy Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
              <div className="brut-box p-6 bg-[#CCFF00]">
                <span className="font-mono text-xs font-bold text-[#111111] block mb-1">TIMERS // STRICT</span>
                <h4 className="font-display font-black text-2xl text-[#111111] uppercase mb-2">Server Deadlines</h4>
                <p className="font-mono text-xs text-[#111111] leading-relaxed">
                  Main questions enforce 45s; rooms enforce 30s. Timers tick server-side. Expiry counts as wrong.
                </p>
              </div>
              <div className="brut-box p-6 bg-[#FFFFFF]">
                <span className="font-mono text-xs font-bold text-[#FF2A14] block mb-1">RECOVERY // SAME LEVEL</span>
                <h4 className="font-display font-black text-2xl text-[#111111] uppercase mb-2">Variant Delivery</h4>
                <p className="font-mono text-xs text-[#111111] leading-relaxed">
                  Solving any room question returns you to the Main level with an alternate unmemorised variant question.
                </p>
              </div>
              <div className="brut-box p-6 bg-[#111111] text-[#FFFFFF]">
                <span className="font-mono text-xs font-bold text-[#CCFF00] block mb-1">RESET // ZERO TOLERANCE</span>
                <h4 className="font-display font-black text-2xl text-[#CCFF00] uppercase mb-2">Level Zeroed</h4>
                <p className="font-mono text-xs text-gray-300 leading-relaxed">
                  Failing Room 4 wipes level progress back to 0. Historical attempt timestamps are preserved for leaderboard tie-breakers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 03: HOST MATCH CONTROLS & MANAGEMENT
            ══════════════════════════════════════════════════════════ */}
        <section id="host" className="py-20 px-4 sm:px-8 border-b-[3px] border-[#111111] bg-[#F5F2EB]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-[3px] border-[#111111] pb-4 mb-10 gap-4">
              <div>
                <span className="font-mono text-xs font-bold text-[#FF2A14] tracking-widest uppercase block mb-1">
                  03 // HOST OPERATION
                </span>
                <h2 className="font-display font-black text-4xl sm:text-6xl text-[#111111] uppercase tracking-tight">
                  MATCH DISPATCH
                </h2>
              </div>
              <p className="font-mono text-xs text-[#777570] max-w-md">
                Configure match parameters, upload CS question banks (CSV/JSON), and broadcast live commands.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Host Create & Config Screen */}
              <div className="brut-box overflow-hidden h-[740px]">
                <HostCreateScreen />
              </div>

              {/* Live Match Control Dashboard */}
              <div className="brut-box overflow-hidden h-[740px]">
                <HostLiveDashboard />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 05: STANDINGS & DANGER ZONE
            ══════════════════════════════════════════════════════════ */}
        <section id="standings" className="py-20 px-4 sm:px-8 border-b-[3px] border-[#111111] bg-[#FFFFFF]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-[3px] border-[#111111] pb-4 mb-10 gap-4">
              <div>
                <span className="font-mono text-xs font-bold text-[#FF2A14] tracking-widest uppercase block mb-1">
                  05 // TOURNAMENT TELEMETRY
                </span>
                <h2 className="font-display font-black text-4xl sm:text-6xl text-[#111111] uppercase tracking-tight">
                  LIVE STANDINGS
                </h2>
              </div>
              <p className="font-mono text-xs text-[#777570] max-w-md">
                Real-time leaderboard telemetry. Players in Room 4 are flagged in the Danger Zone — one failure away from full reset.
              </p>
            </div>

            <div className="brut-box overflow-hidden">
              <ProjectorView />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            FOOTER (Broadsheet Impressum & Session Logout)
            ══════════════════════════════════════════════════════════ */}
        <footer className="py-16 px-4 sm:px-8 bg-[#111111] text-[#FFFFFF] border-t-[4px] border-[#111111]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-6">
              <div className="font-display font-black text-3xl sm:text-4xl text-[#CCFF00] uppercase tracking-tight">
                PROJECT ECLIPSE // 2026
              </div>
              <p className="font-mono text-xs text-gray-400 mt-2 max-w-md leading-relaxed">
                Autonomous technical assessment and tournament system. Designed for collegiate techhunts, hackathons, and programming championships.
              </p>
            </div>

            <div className="md:col-span-6 flex flex-col sm:items-end justify-between gap-4">
              <div className="flex items-center gap-3 bg-[#FFFFFF] text-[#111111] px-4 py-2 border-2 border-[#CCFF00]">
                <span className="font-mono text-xs font-bold">SESSION: {authenticatedTeam || 'ANONYMOUS'}</span>
                <button
                  onClick={handleLeaveSession}
                  className="px-2 py-1 bg-[#FF2A14] text-[#FFFFFF] font-mono text-[11px] font-bold uppercase hover:bg-black transition-colors"
                >
                  LOGOUT [✕]
                </button>
              </div>

              <div className="font-mono text-[11px] text-[#777570] text-right">
                STACK: REACT 18 // VITE // TS STRICT // TAILWIND // VITEST
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
