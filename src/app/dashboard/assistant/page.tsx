'use client';

import React, { useState, useRef, useEffect, Children, isValidElement } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import SuggestedQuestions from '@/components/chat/SuggestedQuestions';
import { useFetchChatSessions, useCreateChatSession, useDeleteChatSession } from '@/hooks/useChatSessions';
import { useFetchChatMessages, useCreateChatMessage } from '@/hooks/useChatMessages';
import { useAiTaxContext } from '@/hooks/useAiTaxContext';
import { supabase } from '@/lib/supabase';
import { useAlert } from '@/contexts/AlertContext';
import AIResponseWrapper from '@/components/AIResponseWrapper';



// Lists of available Personas and Tones
const PERSONA_LIST: Record<string, { name: string; emoji: string; desc: string }> = {
  karyawan: { name: 'Karyawan', emoji: '🏢', desc: 'Analogi slip gaji, tunjangan, bukti potong' },
  umkm: { name: 'UMKM', emoji: '🏪', desc: 'Analogi omzet, kas harian, pelanggan' },
  pengusaha: { name: 'Pengusaha', emoji: '📈', desc: 'Analogi cashflow, biaya usaha, ekspansi' },
  investor: { name: 'Investor', emoji: '💹', desc: 'Analogi dividen, capital gain, portofolio' },
  properti: { name: 'Pemilik Aset', emoji: '🏠', desc: 'Analogi sewa, tanah, bangunan, harta' },
  keluarga: { name: 'Keluarga', emoji: '👨‍👩‍👧', desc: 'Analogi PTKP, tanggungan, rumah tangga' },
  pensiunan: { name: 'Pensiunan', emoji: '🧓', desc: 'Analogi pensiun, dana hari tua, pasif income' },
  konsultan: { name: 'Konsultan/Akuntan', emoji: '🧾', desc: 'Analogi rekonsiliasi, dokumen, kepatuhan' },
  umum: { name: 'Umum', emoji: '🌐', desc: 'Analogi sehari-hari sederhana' },
  gamer: { name: 'Gamer', emoji: '🎮', desc: 'Analogi leveling up, quest, boss fight' },
  kpop: { name: 'K-Popers', emoji: '🎤', desc: 'Analogi comeback, bias, photocard' },
  bola: { name: 'Pemain Bola', emoji: '⚽', desc: 'Analogi gol, penalty, kartu kuning' },
  traveler: { name: 'Traveler', emoji: '✈️', desc: 'Analogi boarding pass, itinerary' },
  otaku: { name: 'Otaku', emoji: '🌸', desc: 'Analogi anime, nakama, jurus ulti' },
  freelancer: { name: 'Freelancer', emoji: '💻', desc: 'Analogi gig, invoice, revisi klien' },
  barista: { name: 'Barista', emoji: '☕', desc: 'Analogi espresso, latte art, roasting' },
  creator: { name: 'Content Creator', emoji: '📹', desc: 'Analogi algoritma, subscribers, endorse' },
  pelajar: { name: 'Pelajar', emoji: '🎓', desc: 'Analogi ujian, PR mendadak, uang jajan' }
};

const TONE_LIST: Record<string, { name: string; emoji: string; desc: string }> = {
  jelas: { name: 'Netral & Jelas', emoji: '🧭', desc: 'Bahasa umum, tenang, mudah dipahami' },
  eksekutif: { name: 'Ringkas Eksekutif', emoji: '📌', desc: 'Langsung ke poin untuk keputusan cepat' },
  step: { name: 'Langkah Demi Langkah', emoji: '🪜', desc: 'Terstruktur dari awal sampai akhir' },
  patuh: { name: 'Patuh Regulasi', emoji: '🛡️', desc: 'Berbasis aturan, dokumen, dan risiko' },
  empatik: { name: 'Empatik', emoji: '🤝', desc: 'Menenangkan untuk kasus pajak yang bikin cemas' },
  gaul: { name: 'Santai & Gaul', emoji: '😎', desc: 'Bahasa anak muda santai & asik' },
  formal: { name: 'Profesional', emoji: '💼', desc: 'Sopan & rapi layaknya konsultan' },
  humor: { name: 'Kocak & Humor', emoji: '😂', desc: 'Penuh joke santai & menghibur' },
  simple: { name: 'Sederhana', emoji: '👶', desc: 'Simpel seolah untuk anak 10 tahun' }
};

interface CustomPersona {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  instruction: string;
}

const CUSTOM_PERSONA_ICONS = ['✨', '🏢', '🏪', '📈', '💹', '🏠', '🧾', '⚖️', '🩺', '🌾', '🚚', '🛒', '🏭', '🎨', '💻', '📚'];



