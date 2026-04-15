/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, Pause, RotateCcw, Droplets, Wind, Maximize2, 
  Hourglass as HourglassIcon, History as HistoryIcon, 
  Snowflake, Plus, Settings2, X, ChevronLeft, Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type View = "ice" | "hourglass" | "history";

interface TimerSession {
  id: string;
  duration: number;
  date: string;
  type: "ice" | "hourglass";
}

export default function App() {
  const [view, setView] = useState<View>("ice");
  const [totalSeconds, setTotalSeconds] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [inputMinutes, setInputMinutes] = useState("1");
  const [inputSeconds, setInputSeconds] = useState("0");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showGlimmer, setShowGlimmer] = useState(true);
  const [showSandStream, setShowSandStream] = useState(true);
  const [hourglassRotation, setHourglassRotation] = useState(0);
  const isFlipped = (hourglassRotation / 180) % 2 === 1;
  const [history, setHistory] = useState<TimerSession[]>(() => {
    const saved = localStorage.getItem("timer-history");
    return saved ? JSON.parse(saved) : [];
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const meltProgress = 1 - timeLeft / totalSeconds;

  useEffect(() => {
    localStorage.setItem("timer-history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setIsFinished(true);
      const newSession: TimerSession = {
        id: Math.random().toString(36).substr(2, 9),
        duration: totalSeconds,
        date: new Date().toISOString(),
        type: view === "history" ? "ice" : view as "ice" | "hourglass",
      };
      setHistory(prev => [newSession, ...prev].slice(0, 50));
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, totalSeconds, view]);

  const toggleTimer = () => {
    if (isFinished) {
      resetTimer();
    } else {
      setIsActive(!isActive);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsFinished(false);
    
    const mins = parseInt(inputMinutes) || 0;
    const secs = parseInt(inputSeconds) || 0;
    const total = mins * 60 + secs;
    setTotalSeconds(total > 0 ? total : 60);
    setTimeLeft(total > 0 ? total : 60);

    if (view === "hourglass") {
      setHourglassRotation(prev => prev + 180);
    }
  };

  const addTime = (seconds: number) => {
    setTotalSeconds(prev => prev + seconds);
    setTimeLeft(prev => prev + seconds);
    setIsFinished(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleInputChange = () => {
    const mins = parseInt(inputMinutes) || 0;
    const secs = parseInt(inputSeconds) || 0;
    const total = mins * 60 + secs;
    if (total > 0) {
      setTotalSeconds(total);
      setTimeLeft(total);
      setIsActive(false);
      setIsFinished(false);
    }
  };

  const currentPhase = meltProgress < 0.3 ? "01" : meltProgress < 0.7 ? "02" : "03";
  const phaseTitle = view === "ice" 
    ? (meltProgress < 0.3 ? "Phase: Solidification" : meltProgress < 0.7 ? "Phase: Submersion" : "Phase: Dissolution")
    : (meltProgress < 0.3 ? "Phase: Accumulation" : meltProgress < 0.7 ? "Phase: Transition" : "Phase: Depletion");

  type DayData = { date: Date, totalDuration: number, sessions: TimerSession[] };
  const groupedHistory = history.reduce((acc, session) => {
    const dateObj = new Date(session.date);
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const dateKey = dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateObj, totalDuration: 0, sessions: [] };
      }
      acc[dateKey].totalDuration += session.duration;
      acc[dateKey].sessions.push(session);
    }
    return acc;
  }, {} as Record<string, DayData>);

  const sortedDays = (Object.entries(groupedHistory) as [string, DayData][]).sort((a, b) => b[1].date.getTime() - a[1].date.getTime());

  const formatTotalTimeHHMMSS = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div 
      onDoubleClick={() => setIsFocusMode(false)}
      className={cn(
        "min-h-screen transition-all duration-1000 font-sans selection:bg-blue-500/30",
        isFocusMode 
          ? "bg-black flex items-center justify-center cursor-none" 
          : "grid grid-cols-[320px_1fr] bg-[#0a0a0c] text-[#f8f9fa]"
      )}
    >
      {/* Left Column: Controls & Navigation */}
      <AnimatePresence>
        {!isFocusMode && (
          <motion.aside 
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            className="p-8 border-r border-white/10 bg-[#0a0a0c] h-screen overflow-y-auto custom-scrollbar relative z-20"
          >
            <div className="space-y-6 min-h-full flex flex-col">
              <div className="brand-section">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-serif italic text-3xl tracking-tight mb-3 flex items-center gap-3"
                >
                  {view === "ice" ? "Thaw." : view === "hourglass" ? "Sands." : "Archive."}
                </motion.div>
                <p className="text-xs leading-relaxed text-[#f8f9fa]/40">
                  {view === "ice" 
                    ? "A temporal study of entropy and phase transitions." 
                    : view === "hourglass" 
                    ? "A study of gravity and the relentless flow of time."
                    : "A record of past temporal observations."}
                </p>
              </div>

              {/* Navigation */}
              <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
                <button 
                  onClick={() => setView("ice")}
                  className={cn("flex-1 py-2 rounded-md transition-all flex justify-center", view === "ice" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60")}
                >
                  <Snowflake className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setView("hourglass")}
                  className={cn("flex-1 py-2 rounded-md transition-all flex justify-center", view === "hourglass" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60")}
                >
                  <HourglassIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setView("history")}
                  className={cn("flex-1 py-2 rounded-md transition-all flex justify-center", view === "history" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60")}
                >
                  <HistoryIcon className="w-4 h-4" />
                </button>
              </div>

              {view !== "history" && (
                <div className="timer-settings space-y-4">
                  <div>
                    <span className="text-[9px] uppercase tracking-[0.15em] text-[#f8f9fa]/40 block mb-1">Remaining Duration</span>
                    <div className="font-serif text-6xl leading-none tabular-nums">
                      {formatTime(timeLeft)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase tracking-widest text-[#f8f9fa]/30">Min</Label>
                      <Input 
                        type="number" 
                        value={inputMinutes}
                        onChange={(e) => setInputMinutes(e.target.value)}
                        onBlur={handleInputChange}
                        className="h-8 bg-transparent border-white/10 text-white focus:ring-0 rounded-none text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase tracking-widest text-[#f8f9fa]/30">Sec</Label>
                      <Input 
                        type="number" 
                        value={inputSeconds}
                        onChange={(e) => setInputSeconds(e.target.value)}
                        onBlur={handleInputChange}
                        className="h-8 bg-transparent border-white/10 text-white focus:ring-0 rounded-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => addTime(30)} className="px-3 py-1 border border-white/10 text-[9px] uppercase tracking-widest hover:bg-white/5 transition-colors">+30s</button>
                    <button onClick={() => addTime(60)} className="px-3 py-1 border border-white/10 text-[9px] uppercase tracking-widest hover:bg-white/5 transition-colors">+1m</button>
                    <button onClick={() => addTime(300)} className="px-3 py-1 border border-white/10 text-[9px] uppercase tracking-widest hover:bg-white/5 transition-colors">+5m</button>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={toggleTimer}
                      className={cn(
                        "flex-1 h-10 text-[10px] uppercase tracking-widest transition-all duration-300 border",
                        isActive 
                          ? "bg-[#f8f9fa] text-[#0a0a0c] border-[#f8f9fa]" 
                          : "bg-transparent text-[#f8f9fa] border-white/40 hover:border-white"
                      )}
                    >
                      {isActive ? "Pause" : isFinished ? "Restart" : "Start"}
                    </button>
                    <button 
                      onClick={resetTimer}
                      className="w-10 h-10 flex items-center justify-center border border-white/20 hover:border-white/40 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  {view === "ice" && (
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-[9px] uppercase tracking-widest text-white/40">Ice Glimmer</span>
                      <button 
                        onClick={() => setShowGlimmer(!showGlimmer)}
                        className={cn("w-8 h-4 rounded-full transition-colors relative", showGlimmer ? "bg-blue-500" : "bg-white/10")}
                      >
                        <motion.div 
                          animate={{ x: showGlimmer ? 16 : 2 }}
                          className="absolute top-1 w-2 h-2 bg-white rounded-full"
                        />
                      </button>
                    </div>
                  )}

                  {view === "hourglass" && (
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-[9px] uppercase tracking-widest text-white/40">Sand Animation</span>
                      <button 
                        onClick={() => setShowSandStream(!showSandStream)}
                        className={cn("w-8 h-4 rounded-full transition-colors relative", showSandStream ? "bg-[#d4a373]" : "bg-white/10")}
                      >
                        <motion.div 
                          animate={{ x: showSandStream ? 16 : 2 }}
                          className="absolute top-1 w-2 h-2 bg-white rounded-full"
                        />
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={() => setIsFocusMode(true)}
                    className="w-full h-10 flex items-center justify-center gap-2 border border-blue-500/20 text-blue-400 text-[10px] uppercase tracking-widest hover:bg-blue-500/10 transition-colors"
                  >
                    <Maximize2 className="w-3 h-3" />
                    Focus Mode
                  </button>
                </div>
              )}

              {view !== "history" && (
                <div className="stats mt-auto space-y-4 pt-6 pb-4 border-t border-white/5">
                  <div className="stat-item">
                    <span className="text-[9px] uppercase tracking-[0.15em] text-[#f8f9fa]/40 block mb-0.5">
                      {view === "ice" ? "Mass Reduction" : "Sand Displacement"}
                    </span>
                    <div className="text-base font-serif italic">{(meltProgress * 100).toFixed(1)}% Completed</div>
                  </div>
                  <div className="stat-item">
                    <span className="text-[9px] uppercase tracking-[0.15em] text-[#f8f9fa]/40 block mb-0.5">Ambient Temp</span>
                    <div className="text-base font-serif italic">{view === "ice" ? "22.4°C / Stable" : "38.2°C / Arid"}</div>
                  </div>
                  <div className="stat-item">
                    <span className="text-[9px] uppercase tracking-[0.15em] text-[#f8f9fa]/40 block mb-0.5">Vessel State</span>
                    <div className="text-base font-serif italic leading-tight">
                      {meltProgress === 0 ? "Initial State" : meltProgress === 1 ? "Terminal State" : "Transition Phase"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Stage */}
      <main className={cn(
        "relative flex justify-center overflow-hidden transition-all duration-1000",
        view === "history" ? "items-start" : "items-center",
        isFocusMode ? "bg-black w-screen h-screen" : "h-screen",
        !isFocusMode && view === "ice" ? "bg-[radial-gradient(circle_at_center,#1a1a2e_0%,#0a0a0c_70%)]" : "",
        !isFocusMode && view === "hourglass" ? "bg-[radial-gradient(circle_at_center,#2c1e12_0%,#0a0a0c_70%)]" : "",
        !isFocusMode && view === "history" ? "bg-[#0a0a0c]" : ""
      )}>
        {view === "history" ? (
          <div className="w-full max-w-2xl p-20 space-y-12 h-full overflow-y-auto custom-scrollbar scroll-smooth">
            <div className="space-y-2">
              <h2 className="font-serif italic text-6xl">Archive.</h2>
              <p className="text-white/40 text-sm tracking-widest uppercase">Last 7 Days of Temporal Observations</p>
            </div>
            
            <div className="space-y-8">
              {sortedDays.length === 0 ? (
                <div className="py-20 text-center border border-white/5 rounded-xl">
                  <p className="text-white/20 font-serif italic">No records found in this temporal window.</p>
                </div>
              ) : (
                sortedDays.map(([dateKey, dayData]) => (
                  <div key={dateKey} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="space-y-1">
                        <h3 className="text-white font-serif italic text-2xl">{dateKey}</h3>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-white/30">Temporal Summary</p>
                      </div>
                      <div className="text-right">
                        <div className="text-blue-400 font-mono text-xl tracking-tighter">
                          {formatTotalTimeHHMMSS(dayData.totalDuration)}
                        </div>
                        <div className="text-[9px] uppercase tracking-widest text-blue-400/40">Total Focus Time</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {dayData.sessions.map((session) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={session.id}
                          className="group flex items-center justify-between p-4 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40">
                              {session.type === "ice" ? <Snowflake className="w-3 h-3" /> : <HourglassIcon className="w-3 h-3" />}
                            </div>
                            <div>
                              <div className="text-md font-serif italic">{formatTime(session.duration)} Session</div>
                              <div className="text-[9px] uppercase tracking-widest text-white/30">
                                {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <div className="text-[9px] uppercase tracking-widest text-white/20 group-hover:text-white/40 transition-colors">
                            {session.type === "ice" ? "Ice Melted" : "Sand Fallen"}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence>
              {!isFocusMode && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="phase-label absolute top-14 right-14 text-right"
                >
                  <motion.div 
                    key={currentPhase}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 0.1, y: 0 }}
                    className="font-serif text-[10rem] leading-[0.8]"
                  >
                    {currentPhase}
                  </motion.div>
                  <div className={cn("text-[10px] tracking-[0.3em] uppercase mt-2", view === "ice" ? "text-[#339af0]" : "text-[#d4a373]")}>
                    {phaseTitle}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative w-[500px] h-[500px] flex items-center justify-center">
              {view === "ice" ? (
                <>
                  {/* The Puddle */}
                  <motion.div 
                    animate={{ 
                      scale: 1 + meltProgress * 1.5,
                      opacity: meltProgress * 0.7,
                      backgroundColor: meltProgress > 0.8 ? "rgba(116, 185, 255, 0.2)" : "rgba(116, 185, 255, 0.15)",
                    }}
                    className="absolute bottom-20 w-[400px] h-[100px] bg-[radial-gradient(ellipse_at_center,rgba(116,185,255,0.15)_0%,transparent_80%)] rounded-[50%] z-0"
                  />
                  
                  {/* Water Ripples */}
                  <motion.div 
                    animate={{ 
                      scale: 1 + meltProgress * 0.6,
                      opacity: meltProgress * 0.4,
                    }}
                    className="absolute bottom-24 w-[320px] h-[30px] border border-blue-400/20 rounded-[50%] [transform:rotateX(60deg)] z-0"
                  />

                  <div className="relative z-10">
                    <motion.div
                      animate={{
                        scale: 1 - meltProgress * 0.95,
                        rotate: meltProgress * 25,
                        borderRadius: meltProgress > 0.05 
                          ? `${40 + meltProgress * 10}% ${60 - meltProgress * 10}% ${65 - meltProgress * 15}% ${35 + meltProgress * 15}% / 40% 40% 60% 60%`
                          : "12%",
                        opacity: 1 - meltProgress * 0.9,
                        y: meltProgress * 80,
                        filter: `blur(${meltProgress * 3}px)`,
                      }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                      className="w-64 h-56 bg-gradient-to-br from-white/50 via-blue-100/30 to-blue-400/10 backdrop-blur-2xl ice-cube-editorial relative flex items-center justify-center overflow-hidden"
                    >
                      {/* Shimmer Effect */}
                      {showGlimmer && (
                        <motion.div 
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                        />
                      )}

                      <motion.div 
                        animate={{ 
                          opacity: 1 - meltProgress,
                          scale: 1 - meltProgress * 0.2
                        }}
                        className="absolute inset-4 border border-white/10 rounded-inherit filter blur-[1px]" 
                      />
                      
                      {showGlimmer && (
                        <motion.div 
                          animate={{ 
                            opacity: [0.2, 0.5, 0.2],
                            rotate: meltProgress * -20
                          }}
                          transition={{ duration: 4, repeat: Infinity }}
                          className="absolute top-4 left-8 w-12 h-1 bg-white/40 blur-[2px] -rotate-45"
                        />
                      )}

                      <AnimatePresence>
                        {isActive && (
                          <motion.div 
                            className="absolute bottom-0 left-1/2 -translate-x-1/2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <motion.div
                              animate={{ 
                                y: [0, 80],
                                opacity: [0, 1, 0],
                                scale: [1, 0.8, 0.5]
                              }}
                              transition={{ 
                                duration: 1.5, 
                                repeat: Infinity,
                                ease: "easeIn"
                              }}
                            >
                              <Droplets className="w-3 h-3 text-blue-300/50 fill-blue-300/10" />
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                </>
              ) : (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  {/* Hourglass SVG */}
                  <motion.svg 
                    animate={{ rotate: hourglassRotation }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    width="300" height="500" viewBox="0 0 300 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10"
                  >
                    {/* Glass Frame - Refined Paths */}
                    <g opacity="0.2">
                      <path d="M50 50 L250 50" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                      <path d="M50 450 L250 450" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                      {/* Top Bulb */}
                      <path d="M60 50 C60 50 60 220 150 250 C240 220 240 50 240 50" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                      {/* Bottom Bulb */}
                      <path d="M60 450 C60 450 60 280 150 250 C240 280 240 450 240 450" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                    </g>

                    {/* Top Sand Mask */}
                    <defs>
                      <clipPath id="topBulbClip">
                        <path d="M60 50 C60 50 60 220 150 250 C240 220 240 50 240 50 Z" />
                      </clipPath>
                      <clipPath id="bottomBulbClip">
                        <path d="M60 450 C60 450 60 280 150 250 C240 280 240 450 240 450 Z" />
                      </clipPath>
                    </defs>

                    {/* Top Sand */}
                    <g clipPath="url(#topBulbClip)">
                      <motion.path
                        animate={{
                          d: `M 40 ${50 + (isFlipped ? 1 - meltProgress : meltProgress) * 200} 
                              Q 150 ${50 + (isFlipped ? 1 - meltProgress : meltProgress) * 200 + (isActive && timeLeft > 0 ? 30 : 10)} 260 ${50 + (isFlipped ? 1 - meltProgress : meltProgress) * 200} 
                              L 260 260 L 40 260 Z`
                        }}
                        transition={{ duration: isFinished || timeLeft === totalSeconds ? 0 : 0.5, ease: "linear" }}
                        fill="#d4a373"
                        fillOpacity="0.7"
                      />
                    </g>

                    {/* Bottom Sand */}
                    <g clipPath="url(#bottomBulbClip)">
                      <motion.path
                        animate={{
                          d: `M 40 450 
                              L 40 ${450 - (isFlipped ? 1 - meltProgress : meltProgress) * 180} 
                              Q 150 ${450 - (isFlipped ? 1 - meltProgress : meltProgress) * 210 - (isActive && timeLeft > 0 ? 25 : 0)} 260 ${450 - (isFlipped ? 1 - meltProgress : meltProgress) * 180} 
                              L 260 450 Z`
                        }}
                        transition={{ duration: isFinished || timeLeft === totalSeconds ? 0 : 0.5, ease: "linear" }}
                        fill="#d4a373"
                        fillOpacity="0.9"
                      />
                    </g>

                    {/* Falling Stream */}
                    {isActive && timeLeft > 0 && showSandStream && (
                      <motion.path
                        d="M 149 250 L 151 250 L 151 450 L 149 450 Z"
                        fill="#d4a373"
                        animate={{ 
                          opacity: [0.4, 0.8, 0.4],
                          scaleX: [1, 1.5, 1]
                        }}
                        transition={{ duration: 0.3, repeat: Infinity }}
                      />
                    )}

                    {/* Sand Particles */}
                    {isActive && timeLeft > 0 && showSandStream && [1, 2, 3, 4, 5].map((i) => (
                      <motion.circle
                        key={i}
                        r="1.2"
                        fill="#d4a373"
                        initial={{ cx: 150, cy: 250, opacity: 0 }}
                        animate={{ 
                          cy: [250, 450 - meltProgress * 180],
                          cx: [150, 150 + (Math.random() - 0.5) * 60],
                          opacity: [0, 1, 0]
                        }}
                        transition={{ 
                          duration: 0.6 + Math.random() * 0.4, 
                          repeat: Infinity, 
                          delay: i * 0.15,
                          ease: "easeIn"
                        }}
                      />
                    ))}
                  </motion.svg>

                  {/* Desert Heat Haze */}
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.05, 0.15, 0.05]
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute inset-0 bg-[#d4a373]/10 blur-[120px] rounded-full"
                  />
                </div>
              )}
            </div>

            <AnimatePresence>
              {!isFocusMode && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="vertical-rule absolute right-10 top-40 bottom-40 w-px" 
                  />

                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="quote absolute bottom-14 right-14 max-w-[300px] text-right"
                  >
                    <p className="font-serif italic text-sm text-[#f8f9fa]/40 leading-relaxed">
                      {view === "ice" 
                        ? "\"Time is a river which sweeps me along, but I am the river; it is a tiger which destroys me, but I am the tiger; it is a fire which consumes me, but I am the fire.\""
                        : "\"The desert, when the sun comes up... I couldn't tell where heaven stopped and the Earth began.\""}
                    </p>
                    <span className="text-[9px] uppercase tracking-widest font-sans text-[#f8f9fa]/20 mt-4 block">
                      {view === "ice" ? "— Jorge Luis Borges" : "— Tom Hanks"}
                    </span>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {isFocusMode && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-[0.3em] text-white"
              >
                Double click to exit
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* Finished State Overlay */}
      <AnimatePresence>
        {isFinished && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-6 p-12 border border-white/10 bg-[#0a0a0c]"
            >
              <div className="font-serif italic text-4xl text-white">
                {view === "ice" ? "Entropy Complete." : "Sands Settled."}
              </div>
              <p className="text-[#f8f9fa]/40 text-sm max-w-xs mx-auto">
                {view === "ice" 
                  ? "The glacier has fully transitioned into its liquid state." 
                  : "The grains of time have reached their final destination."}
              </p>
              <button 
                onClick={resetTimer} 
                className="mt-4 px-8 py-3 bg-[#f8f9fa] text-[#0a0a0c] text-[10px] uppercase tracking-widest hover:bg-white transition-colors"
              >
                {view === "ice" ? "Refreeze" : "Invert"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
