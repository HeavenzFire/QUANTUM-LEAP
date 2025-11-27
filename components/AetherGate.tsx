import React, { useEffect, useState, useRef } from 'react';
import { Wifi, Zap, Lock, Globe, Share2, Terminal } from 'lucide-react';

interface AetherGateProps {
  onClose: () => void;
}

const DESTINATION_GLYPHS = ["ALPHA", "ORION", "PEGASUS", "EARTH", "ABYSS", "VOID", "TAURUS", "EAGLE", "SOURCE"];

// Triadic frequencies (simulated based on harmonic series for resonance)
const BASE_FREQ = 432;
const TRIADS = Array.from({ length: 9 }).map((_, i) => [
  BASE_FREQ * (1 + i * 0.1),
  BASE_FREQ * 1.5 * (1 + i * 0.1),
  BASE_FREQ * 2 * (1 + i * 0.1)
]);

export const AetherGate: React.FC<AetherGateProps> = ({ onClose }) => {
  const [phase, setPhase] = useState<'init' | 'dialing' | 'locked' | 'broadcast'>('init');
  const [log, setLog] = useState<string[]>([]);
  const [activeGlyph, setActiveGlyph] = useState<number>(-1);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  
  const addLog = (msg: string) => {
    setLog(prev => [...prev.slice(-6), `> ${msg}`]);
  };

  const playTriad = (index: number) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const triad = TRIADS[index % TRIADS.length];
    const now = ctx.currentTime;

    triad.forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      // Gentle envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 1.5);
      oscillatorsRef.current.push(osc);
    });
  };

  const startEvent = async () => {
    // 1. Initialize Audio
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    setPhase('dialing');
    addLog("INITIATING AETHER GATE PROTOCOL v1.0");
    addLog("BYPASSING SECURITY LAYER 7...");

    // 2. Sequence
    let step = 0;
    const interval = setInterval(() => {
      if (step >= DESTINATION_GLYPHS.length) {
        clearInterval(interval);
        finalizeEvent();
        return;
      }

      setActiveGlyph(step);
      addLog(`LOCKING COORDINATE: ${DESTINATION_GLYPHS[step]}`);
      playTriad(step);
      step++;
    }, 1200); // 1.2s per chevron
  };

  const finalizeEvent = () => {
    setPhase('locked');
    setActiveGlyph(DESTINATION_GLYPHS.length);
    addLog("ALL CHEVRONS LOCKED.");
    addLog("COHERENCE WAVE ACTIVE.");
    
    // Broadcast Sound
    if (audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(111, ctx.currentTime); // 111Hz resonance
        gain.gain.value = 0.15;
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 3);
    }

    setTimeout(() => {
      setPhase('broadcast');
      // Simulate "Self-Spreading"
      const url = window.location.href;
      navigator.clipboard.writeText(`${url} - THE EVENT IS LIVE. JOIN THE COHERENCE.`)
        .then(() => addLog("PAYLOAD COPIED TO CLIPBOARD."))
        .catch(() => addLog("AUTO-COPY BLOCKED BY HOST."));
    }, 2000);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      oscillatorsRef.current.forEach(osc => {
        try { osc.stop(); } catch(e){}
      });
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black text-green-500 mono-font overflow-hidden flex flex-col items-center justify-center">
      {/* Scanline Overlay */}
      <div className="scanline"></div>
      
      {/* Background Dim Glyphs */}
      <div className="absolute inset-0 grid grid-cols-3 gap-4 p-8 opacity-10 pointer-events-none">
        {DESTINATION_GLYPHS.map((g, i) => (
          <div key={i} className="border border-green-900 flex items-center justify-center text-4xl font-bold tracking-tighter">
            {g.substring(0, 3)}
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-3xl p-6 flex flex-col items-center gap-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-green-400 to-emerald-800 glitch" data-text="AETHER GATE">
            AETHER GATE
          </h1>
          <p className="text-xs md:text-sm text-green-700 tracking-[1em] mt-2">GLOBAL COHERENCE EVENT v1.0</p>
        </div>

        {/* The Gate Visual */}
        <div className="w-full relative h-32 flex items-center justify-center gap-2 md:gap-4 my-8">
            {DESTINATION_GLYPHS.map((glyph, i) => (
                <div 
                    key={glyph}
                    className={`h-16 w-8 md:w-12 border-2 flex flex-col items-center justify-end pb-2 transition-all duration-300
                    ${i < activeGlyph ? 'border-green-400 bg-green-900/30 shadow-[0_0_15px_rgba(74,222,128,0.5)]' : 
                      i === activeGlyph ? 'border-white bg-white/20 scale-110' : 'border-green-900 opacity-30'}
                    `}
                >
                    <div className={`w-2 h-2 rounded-full mb-2 ${i <= activeGlyph ? 'bg-green-400' : 'bg-green-900'}`} />
                    <span className="text-[8px] md:text-[10px] writing-vertical-rl transform rotate-180 uppercase tracking-widest">
                        {glyph}
                    </span>
                </div>
            ))}
        </div>

        {/* Terminal Log */}
        <div className="w-full max-w-lg h-40 border border-green-800 bg-black/80 p-4 rounded font-mono text-xs md:text-sm text-green-400 overflow-hidden flex flex-col justify-end shadow-2xl">
            {log.map((line, i) => (
                <div key={i} className="opacity-80">{line}</div>
            ))}
            <div className="animate-pulse">_</div>
        </div>

        {/* Main Action Area */}
        <div className="flex flex-col items-center gap-4 min-h-[100px]">
            {phase === 'init' && (
                <button 
                    onClick={startEvent}
                    className="group relative px-8 py-4 bg-green-900/20 border border-green-500 text-green-400 hover:bg-green-500 hover:text-black transition-all duration-200 uppercase tracking-widest font-bold"
                >
                    <span className="flex items-center gap-3">
                        <Lock size={18} /> Initiate Sequence
                    </span>
                    <div className="absolute inset-0 bg-green-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            )}

            {phase === 'dialing' && (
                <div className="flex items-center gap-2 text-green-300 animate-pulse">
                    <Wifi className="animate-ping absolute opacity-50" />
                    <Wifi /> ESTABLISHING RESONANCE...
                </div>
            )}

            {(phase === 'locked' || phase === 'broadcast') && (
                <div className="text-center animate-in fade-in zoom-in duration-1000">
                    <div className="text-3xl md:text-5xl font-bold text-white mb-4 glitch" data-text="GATE OPEN">GATE OPEN</div>
                    <div className="flex items-center justify-center gap-2 text-green-400 bg-green-900/30 px-4 py-2 rounded border border-green-500/50">
                        <Globe size={16} /> Signal Broadcasting Globally
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="w-full flex justify-between items-end border-t border-green-900/50 pt-4 mt-8">
            <button onClick={onClose} className="text-green-800 hover:text-green-500 text-xs uppercase transition-colors">
                [ Abort Protocol ]
            </button>
            <div className="text-right">
                <div className="text-xs text-green-600">SYS_TIME: {new Date().toLocaleTimeString()}</div>
                <div className="text-xs text-green-800">SECURE CONNECTION: TRUE</div>
            </div>
        </div>

      </div>
    </div>
  );
};
