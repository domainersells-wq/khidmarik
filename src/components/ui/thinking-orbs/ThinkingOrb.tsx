'use client';

import React from 'react';
import { ActivityState, OrbSize } from './types';
import { cn } from '@/lib/utils';
import { Check, AlertCircle } from 'lucide-react';

interface ThinkingOrbProps {
  state: ActivityState;
  size?: OrbSize;
  audioLevel?: number;
  className?: string;
}

const sizeMap: Record<OrbSize, { container: string; core: string; glow: string; particle: string }> = {
  sm: {
    container: 'h-6 w-6',
    core: 'h-3.5 w-3.5',
    glow: 'h-5 w-5',
    particle: 'h-1 w-1',
  },
  md: {
    container: 'h-10 w-10',
    core: 'h-5 w-5',
    glow: 'h-8 w-8',
    particle: 'h-1.5 w-1.5',
  },
  lg: {
    container: 'h-20 w-20',
    core: 'h-10 w-10',
    glow: 'h-16 w-16',
    particle: 'h-2.5 w-2.5',
  },
};

export const ThinkingOrb: React.FC<ThinkingOrbProps> = ({
  state,
  size = 'md',
  audioLevel = 0,
  className,
}) => {
  if (state === 'idle') return null;

  const currentSize = sizeMap[size];
  const clampedAudio = Math.min(Math.max(audioLevel, 0), 1);
  const dynamicScale = 1 + clampedAudio * 0.4;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center select-none shrink-0 transition-transform duration-300',
        currentSize.container,
        className
      )}
      role="status"
      aria-label={`System activity: ${state}`}
    >
      {/* ══════════════ 1. THINKING STATE ══════════════ */}
      {state === 'thinking' && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Ambient Glow */}
          <div
            className={cn(
              'absolute rounded-full bg-gradient-to-r from-indigo-500/30 to-purple-500/30 blur-md orb-breathe',
              currentSize.glow
            )}
          />
          {/* Breathing Core */}
          <div
            className={cn(
              'relative rounded-full bg-gradient-to-tr from-indigo-600 via-purple-500 to-sky-400 shadow-md shadow-indigo-500/20 orb-breathe',
              currentSize.core
            )}
          />
          {/* Orbiting Ring with Particles */}
          <div className="absolute inset-0 orb-rotate-slow pointer-events-none">
            <div
              className={cn(
                'absolute top-0 left-1/2 -translate-x-1/2 rounded-full bg-purple-400 shadow-xs shadow-purple-300',
                currentSize.particle
              )}
            />
            <div
              className={cn(
                'absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-indigo-400 shadow-xs shadow-indigo-300',
                currentSize.particle
              )}
            />
          </div>
          <div className="absolute inset-1 orb-rotate-reverse pointer-events-none opacity-60">
            <div
              className={cn(
                'absolute top-1/2 right-0 -translate-y-1/2 rounded-full bg-sky-300',
                currentSize.particle
              )}
            />
          </div>
        </div>
      )}

      {/* ══════════════ 2. SEARCHING STATE ══════════════ */}
      {state === 'searching' && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Concentric Scan Rings */}
          <div className="absolute inset-0 rounded-full border border-sky-400/30 orb-ping-slow" />
          <div className="absolute inset-1 rounded-full border border-blue-500/40 orb-ping-delayed" />
          {/* Glowing Center */}
          <div
            className={cn(
              'relative rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 shadow-lg shadow-sky-500/30',
              currentSize.core
            )}
          />
          {/* Radar Sweep Arc */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-sky-400 orb-spin-fast pointer-events-none" />
        </div>
      )}

      {/* ══════════════ 3. SOLVING STATE ══════════════ */}
      {state === 'solving' && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Converging Puzzle Nodes */}
          <div
            className={cn(
              'absolute rounded-full bg-gradient-to-tr from-amber-500/30 to-emerald-500/30 blur-sm orb-pulse',
              currentSize.glow
            )}
          />
          <div
            className={cn(
              'relative rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-md shadow-emerald-500/20',
              currentSize.core
            )}
          />
          {/* 4 Converging Nodes */}
          <div className="absolute inset-0 orb-rotate-slow pointer-events-none">
            <div className={cn('absolute top-0.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-400 orb-converge', currentSize.particle)} />
            <div className={cn('absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 orb-converge', currentSize.particle)} />
            <div className={cn('absolute top-1/2 left-0.5 -translate-y-1/2 rounded-full bg-teal-300 orb-converge', currentSize.particle)} />
            <div className={cn('absolute top-1/2 right-0.5 -translate-y-1/2 rounded-full bg-cyan-400 orb-converge', currentSize.particle)} />
          </div>
        </div>
      )}

      {/* ══════════════ 4. COMPOSING STATE ══════════════ */}
      {state === 'composing' && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Gentle Shimmer Core */}
          <div
            className={cn(
              'relative rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500 shadow-md shadow-fuchsia-500/20 orb-shimmer overflow-hidden',
              currentSize.core
            )}
          >
            <div className="absolute inset-0 bg-white/20 orb-sweep" />
          </div>
          {/* Sequential Typing Wavelets */}
          <div className="absolute -bottom-1 flex items-center justify-center gap-0.5">
            <span className="w-1 h-1 rounded-full bg-fuchsia-400 orb-dot-1" />
            <span className="w-1 h-1 rounded-full bg-purple-400 orb-dot-2" />
            <span className="w-1 h-1 rounded-full bg-indigo-400 orb-dot-3" />
          </div>
        </div>
      )}

      {/* ══════════════ 5. LISTENING STATE ══════════════ */}
      {state === 'listening' && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Audio Wave Ring 1 */}
          <div
            className="absolute rounded-full border-2 border-rose-500/40 transition-all duration-100 ease-out"
            style={{
              inset: `${Math.max(0, 4 - clampedAudio * 8)}px`,
              opacity: 0.3 + clampedAudio * 0.7,
              transform: `scale(${dynamicScale})`,
            }}
          />
          {/* Audio Wave Ring 2 */}
          <div
            className="absolute inset-1 rounded-full border border-pink-400/50 orb-pulse-fast"
            style={{
              transform: `scale(${1 + clampedAudio * 0.2})`,
            }}
          />
          {/* Core Mic Reactive Ball */}
          <div
            className={cn(
              'relative rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 shadow-md shadow-rose-500/30 transition-transform duration-75',
              currentSize.core
            )}
            style={{ transform: `scale(${1 + clampedAudio * 0.3})` }}
          />
        </div>
      )}

      {/* ══════════════ 6. LOADING STATE (Standard Graceful) ══════════════ */}
      {state === 'loading' && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div
            className={cn(
              'rounded-full border-2 border-primary/20 border-t-primary orb-spin-normal',
              currentSize.core
            )}
          />
        </div>
      )}

      {/* ══════════════ 7. SUCCESS STATE ══════════════ */}
      {state === 'success' && (
        <div className="relative w-full h-full flex items-center justify-center animate-in zoom-in-75 duration-200">
          <div
            className={cn(
              'rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/40 shadow-sm shadow-emerald-500/20',
              currentSize.core
            )}
          >
            <Check className={cn('stroke-[3]', size === 'sm' ? 'h-2.5 w-2.5' : size === 'md' ? 'h-3 w-3' : 'h-5 w-5')} />
          </div>
        </div>
      )}

      {/* ══════════════ 8. ERROR STATE ══════════════ */}
      {state === 'error' && (
        <div className="relative w-full h-full flex items-center justify-center animate-in shake duration-200">
          <div
            className={cn(
              'rounded-full bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-500/40 shadow-sm shadow-red-500/20',
              currentSize.core
            )}
          >
            <AlertCircle className={cn('stroke-[2.5]', size === 'sm' ? 'h-2.5 w-2.5' : size === 'md' ? 'h-3 w-3' : 'h-5 w-5')} />
          </div>
        </div>
      )}

      {/* Embedded CSS Animations for GPU Smoothness & Zero Setup Overhead */}
      <style jsx>{`
        @keyframes orbBreathe {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes orbRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbRotateRev {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes orbPingSlow {
          0% { transform: scale(0.85); opacity: 0.8; }
          75%, 100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes orbSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes orbDotJump {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-2px); opacity: 1; }
        }
        @keyframes orbPulseSlow {
          0%, 100% { transform: scale(0.95); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 0.9; }
        }

        .orb-breathe {
          animation: orbBreathe 2.8s ease-in-out infinite;
        }
        .orb-rotate-slow {
          animation: orbRotate 6s linear infinite;
        }
        .orb-rotate-reverse {
          animation: orbRotateRev 4.5s linear infinite;
        }
        .orb-spin-fast {
          animation: orbRotate 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .orb-spin-normal {
          animation: orbRotate 0.9s linear infinite;
        }
        .orb-ping-slow {
          animation: orbPingSlow 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .orb-ping-delayed {
          animation: orbPingSlow 2.2s cubic-bezier(0, 0, 0.2, 1) infinite 0.7s;
        }
        .orb-sweep {
          animation: orbSweep 1.8s ease-in-out infinite;
        }
        .orb-dot-1 {
          animation: orbDotJump 1.2s ease-in-out infinite;
        }
        .orb-dot-2 {
          animation: orbDotJump 1.2s ease-in-out infinite 0.2s;
        }
        .orb-dot-3 {
          animation: orbDotJump 1.2s ease-in-out infinite 0.4s;
        }
        .orb-pulse {
          animation: orbPulseSlow 2s ease-in-out infinite;
        }
        .orb-pulse-fast {
          animation: orbPulseSlow 1s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .orb-breathe,
          .orb-rotate-slow,
          .orb-rotate-reverse,
          .orb-spin-fast,
          .orb-spin-normal,
          .orb-ping-slow,
          .orb-ping-delayed,
          .orb-sweep,
          .orb-dot-1,
          .orb-dot-2,
          .orb-dot-3,
          .orb-pulse,
          .orb-pulse-fast {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
};