// Komponen Kuis Interaktif Kustom (ChatQuiz) - Gamified Multi-Question Wizard (Screenshot 1-4)
function ChatQuiz({ content, isGenerating }: { content: string; isGenerating?: boolean }) {
  interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
  }

  type QuizPayload = {
    quizzes?: QuizQuestion[];
    question?: string;
    options?: string[];
    correctAnswerIndex?: number;
    explanation?: string;
    reward?: {
      title?: string;
      xp?: number;
    };
  };

  interface QuizReward {
    title: string;
    xp: number;
  }

  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [reward, setReward] = useState<QuizReward | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [parseError, setParseError] = useState(false);
  
  // Gamifikasi: Mulai Quiz Cover & Timer
  const [quizStarted, setQuizStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [startCountdown, setStartCountdown] = useState<number | null>(null);

  // Parse JSON data kuis dengan mekanisme recovery regex canggih
  useEffect(() => {
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```(json|quiz)?/, '').replace(/```$/, '');
      }
      cleanContent = cleanContent.trim();
      
      let parsed: QuizPayload | null = null;
      try {
        parsed = JSON.parse(cleanContent) as QuizPayload;
      } catch {
        // Upayakan recovery parsial menggunakan Regex jika JSON belum lengkap selama streaming
        const questions: QuizQuestion[] = [];
        const questionRegex = /"question"\s*:\s*"([^"]+)"/g;
        const optionsRegex = /"options"\s*:\s*\[([^\]]+)\]/g;
        const correctRegex = /"correctAnswerIndex"\s*:\s*(\d+)/g;
        const explanationRegex = /"explanation"\s*:\s*"([^"]+)"/g;
        
        let qMatch;
        const qTexts: string[] = [];
        while ((qMatch = questionRegex.exec(cleanContent)) !== null) {
          qTexts.push(qMatch[1]);
        }
        
        let oMatch;
        const oArrays: string[][] = [];
        while ((oMatch = optionsRegex.exec(cleanContent)) !== null) {
          const opts = oMatch[1].split(',').map(s => s.replace(/"/g, '').trim());
          oArrays.push(opts);
        }
        
        let cMatch;
        const cIndices: number[] = [];
        while ((cMatch = correctRegex.exec(cleanContent)) !== null) {
          cIndices.push(parseInt(cMatch[1], 10));
        }
        
        let eMatch;
        const eTexts: string[] = [];
        while ((eMatch = explanationRegex.exec(cleanContent)) !== null) {
          eTexts.push(eMatch[1]);
        }
        
        const minLength = Math.min(qTexts.length, oArrays.length);
        for (let i = 0; i < minLength; i++) {
          questions.push({
            question: qTexts[i],
            options: oArrays[i],
            correctAnswerIndex: cIndices[i] !== undefined ? cIndices[i] : 0,
            explanation: eTexts[i] || 'Jawaban yang tepat!'
          });
        }
        
        if (questions.length > 0) {
          parsed = { quizzes: questions };
        } else {
          throw new Error("Gagal mengurai quiz");
        }
      }
      
      if (parsed && Array.isArray(parsed.quizzes) && parsed.quizzes.length > 0) {
        setQuizzes(parsed.quizzes);
        setReward({
          title: parsed.reward?.title || 'TAX-FREE MASTER',
          xp: parsed.reward?.xp ?? 600,
        });
        setParseError(false);
      } else if (parsed && parsed.question && Array.isArray(parsed.options)) {
        // Fallback untuk kuis model lama (single question)
        setQuizzes([{
          question: parsed.question,
          options: parsed.options,
          correctAnswerIndex: parsed.correctAnswerIndex !== undefined ? parsed.correctAnswerIndex : 0,
          explanation: parsed.explanation || ''
        }]);
        setReward({ title: 'TAX APPRENTICE', xp: 200 });
        setParseError(false);
      } else {
        setParseError(true);
      }
    } catch {
      setParseError(true);
    }
  }, [content]);

  // Pre-quiz 3-second Countdown Effect
  useEffect(() => {
    if (startCountdown === null) return;
    if (startCountdown === 0) {
      const timer = setTimeout(() => {
        setStartCountdown(null);
        setQuizStarted(true);
        setTimeLeft(30);
      }, 800);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setStartCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [startCountdown]);

  // Timer Effect
  useEffect(() => {
    if (!quizStarted || isSubmitted || showSummary || quizzes.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Waktu habis!
          setIsSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, isSubmitted, showSummary, quizzes, currentIdx]);

  const handleRetry = () => {
    setCurrentIdx(0);
    setSelectedIdx(null);
    setIsSubmitted(false);
    setScore(0);
    setShowSummary(false);
    setQuizStarted(false);
    setStartCountdown(3);
  };

  if (parseError) {
    if (isGenerating) {
      return (
        <div className="my-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center animate-pulse">
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mb-3 text-xl">
            🎯
          </div>
          <p className="text-xs font-bold text-blue-400">Feyn sedang meracik tantangan kuis untukmu...</p>
          <p className="text-[10px] text-slate-500 mt-1">Harap tunggu sebentar, persiapkan dirimu! 📝</p>
        </div>
      );
    }
    return (
      <pre className="bg-slate-950 p-4 rounded-2xl text-xs overflow-x-auto text-slate-400 border border-slate-800 max-w-full font-mono select-text">
        {content}
      </pre>
    );
  }

  if (quizzes.length === 0) return null;

  // Countdown Screen overlay (pulsing beautiful double numbers with aura)
  if (startCountdown !== null) {
    return (
      <div className="my-5 bg-gradient-to-br from-indigo-950/80 to-blue-950/80 border border-blue-500/35 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-250 text-center select-none flex flex-col items-center justify-center min-h-[220px]">
        <div className="absolute top-0 inset-x-0 h-[4px] bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400"></div>
        
        <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-500/10 border-2 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.35)] animate-pulse">
          <span className="text-4xl sm:text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-ping absolute">
            {startCountdown === 0 ? '🏁' : startCountdown}
          </span>
          <span className="text-4xl sm:text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">
            {startCountdown === 0 ? '🏁' : startCountdown}
          </span>
        </div>
        
        <h4 className="text-base sm:text-lg font-black text-white tracking-wide mt-6 animate-pulse">
          {startCountdown === 0 ? 'MULAI! 🚀' : 'Bersiaplah...'}
        </h4>
        <p className="text-xs text-blue-300 font-bold mt-1.5">Kuis akan dimulai dalam hitungan mundur.</p>
      </div>
    );
  }

  // Cover Screen (Tantangan Feyn! - Screenshot 2)
  if (!quizStarted) {
    return (
      <div className="my-5 bg-slate-900/60 border border-blue-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-250 text-center select-none">
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>
        <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg">
          🎯
        </div>
        <h4 className="text-base sm:text-lg font-black text-white tracking-wide">Tantangan Feyn! ({quizzes.length} Soal)</h4>
        <p className="text-xs text-slate-400 mt-1.5 mb-6 max-w-sm mx-auto leading-relaxed">Berapa banyak yang sudah kamu pahami? Yuk kita tes!</p>
        
        <button
          onClick={() => {
            setStartCountdown(3);
          }}
          className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto uppercase tracking-wider cursor-pointer"
        >
          ▶️ Mulai Kuis
        </button>
      </div>
    );
  }

  const currentQuiz = quizzes[currentIdx];
  const isCorrect = selectedIdx === currentQuiz?.correctAnswerIndex;

  const handleSelect = (idx: number) => {
    if (isSubmitted) return;
    setSelectedIdx(idx);
  };

  const handleVerify = () => {
    if (selectedIdx === null) return;
    setIsSubmitted(true);
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < quizzes.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedIdx(null);
      setIsSubmitted(false);
      setTimeLeft(30);
    } else {
      setShowSummary(true);
    }
  };

  // Summary Screen (Screenshot 4)
  if (showSummary) {
    const isPerfect = score === quizzes.length;
    return (
      <div className="my-5 bg-gradient-to-br from-indigo-950/80 to-blue-950/80 border border-blue-500/35 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-250 text-center select-none">
        <div className="absolute top-0 inset-x-0 h-[4px] bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400"></div>
        
        {/* Glowing Trophy Icon */}
        <div className="w-16 h-16 bg-blue-500/10 border-2 border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-[0_0_25px_rgba(59,130,246,0.2)] animate-bounce">
          🏆
        </div>
        
        <h4 className="text-lg font-black text-white tracking-wide">Kuis Selesai!</h4>
        <p className="text-xs text-blue-300 font-bold mt-1">Skor Kamu: {score} dari {quizzes.length}</p>
        
        <div className="inline-block mt-3 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-[10px] sm:text-xs font-black uppercase tracking-wider text-blue-400 shadow-inner">
          ACHIEVEMENT UNLOCKED: {isPerfect ? 'TAX-FREE MASTER' : score >= quizzes.length / 2 ? 'TAX SCHOLAR' : 'TAX APPRENTICE'}
        </div>

        {reward && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <div className="px-5 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 shadow-lg">
              <span className="text-sm">✨</span>
              <span className="text-xs font-extrabold text-blue-400">
                +{isPerfect ? reward.xp : Math.round(reward.xp * (score / quizzes.length))} XP
              </span>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 shadow-lg">
              <span className="text-xs">📈</span>
              <span className="text-xs font-extrabold text-slate-300">
                Lvl {Math.min(5, Math.max(1, Math.round(score * 1.5)))}
              </span>
            </div>
          </div>
        )}

        {/* Retry Button if score is not perfect */}
        {!isPerfect && (
          <div className="mt-8 flex justify-center animate-in fade-in slide-in-from-top-3 duration-300">
            <button
              type="button"
              onClick={handleRetry}
              className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:scale-105 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
            >
              🔄 Coba Lagi
            </button>
          </div>
        )}
      </div>
    );
  }

  // Active Question (Screenshot 3)
  return (
    <div className="my-5 bg-slate-900/60 border border-slate-800/85 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-250 select-none">
      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>

      {/* Header Info */}
      <div className="flex items-center justify-between mb-4.5">
        <span className="px-3.5 py-1.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-inner">
          {currentIdx + 1}/{quizzes.length} Mini Quiz
        </span>
        
        {/* Timer UI (Pill Badge) */}
        <div className={`px-3 py-1 rounded-full border text-[10px] sm:text-xs font-black flex items-center gap-1.5 ${
          timeLeft <= 10 
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse' 
            : 'bg-slate-950/60 border-slate-800 text-slate-400'
        }`}>
          <span>⏱️</span>
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* Timer Bar (Linear count down) */}
      <div className="w-full h-1 bg-slate-950 rounded-full mb-5 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${
            timeLeft <= 10 ? 'bg-rose-500' : 'bg-blue-500'
          }`}
          style={{ width: `${(timeLeft / 30) * 100}%` }}
        />
      </div>

      {/* Question Text (Full text wrapping) */}
      <h4 className="text-[14px] sm:text-[15px] font-black text-white leading-relaxed mb-4.5 whitespace-normal break-words select-text">
        {currentQuiz.question}
      </h4>

      {/* Options Cards */}
      <div className="space-y-2 mb-5">
        {currentQuiz.options.map((option, idx) => {
          let optionStyle = "border-slate-800 hover:bg-slate-900/50 hover:border-slate-755 text-slate-300";
          if (selectedIdx === idx) {
            optionStyle = "bg-blue-500/10 border-blue-500/50 text-blue-300 ring-2 ring-blue-500/20";
          }
          if (isSubmitted) {
            if (idx === currentQuiz.correctAnswerIndex) {
              optionStyle = "bg-blue-500/20 border-blue-500 text-blue-400 font-extrabold";
            } else if (selectedIdx === idx) {
              optionStyle = "bg-rose-500/10 border-rose-500 text-rose-400 line-through";
            } else {
              optionStyle = "opacity-50 border-slate-950 text-slate-500";
            }
          }

          return (
            <button
              type="button"
              key={idx}
              disabled={isSubmitted}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs md:text-sm border font-bold transition-all duration-200 focus:outline-none flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[9px] font-black flex-shrink-0 ${
                  isSubmitted && idx === currentQuiz.correctAnswerIndex
                    ? 'bg-blue-500 border-blue-500 text-slate-950'
                    : isSubmitted && selectedIdx === idx
                    ? 'bg-rose-500 border-rose-500 text-white'
                    : selectedIdx === idx
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="whitespace-normal break-words leading-snug min-w-0 flex-1">{option}</span>
              </div>

              {/* Check/Cross Icon (Screenshot 3 style) */}
              {isSubmitted && idx === currentQuiz.correctAnswerIndex && (
                <span className="text-blue-400 font-extrabold text-sm flex-shrink-0">✓</span>
              )}
              {isSubmitted && selectedIdx === idx && idx !== currentQuiz.correctAnswerIndex && (
                <span className="text-rose-400 font-extrabold text-sm flex-shrink-0">✗</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Alert / Explanation Box & Action Button */}
      {!isSubmitted ? (
        <button
          disabled={selectedIdx === null}
          onClick={handleVerify}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 font-extrabold text-white rounded-2xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] text-[11px] uppercase tracking-wider cursor-pointer"
        >
          Periksa Jawaban
        </button>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-2.5 md:max-w-[75%] w-full">
            <span className="text-xl mt-0.5">{timeLeft === 0 && selectedIdx === null ? '⏰' : isCorrect ? '🌟' : '❌'}</span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                {timeLeft === 0 && selectedIdx === null 
                  ? 'Waktu Habis!' 
                  : isCorrect 
                  ? 'Bener Banget!' 
                  : 'Salah, Tapi Tenang!'}
              </p>
              <p className="text-[11px] font-semibold text-slate-300 mt-0.5 leading-relaxed">
                <span className="font-extrabold text-white">Penjelasan Singkat:</span> {currentQuiz.explanation}
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-500 font-extrabold text-white rounded-2xl transition-all text-[10px] uppercase tracking-widest cursor-pointer whitespace-nowrap self-stretch md:self-center flex items-center justify-center shadow-lg"
          >
            {currentIdx + 1 < quizzes.length ? 'Pertanyaan Selanjutnya ➔' : 'Lihat Hasil Kuis 🏆'}
          </button>
        </div>
      )}
    </div>
  );
}

// Icon Segitiga Peringatan SVG
function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

// Icon Trash / Delete SVG
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

export default function AssistantPage() {
  const { showAlert } = useAlert();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isComposingNewChat, setIsComposingNewChat] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isTableMissing, setIsTableMissing] = useState(false);

  // States for Persona and Tone customization
  const [persona, setPersona] = useState('umum');
  const [tone, setTone] = useState('jelas');
  const [tempPersona, setTempPersona] = useState('umum');
  const [tempTone, setTempTone] = useState('jelas');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customPersonas, setCustomPersonas] = useState<CustomPersona[]>([]);
  const [newPersonaName, setNewPersonaName] = useState('');
  const [newPersonaIcon, setNewPersonaIcon] = useState(CUSTOM_PERSONA_ICONS[0]);
  const [newPersonaAnalogy, setNewPersonaAnalogy] = useState('');
  const [pendingDeleteSession, setPendingDeleteSession] = useState<{ id: string; title: string } | null>(null);

  // Hooks
  const { data: sessions, error: sessionsError, refetch: refetchSessions } = useFetchChatSessions();
  const createSession = useCreateChatSession();
  const deleteSession = useDeleteChatSession();
  const { data: dbMessages = [] } = useFetchChatMessages(activeSessionId);
  const createMessage = useCreateChatMessage();
  const { data: aiTaxContext } = useAiTaxContext();

  // Stream state
  const [tempMessage, setTempMessage] = useState<string>('');

  useEffect(() => {
    const savedPersona = localStorage.getItem('feyn_persona');
    const savedTone = localStorage.getItem('feyn_tone');
    const savedCustomPersonas = localStorage.getItem('feyn_custom_personas');
    if (savedPersona) { setPersona(savedPersona); setTempPersona(savedPersona); }
    if (savedTone) { setTone(savedTone); setTempTone(savedTone); }
    if (savedCustomPersonas) {
      try {
        const parsed = JSON.parse(savedCustomPersonas);
        if (Array.isArray(parsed)) setCustomPersonas(parsed);
      } catch {
        localStorage.removeItem('feyn_custom_personas');
      }
    }
  }, []);

  const allPersonas: Record<string, { name: string; emoji: string; desc: string; instruction?: string }> = {
    ...PERSONA_LIST,
    ...customPersonas.reduce<Record<string, { name: string; emoji: string; desc: string; instruction: string }>>((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {}),
  };

  useEffect(() => {
    if (sessionsError && sessionsError.message.includes('Tabel chat_sessions belum dibuat')) {
      setIsTableMissing(true);
    } else {
      setIsTableMissing(false);
    }
  }, [sessionsError]);

  // Set default active session
  useEffect(() => {
    if (!activeSessionId && !isComposingNewChat && sessions && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId, isComposingNewChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [dbMessages, tempMessage, isLoading]);

  // Handler Simpan Kustomisasi Persona dan Tone
  const handleSaveSettings = (selectedP: string, selectedT: string) => {
    setPersona(selectedP);
    setTone(selectedT);
    localStorage.setItem('feyn_persona', selectedP);
    localStorage.setItem('feyn_tone', selectedT);
    setIsSettingsOpen(false);
  };

  const handleCreateCustomPersona = async () => {
    const name = newPersonaName.trim();
    const analogy = newPersonaAnalogy.trim();
    if (name.length < 2 || analogy.length < 8) {
      await showAlert('Validasi', 'Isi nama persona minimal 2 karakter dan gaya analogi minimal 8 karakter.', 'warning');
      return;
    }

    const customPersona: CustomPersona = {
      id: `custom_${Date.now()}`,
      name,
      emoji: newPersonaIcon,
      desc: analogy.length > 58 ? `${analogy.slice(0, 55)}...` : analogy,
      instruction: `Gunakan persona custom bernama "${name}". Jelaskan pajak dengan analogi dan sudut pandang berikut: ${analogy}. Tetap akurat, patuh regulasi pajak Indonesia, dan hindari asumsi berlebihan.`,
    };

    const nextCustomPersonas = [...customPersonas, customPersona];
    setCustomPersonas(nextCustomPersonas);
    localStorage.setItem('feyn_custom_personas', JSON.stringify(nextCustomPersonas));
    setTempPersona(customPersona.id);
    setNewPersonaName('');
    setNewPersonaAnalogy('');
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    setPendingDeleteSession({ id, title });
  };

  const confirmDeleteSession = () => {
    if (!pendingDeleteSession) return;
    const sessionId = pendingDeleteSession.id;

    deleteSession.mutate(sessionId, {
      onSuccess: () => {
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
          setIsComposingNewChat(true);
        }
        setPendingDeleteSession(null);
      },
      onError: () => {
        setPendingDeleteSession(null);
      }
    });
  };

  // Mengirim Pesan & Memproses Stream Response dari API
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;
    if (isTableMissing) {
      setTempMessage('**Error:** Tabel chat Fase 6 belum dibuat. Jalankan SQL migrasi yang tampil di halaman ini terlebih dahulu.');
      return;
    }

    const userMessage = messageText.trim();
    setInput('');
    setIsLoading(true);
    setTempMessage('');

    try {
      let currentSessionId = activeSessionId;
      
      // 1. Ensure we have a session
      if (!currentSessionId) {
        const newSession = await createSession.mutateAsync(userMessage.substring(0, 30));
        currentSessionId = newSession.id;
        setActiveSessionId(currentSessionId);
        setIsComposingNewChat(false);
      } else if (dbMessages.length === 0) {
        // Update title if it's the first message
        await supabase.from('chat_sessions').update({ title: userMessage.substring(0, 30) }).eq('id', currentSessionId);
        refetchSessions();
      }

      // 2. Save User Message to DB
      await createMessage.mutateAsync({
        session_id: currentSessionId,
        role: 'user',
        content: userMessage
      });

      // 3. Format history for API
      const historyForApi = dbMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const activeCustomPersona = customPersonas.find((item) => item.id === persona);
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionData.session?.access_token
            ? { Authorization: `Bearer ${sessionData.session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ 
          message: userMessage, 
          sessionId: currentSessionId,
          persona: persona,
          tone: tone,
          customPersonaInstruction: activeCustomPersona?.instruction || null,
          history: historyForApi
        }),
      });

      // Deteksi header keamanan X-High-Risk dari response backend
      const highRisk = res.headers.get('X-High-Risk') === 'true';

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Terjadi kesalahan pemrosesan.');
      }

      // Memproses Streaming Response Body secara modular
      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (!reader) {
        throw new Error('Streaming tidak didukung oleh browser.');
      }

      let aiResponseText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });
        aiResponseText += textChunk;
        setTempMessage(aiResponseText);
      }

      // 5. Save AI Response to DB
      await createMessage.mutateAsync({
        session_id: currentSessionId,
        role: 'ai',
        content: aiResponseText,
        metadata: { isHighRisk: highRisk, model: res.headers.get('X-Model-Used') }
      });

      setTempMessage('');

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses jawaban AI.';
      setTempMessage(`\n\n**Error:** ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="text-slate-50 selection:bg-blue-500/30 overflow-hidden flex relative font-sans -m-6 md:-m-12" style={{ height: 'calc(100vh - 73px)' }}>

      {/* --- SIDEBAR RIWAYAT SESI (CHAT SESSIONS) --- */}
      <aside className="hidden lg:flex w-72 bg-slate-900/60 backdrop-blur-2xl border-r border-slate-800/80 flex-col z-30 relative flex-shrink-0">
        <div className="p-5 border-b border-slate-800/80 flex flex-col gap-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Kembali ke Dasbor
          </Link>
          <button 
            onClick={() => {
              setActiveSessionId(null);
              setIsComposingNewChat(true);
              setTempMessage('');
              setInput('');
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl transition-all duration-200 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Chat Baru
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          <h3 className="px-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Daftar Sesi Obrolan</h3>
          {(sessions || []).map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  setIsComposingNewChat(false);
                  setTempMessage('');
                }}
                className={`group flex items-center justify-between p-3.5 rounded-2xl cursor-pointer border text-xs font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                    : 'bg-slate-950/20 border-transparent hover:bg-slate-900/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate max-w-[80%]">
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-500' : 'bg-slate-800'} flex-shrink-0`}></span>
                  <span className="truncate">{session.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(e, session.id, session.title)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Hapus sesi"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Sidebar Mobile: Overlay Drawer */}
      {sidebarOpen && (
        <>
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-all duration-250 animate-in fade-in"
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-slate-900/95 backdrop-blur-3xl border-r border-slate-800 z-50 flex flex-col animate-in slide-in-from-left duration-250">
            <div className="p-5 border-b border-slate-800 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                  Kembali
                </Link>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="text-xs font-black text-slate-500 hover:text-white uppercase tracking-wider p-1"
                >
                  Tutup
                </button>
              </div>
              <button 
                onClick={() => {
                  setActiveSessionId(null);
                  setIsComposingNewChat(true);
                  setTempMessage('');
                  setInput('');
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Chat Baru
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <h3 className="px-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Daftar Sesi Obrolan</h3>
              {(sessions || []).map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      setActiveSessionId(session.id);
                      setIsComposingNewChat(false);
                      setTempMessage('');
                      setSidebarOpen(false);
                    }}
                    className={`group flex items-center justify-between p-3.5 rounded-2xl cursor-pointer border text-xs font-semibold ${
                      isActive 
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                        : 'bg-slate-950/20 border-transparent hover:bg-slate-900/50 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate max-w-[80%]">
                      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-500' : 'bg-slate-800'} flex-shrink-0`}></span>
                      <span className="truncate">{session.title}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(e, session.id, session.title)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Hapus sesi"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </aside>
        </>
      )}

      {/* --- AREA CHAT UTAMA --- */}
      <div className="flex-1 flex flex-col overflow-hidden z-10 relative">
        
        {/* Header Utama */}
        <header className="p-4 md:p-5 border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-3.5">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl lg:hidden focus:outline-none transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center border border-blue-500/20 text-blue-400 text-lg font-bold shadow-lg select-none">
                ✨
              </div>
              <div>
                <h1 className="text-base md:text-lg font-black text-white leading-tight flex items-center gap-1.5 select-none">
                  <span className="text-blue-400 font-extrabold">Feyn</span> AI
                </h1>
                <p className="text-[10px] md:text-xs text-slate-500 font-medium select-none">Asisten Konsultan Pajak Analogis</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            {/* Active Persona Badge & Customizer Trigger */}
            <button 
              onClick={() => {
                setTempPersona(persona);
                setTempTone(tone);
                setIsSettingsOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] md:text-xs font-bold hover:bg-blue-600/20 transition-all cursor-pointer shadow-[0_0_10px_rgba(59,130,246,0.1)]"
            >
              <span>{allPersonas[persona]?.emoji}</span>
              <span className="hidden md:inline">Persona: {allPersonas[persona]?.name} ({TONE_LIST[tone]?.name})</span>
              <span className="md:hidden">Set Persona</span>
              <span>⚙️</span>
            </button>

            <div className="hidden sm:flex px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold items-center gap-2 shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              Online
            </div>
          </div>
        </header>

        {/* List Pesan Chat */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-slate-950/20">
          
          {isTableMissing && (
            <ChatMigrationNotice />
          )}

          {!isTableMissing && dbMessages.length === 0 && !tempMessage && (
            <SuggestedQuestions onSelect={(q) => sendMessage(q)} context={aiTaxContext} />
          )}
          
          {dbMessages.map((msg, idx) => {
            const isLastMessage = idx === dbMessages.length - 1;
            const isGenerating = isLastMessage && isLoading;
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}
              >
                
                {/* Balon Chat */}
                <div className={`max-w-[90%] sm:max-w-[85%] md:max-w-[78%] rounded-3xl px-5 py-4 text-xs md:text-sm shadow-xl leading-relaxed relative ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-tr-sm animate-in slide-in-from-right-2' 
                    : 'bg-slate-900/80 backdrop-blur-md border border-slate-800 text-slate-200 rounded-tl-sm animate-in slide-in-from-left-2'
                }`}>
                  {msg.role === 'ai' ? (
                    <div className="prose prose-invert prose-xs md:prose-sm max-w-none prose-p:leading-[1.7] prose-pre:p-0 prose-pre:m-0 prose-pre:bg-transparent">
                      <AIResponseWrapper isHighRisk={(msg as any).metadata?.isHighRisk}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          pre({ children }) {
                            const childrenArray = Children.toArray(children);
                            const isQuiz = childrenArray.some((child) => {
                              if (!isValidElement<{ className?: string; children?: React.ReactNode }>(child)) {
                                return false;
                              }
                              return (
                                child.props.className?.includes('language-quiz') ||
                                String(child.props.children || '').includes('"quizzes"')
                              );
                            });
                            if (isQuiz) {
                              return <>{children}</>;
                            }
                            return (
                              <pre className="my-4 overflow-x-auto rounded-2xl bg-slate-950 border border-slate-700 p-4 font-mono text-xs text-slate-300">
                                {children}
                              </pre>
                            );
                          },
                          hr() {
                            return <hr className="border-slate-800/30 my-6" />;
                          },
                          code({ className, children, ...props }) {
                            const match = /language-quiz/.exec(className || '');
                            const isQuiz = match || className?.includes('language-quiz') || String(children).includes('"quizzes"');
                            if (isQuiz) {
                              return <ChatQuiz content={String(children)} isGenerating={isGenerating} />;
                            }
                            return (
                              <code className="bg-transparent px-0 py-0 rounded-none text-blue-400 font-sans font-bold text-[12px] sm:text-[13px] border-0" {...props}>
                                {children}
                              </code>
                            );
                          },
                          blockquote({ children }) {
                            return (
                              <div className="my-5 p-5 bg-gradient-to-br from-indigo-950/30 to-blue-950/20 border-l-4 border-blue-500 rounded-r-3xl text-slate-300 italic shadow-[inset_0_1px_3px_rgba(59,130,246,0.05)] relative overflow-hidden">
                                <span className="absolute -top-2 -left-1 text-6xl font-serif text-blue-500/10 select-none pointer-events-none">“</span>
                                <div className="relative z-10 text-[13px] sm:text-[14px] leading-[1.7]">{children}</div>
                              </div>
                            );
                          },
                          h3({ children }) {
                            return (
                              <div className="mt-6 mb-4 p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-900/60 border border-blue-500/20 border-l-4 border-l-blue-500 text-white font-black text-xs sm:text-sm flex items-center gap-3 shadow-[0_4px_20px_rgba(59,130,246,0.05)] select-none">
                                {children}
                              </div>
                            );
                          },
                          h4({ children }) {
                            return <h4 className="text-xs font-black text-slate-300 mt-5 mb-2.5 uppercase tracking-wider">{children}</h4>;
                          },
                          strong({ children }) {
                            return (
                              <strong className="text-blue-400 font-black bg-transparent px-0 py-0 rounded-none border-0 inline">
                                {children}
                              </strong>
                            );
                          },
                          p({ children }) {
                            return <p className="text-[13px] sm:text-[14px] leading-[1.7] text-slate-300 mb-4 whitespace-normal break-words">{children}</p>;
                          },
                          ul({ children }) {
                            return <ul className="list-disc pl-5 space-y-2 mb-4 text-[13px] sm:text-[14px] text-slate-300 leading-[1.7]">{children}</ul>;
                          },
                          ol({ children }) {
                            return <ol className="list-decimal pl-5 space-y-2 mb-4 text-[13px] sm:text-[14px] text-slate-300 leading-[1.7]">{children}</ol>;
                          },
                          li({ children }) {
                            return <li className="leading-[1.7] hover:text-slate-200 transition-colors duration-150">{children}</li>;
                          },
                          table({ children }) {
                            return (
                              <div className="overflow-x-auto my-5 rounded-2xl border border-slate-700 bg-slate-950/40 backdrop-blur-sm shadow-xl max-w-full">
                                <table className="w-full text-left border-collapse text-xs sm:text-sm text-slate-300">
                                  {children}
                                </table>
                              </div>
                            );
                          },
                          thead({ children }) {
                            return <thead className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border-b border-slate-700 text-white select-none">{children}</thead>;
                          },
                          th({ children }) {
                            return <th className="p-4 font-black border-r border-slate-700 last:border-r-0 tracking-wide uppercase text-[10px] text-slate-400">{children}</th>;
                          },
                          td({ children }) {
                            const text = Array.isArray(children) 
                              ? children.map(c => String(c)).join('').trim() 
                              : String(children).trim();
                            const pctMatch = /^(\d+(?:\.\d+)?)\s*%$/.exec(text);
                            if (pctMatch) {
                              const value = parseFloat(pctMatch[1]);
                              return (
                                <td className="p-4 border-r border-slate-700 last:border-r-0 border-b border-slate-700 last:border-b-0 font-extrabold text-blue-400">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-xs">{text}</span>
                                    <div className="w-12 h-1.5 bg-slate-950 rounded-full overflow-hidden hidden xs:block">
                                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${Math.min(100, value * 2)}%` }}></div>
                                    </div>
                                  </div>
                                </td>
                              );
                            }
                            return (
                              <td className="p-4 border-r border-slate-700 last:border-r-0 border-b border-slate-700 last:border-b-0 font-medium">
                                {children}
                              </td>
                            );
                          },
                          tr({ children }) {
                            return <tr className="hover:bg-blue-500/5 border-b border-slate-700 last:border-b-0 transition-colors duration-150">{children}</tr>;
                          },
                          a({ href, children }) {
                            return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline font-bold transition-colors">{children}</a>;
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      </AIResponseWrapper>
                    </div>
                  ) : (
                    <p className="text-[13px] md:text-[14px] leading-[1.7] whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
  
                {/* Box Alert Segitiga Peringatan Cerdas untuk Topik Berisiko (Guardrails) */}
                {msg.role === 'ai' && msg.metadata?.isHighRisk && (
                  <div className="mt-3 max-w-[90%] sm:max-w-[85%] md:max-w-[78%] bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl text-xs text-amber-400/90 flex gap-3 shadow-lg animate-in fade-in slide-in-from-top-1 duration-300 relative overflow-hidden backdrop-blur-md">
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-amber-500"></div>
                    <AlertTriangleIcon className="w-5 h-5 flex-shrink-0 text-amber-500 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-[10px] uppercase tracking-wider text-amber-300">Deteksi Risiko / Legal Guardrail</p>
                      <p className="leading-relaxed">Topik ini mengandung pembahasan kasus sengketa, tuntutan, pidana, atau tindakan perpajakan berisiko tinggi. Feyn hanya menyediakan informasi edukatif. Harap konsultasikan lebih lanjut dengan konsultan pajak bersertifikat resmi.</p>
                    </div>
                  </div>
                )}
  
              </div>
            );
          })}

          {/* Streaming temp message */}
          {tempMessage && (
            <div className="flex flex-col items-start animate-in fade-in duration-200">
              <div className="max-w-[90%] sm:max-w-[85%] md:max-w-[78%] rounded-3xl px-5 py-4 text-xs md:text-sm shadow-xl leading-relaxed bg-slate-900/80 backdrop-blur-md border border-slate-800 text-slate-200 rounded-tl-sm">
                <div className="prose prose-invert prose-xs md:prose-sm max-w-none prose-p:leading-[1.7]">
                  <AIResponseWrapper>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{tempMessage}</ReactMarkdown>
                  </AIResponseWrapper>
                </div>
              </div>
            </div>
          )}

          {/* Skeleton Pulse Loading "Meramu jawaban..." */}
          {isLoading && (
            <div className="flex justify-start animate-in fade-in duration-200">
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl rounded-tl-sm px-6 py-4.5 shadow-lg flex items-center gap-3 animate-pulse">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 text-[10px]">✨</span>
                <span className="text-xs md:text-sm font-medium text-slate-400">Meramu penjelasan terbaik untuk Anda...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form Chat */}
        <div className="p-4 bg-slate-950/80 backdrop-blur-xl border-t border-slate-900/80">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }} 
            className="relative max-w-4xl mx-auto flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Tanya seputar pajak, minta kuis, atau ketik apa saja... (Analogi: ${allPersonas[persona]?.name})`}
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-full pl-6 pr-14 py-4 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/35 shadow-inner placeholder:text-slate-500 focus:border-blue-500/50 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2.5 top-2.5 bottom-2.5 w-11 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-500 transition-all disabled:opacity-30 disabled:hover:bg-blue-600 shadow-lg cursor-pointer"
            >
              <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
          </form>
        </div>

      </div>

      {/* --- FLOATING MODAL: DELETE CHAT CONFIRMATION --- */}
      {pendingDeleteSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-session-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-800/90 bg-slate-900/95 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
            <div className="h-1 w-full bg-gradient-to-r from-red-500 via-rose-500 to-blue-500" />
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 text-red-400 shadow-[0_0_18px_rgba(248,113,113,0.12)]">
                  <TrashIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 id="delete-session-title" className="text-sm font-black text-white">
                    Hapus riwayat obrolan?
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    Sesi <span className="font-bold text-slate-200">&quot;{pendingDeleteSession.title || 'Percakapan Baru'}&quot;</span> akan dihapus dari daftar chat. Tindakan ini tidak bisa dibatalkan.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dampak</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Semua pesan di sesi ini ikut hilang dari riwayat. Chat aktif akan dikosongkan bila sesi yang dihapus sedang terbuka.
                </p>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setPendingDeleteSession(null)}
                  className="rounded-2xl border border-slate-700 bg-slate-950/40 px-5 py-3 text-xs font-bold text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteSession}
                  disabled={deleteSession.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 py-3 text-xs font-black text-white shadow-[0_0_18px_rgba(248,113,113,0.22)] transition-all hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <TrashIcon className="h-4 w-4" />
                  {deleteSession.isPending ? 'Menghapus...' : 'Hapus Chat'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- FLOATING MODAL: CUSTOMIZE PERSONA & TONE --- */}
      {isSettingsOpen && (
        <div className="absolute inset-y-0 left-0 right-0 lg:left-72 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-2xl p-6 md:p-8 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-base md:text-lg font-black text-white flex items-center gap-2 select-none">
                  <span>✨ Kustomisasi Persona & Tone Feyn</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 select-none">Menggunakan teknik Feynman untuk mempermudah istilah perpajakan melalui analogi.</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-500 hover:text-white font-bold text-sm p-2 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Persona Section */}
            <div className="mb-6 select-none">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">1. Pilih Persona (Analogi Penjelasan)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.entries(allPersonas).map(([key, data]) => {
                  const isActive = tempPersona === key;
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setTempPersona(key)}
                      className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500/20 text-white'
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-lg">{data.emoji}</span>
                      <div>
                        <p className="text-[11px] font-bold text-white leading-tight">{data.name}</p>
                        <p className="text-[9px] text-slate-500 leading-tight mt-0.5">{data.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-2xl border border-blue-500/15 bg-blue-500/5 p-4">
                <div className="mb-4 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Icon Persona</label>
                  <div className="grid grid-cols-8 gap-2 sm:grid-cols-12">
                    {CUSTOM_PERSONA_ICONS.map((icon) => {
                      const isIconActive = newPersonaIcon === icon;
                      return (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setNewPersonaIcon(icon)}
                          className={`flex aspect-square items-center justify-center rounded-xl border text-base transition-all ${
                            isIconActive
                              ? 'border-blue-500 bg-blue-600/15 text-white ring-1 ring-blue-500/25'
                              : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                          aria-label={`Pilih icon ${icon}`}
                        >
                          {icon}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Create Persona</label>
                    <input
                      type="text"
                      value={newPersonaName}
                      onChange={(event) => setNewPersonaName(event.target.value)}
                      placeholder="Contoh: Dokter, Notaris, Petani"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-xs font-semibold text-white outline-none transition-all focus:border-blue-500/60"
                    />
                  </div>
                  <div className="flex-[1.4] space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gaya Analogi</label>
                    <input
                      type="text"
                      value={newPersonaAnalogy}
                      onChange={(event) => setNewPersonaAnalogy(event.target.value)}
                      placeholder="Contoh: jelaskan seperti mengelola klinik dan jadwal pasien"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-xs font-semibold text-white outline-none transition-all focus:border-blue-500/60"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateCustomPersona}
                    className="rounded-xl bg-blue-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-blue-500"
                  >
                    Tambah
                  </button>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                  Persona custom tersimpan di browser ini dan akan ikut mengarahkan gaya analogi Feyn saat dipilih.
                </p>
              </div>
            </div>

            {/* Tone Section */}
            <div className="mb-8 select-none">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">2. Pilih Tone Respon AI</h4>
              <div className="grid grid-cols-2 gap-2.5">
                {Object.entries(TONE_LIST).map(([key, data]) => {
                  const isActive = tempTone === key;
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setTempTone(key)}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500/20 text-white'
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-lg">{data.emoji}</span>
                      <div>
                        <p className="text-[11px] font-bold text-white leading-tight">{data.name}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{data.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={() => handleSaveSettings(tempPersona, tempTone)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] text-xs uppercase tracking-wider cursor-pointer"
            >
              Simpan & Terapkan Kustomisasi
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
