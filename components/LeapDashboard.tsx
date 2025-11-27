import React, { useEffect, useRef, useState } from 'react';
import { LeapManifest } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Play, Pause, Activity, Cpu, Database, Eye } from 'lucide-react';

interface LeapDashboardProps {
  manifest: LeapManifest;
  imageData: string | null;
  audioBuffer: AudioBuffer | null;
}

export const LeapDashboard: React.FC<LeapDashboardProps> = ({ manifest, imageData, audioBuffer }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Initialize Audio Context lazily
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const toggleAudio = () => {
    if (!audioBuffer || !audioContextRef.current) return;

    if (isPlaying) {
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current = null;
      }
      setIsPlaying(false);
    } else {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
      sourceRef.current = source;
      setIsPlaying(true);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        sourceRef.current.stop();
      }
    };
  }, []);

  const chartColor = manifest.colors?.[0] || '#3b82f6';
  const accentColor = manifest.colors?.[1] || '#a855f7';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 w-full max-w-7xl mx-auto p-4 animate-in fade-in duration-700">
      
      {/* 1. Summary Module (Top Left - Spans 2 cols on LG) */}
      <div className="glass-panel rounded-xl p-6 lg:col-span-4 flex flex-col justify-between h-full min-h-[250px] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
          <Cpu size={64} />
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-widest text-cyan-400 mb-2 flex items-center gap-2">
            <Activity size={16} /> CORE CONCEPT
          </h3>
          <p className="text-lg md:text-xl font-light leading-relaxed text-slate-200">
            {manifest.summary}
          </p>
        </div>
        
        {/* Audio Player embedded in Summary */}
        <div className="mt-6 pt-4 border-t border-slate-700/50">
           <button 
            onClick={toggleAudio}
            disabled={!audioBuffer}
            className={`w-full flex items-center justify-center gap-3 py-3 rounded-lg font-bold transition-all
              ${!audioBuffer 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : isPlaying 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50' 
                  : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/50'
              }`}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            {isPlaying ? "STOP TRANSMISSION" : "PLAY AUDIO BRIEF"}
          </button>
        </div>
      </div>

      {/* 2. Visual Module (Top Right/Center - Spans 4 cols on LG) */}
      <div className="glass-panel rounded-xl p-1 lg:col-span-4 h-[300px] md:h-[400px] lg:h-auto relative overflow-hidden flex items-center justify-center bg-black">
        <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-slate-700">
           <span className="text-xs font-bold text-fuchsia-400 flex items-center gap-2">
             <Eye size={12} /> VISUAL SYNTHESIS
           </span>
        </div>
        {imageData ? (
          <img 
            src={`data:image/png;base64,${imageData}`} 
            alt="AI Generated Visualization" 
            className="w-full h-full object-cover rounded-lg hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-slate-600 animate-pulse">
            <div className="w-16 h-16 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" />
            <span className="brand-font tracking-widest text-sm">RENDERING VISUALS...</span>
          </div>
        )}
      </div>

      {/* 3. Data Module (Bottom/Right - Spans 4 cols on LG) */}
      <div className="glass-panel rounded-xl p-6 lg:col-span-4 flex flex-col h-full min-h-[300px]">
        <h3 className="text-sm font-bold tracking-widest text-emerald-400 mb-6 flex items-center gap-2">
          <Database size={16} /> DATA ANALYTICS
        </h3>
        <div className="flex-1 w-full h-full min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={manifest.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="label" 
                stroke="#64748b" 
                fontSize={12} 
                tick={{fill: '#94a3b8'}}
                interval={0}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12} 
                tick={{fill: '#94a3b8'}}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
              />
              <Bar 
                dataKey="value" 
                fill={chartColor} 
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-xs text-slate-500 mt-4 uppercase tracking-widest brand-font">
          {manifest.chartTitle}
        </p>
      </div>
      
      {/* 4. Prompt Details (Bottom Span - Optional Extra Context) */}
      <div className="hidden lg:block lg:col-span-12 glass-panel rounded-xl p-4 mt-2 opacity-60 hover:opacity-100 transition-opacity">
        <p className="text-xs text-slate-500 font-mono break-all">
          <span className="text-slate-400 font-bold">GEN_PROMPT_KEY:</span> {manifest.imagePrompt.substring(0, 150)}...
        </p>
      </div>
    </div>
  );
};