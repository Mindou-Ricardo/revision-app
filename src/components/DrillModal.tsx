'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Item, DrillMode } from '@/types';
import { sound } from '@/lib/sound';
import confetti from 'canvas-confetti';
import {
  X,
  Keyboard,
  Mic,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Zap,
  Volume2,
  VolumeX,
  Timer,
} from 'lucide-react';

interface DrillModalProps {
  item: Item;
  onClose: () => void;
  onSessionComplete: (itemId: string, mode: DrillMode) => void;
  onNextItem?: () => void;
  hasNextItem?: boolean;
}

export function DrillModal({
  item,
  onClose,
  onSessionComplete,
  onNextItem,
  hasNextItem,
}: DrillModalProps) {
  const [repCount, setRepCount] = useState<number>(0);
  const [mode, setMode] = useState<DrillMode>(item.type === 'command' ? 'typing' : 'verbal');
  const [typedInput, setTypedInput] = useState<string>('');
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [feedbackAnim, setFeedbackAnim] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getIsMuted());

  // Chronomètre de fluidité
  const [startTime, setStartTime] = useState<number>(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const TARGET_REPS = 21;

  // Prononciation vocale (Text-to-Speech natif)
  const speakTargetText = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(item.target_text);
    utterance.lang = item.type === 'command' ? 'en-US' : 'fr-FR';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // Auto-focus l'input à l'ouverture
  useEffect(() => {
    if (mode === 'typing' && !isFinished) {
      inputRef.current?.focus();
    }
  }, [mode, isFinished]);

  // Raccourci clavier Espace pour le mode oral
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;

      if (mode === 'verbal') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          incrementRepetition();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, repCount, isFinished]);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#38bdf8', '#ffffff', '#1e40af'],
      });
    } catch {
      // Ignorer si indisponible
    }
  };

  const incrementRepetition = () => {
    const nextCount = repCount + 1;
    setRepCount(nextCount);
    setTypedInput('');

    // Feedback sonore & visuel
    setFeedbackAnim(true);
    setTimeout(() => setFeedbackAnim(false), 200);

    if (nextCount < TARGET_REPS) {
      sound.playRepetitionTick(nextCount);
    } else {
      // 21 répétitions atteintes !
      const totalSec = Math.round((Date.now() - startTime) / 1000);
      setElapsedSeconds(totalSec);
      setIsFinished(true);
      sound.playVictoryChime();
      triggerConfetti();
      onSessionComplete(item.id, mode);
    }
  };

  // Gestion de la frappe en temps réel
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTypedInput(val);

    // Comparaison exacte (sans espaces superflus en début/fin)
    if (val.trim() === item.target_text.trim()) {
      incrementRepetition();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (typedInput.trim() === item.target_text.trim()) {
        incrementRepetition();
      }
    }
  };

  const currentStreak = item.progress?.current_streak || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Top Bar */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50">
              {item.category}
            </span>
            <span className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
              {item.type === 'command' ? 'Commande' : 'Définition'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Sound Mute Toggle */}
            <button
              onClick={toggleSound}
              title={isMuted ? 'Activer le son' : 'Couper le son'}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            </button>

            {/* Mode Switcher */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-xs font-medium border border-zinc-200/60 dark:border-zinc-700/60">
              <button
                onClick={() => setMode('typing')}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-md transition-colors ${
                  mode === 'typing'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span className="text-xs">Frappe</span>
              </button>
              <button
                onClick={() => setMode('verbal')}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-md transition-colors ${
                  mode === 'verbal'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span className="text-xs">Oral</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 md:p-8 flex flex-col items-center text-center overflow-y-auto max-h-[calc(90vh-60px)]">
          {!isFinished ? (
            <>
              {/* Question / Title */}
              <h2 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 max-w-lg">
                {item.title}
              </h2>

              {/* Target Snippet Box */}
              <div className="w-full bg-zinc-950 dark:bg-black text-zinc-100 rounded-2xl p-5 mb-6 text-left border border-zinc-800 shadow-inner relative group">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>Texte cible à répéter (21x)</span>
                    <button
                      type="button"
                      onClick={speakTargetText}
                      title="Écouter la prononciation vocale"
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-blue-400 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                  </div>
                  <span className="text-blue-400 font-mono font-bold">Répétition {repCount + 1} / 21</span>
                </div>
                <div className="font-mono text-sm md:text-base text-blue-300 font-semibold select-all break-all">
                  {item.target_text}
                </div>
                {item.explanation && (
                  <p className="mt-3 text-xs text-zinc-400 border-t border-zinc-800/80 pt-2 italic">
                    💡 {item.explanation}
                  </p>
                )}
              </div>

              {/* 21 Reps Indicator Dots */}
              <div className="w-full mb-6">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
                  <span>Progression de la série</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    {repCount} / 21 validées ({21 - repCount} restantes)
                  </span>
                </div>
                {/* Visual grid of 21 dots */}
                <div className="grid grid-cols-[repeat(21,minmax(0,1fr))] gap-1 w-full bg-zinc-100 dark:bg-zinc-800/50 p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
                  {Array.from({ length: TARGET_REPS }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-4 rounded-xs transition-all duration-300 ${
                        idx < repCount
                          ? 'bg-blue-600 dark:bg-blue-500 shadow-xs shadow-blue-500/50 scale-105'
                          : idx === repCount
                          ? 'bg-blue-300 dark:bg-blue-800 animate-pulse'
                          : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                      title={`Répétition ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Interaction zone based on mode */}
              {mode === 'typing' ? (
                <div className="w-full">
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={typedInput}
                      onChange={handleInputChange}
                      onKeyDown={handleInputKeyDown}
                      placeholder="Tape la commande ou définition exacte ici..."
                      className={`w-full px-4 py-3.5 font-mono text-sm md:text-base rounded-xl border bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        feedbackAnim
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                          : 'border-zinc-300 dark:border-zinc-700'
                      }`}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 text-left">
                    ⚡ <strong>Automatisme :</strong> Dès que le texte correspond, le champ s&apos;efface et le compteur s&apos;incrémente.
                  </p>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center">
                  <button
                    onClick={incrementRepetition}
                    className="w-full py-5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-lg shadow-lg shadow-blue-600/30 flex items-center justify-center gap-3 transition-all"
                  >
                    <Volume2 className="w-6 h-6" />
                    <span>J&apos;ai répété 1 fois</span>
                    <span className="text-xs bg-blue-700/80 px-2 py-1 rounded font-mono">
                      Espace / Entrée
                    </span>
                  </button>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    Récite à voix haute, puis appuie sur le bouton ou la touche{' '}
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[10px]">
                      Espace
                    </kbd>
                    .
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Celebration Screen when 21 reps are completed */
            <div className="py-6 flex flex-col items-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-1">
                21 Répétitions Validées !
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6">
                L&apos;ancrage neurologique et musculaire pour aujourd&apos;hui est terminé.
              </p>

              {/* Stats badges */}
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-8 w-full max-w-md">
                {/* Streak */}
                <div className="flex-1 flex items-center gap-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 rounded-2xl px-4 py-3 w-full">
                  <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 fill-current" />
                  <div className="text-left">
                    <div className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold uppercase tracking-wider">
                      Série consécutive
                    </div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Jour {currentStreak + 1} / {item.target_days}
                    </div>
                  </div>
                </div>

                {/* Speed / Timer */}
                <div className="flex-1 flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3 w-full">
                  <Timer className="w-5 h-5 text-zinc-600 dark:text-zinc-300 shrink-0" />
                  <div className="text-left">
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                      Temps total
                    </div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {elapsedSeconds} secondes
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => {
                    setRepCount(0);
                    setIsFinished(false);
                    setStartTime(Date.now());
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Refaire une série</span>
                </button>
                {hasNextItem && onNextItem ? (
                  <button
                    onClick={() => {
                      setRepCount(0);
                      setIsFinished(false);
                      setStartTime(Date.now());
                      onNextItem();
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md shadow-blue-600/25 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Notion suivante</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md shadow-blue-600/25 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Terminer</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
