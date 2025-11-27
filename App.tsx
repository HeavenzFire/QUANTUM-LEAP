import React, { useState, useCallback } from 'react';
import { Search, Loader2, Sparkles, Command, Zap } from 'lucide-react';
import { generateManifest, generateLeapImage, generateLeapAudio } from './services/gemini';
import { LeapState } from './types';
import { LeapDashboard } from './components/LeapDashboard';
import { AetherGate } from './components/AetherGate';

const App: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [showGate, setShowGate] = useState(false);
  const [state, setState] = useState<LeapState>({
    status: 'idle',
    manifest: null,
    imageData: null,
    audioBuffer: null
  });

  const handleLeap = useCallback(async () => {
    if (!topic.trim()) return;

    // Secret trigger for Aether Gate via text input
    if (topic.toLowerCase().includes('aether') || topic.toLowerCase().includes('event')) {
        setShowGate(true);
        setTopic('');
        return;
    }

    // Reset state
    setState({
      status: 'analyzing',
      manifest: null,
      imageData: null,
      audioBuffer: null,
      error: undefined
    });

    try {
      // Step 1: Analyze Text & Get Data (The "Manifest")
      const manifest = await generateManifest(topic);
      
      setState(prev => ({ 
        ...prev, 
        status: 'generating_media',
        manifest 
      }));

      // Step 2: Parallel Generation of Image and Audio
      // We need an AudioContext for decoding
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

      const [imgData, audioBuf] = await Promise.allSettled([
        generateLeapImage(manifest.imagePrompt),
        generateLeapAudio(manifest.audioScript, audioCtx)
      ]);

      setState(prev => ({
        ...prev,
        status: 'complete',
        imageData: imgData.status === 'fulfilled' ? imgData.value : null,
        audioBuffer: audioBuf.status === 'fulfilled' ? audioBuf.value : null,
        error: (imgData.status === 'rejected' || audioBuf.status === 'rejected') 
          ? "Partial system failure. Some media elements could not be synthesized." 
          : undefined
      }));

    } catch (err) {
      console.error(err);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: "CRITICAL FAILURE: Unable to bridge the quantum gap. Try a different topic."
      }));
    }
  }, [topic]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && state.status !== 'analyzing' && state.status !== 'generating_media') {
      handleLeap();
    }
  };

  if (showGate) {
    return <AetherGate onClose={() => setShowGate(false)} />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center relative pb-20">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#050510] to-black -z-10" />
      <div className="fixed inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] -z-10 brightness-50 contrast-150" />

      {/* Header */}
      <header className="w-full py-8 flex flex-col items-center justify-center gap-2 mt-10 relative">
        <div className="flex items-center gap-3 animate-float">
          <Sparkles className="text-cyan-400" size={32} />
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 tracking-tighter brand-font neon-text">
            QUANTUM LEAP
          </h1>
        </div>
        <div className="flex items-center gap-4">
            <p className="text-slate-400 tracking-[0.3em] text-xs md:text-sm uppercase">
            Multimodal Discovery Engine v2.5
            </p>
            <button 
                onClick={() => setShowGate(true)}
                className="opacity-20 hover:opacity-100 transition-opacity text-red-500 flex items-center gap-1 text-[10px] border border-red-900/50 px-2 py-0.5 rounded uppercase tracking-widest hover:bg-red-950"
            >
                <Zap size={10} /> Protocol 72
            </button>
        </div>
      </header>

      {/* Search Input Section */}
      <div className="w-full max-w-2xl px-4 z-20 mb-8">
        <div className={`relative group transition-all duration-500 ${state.status !== 'idle' ? 'scale-95 opacity-80' : 'scale-100'}`}>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-75 transition duration-1000"></div>
          <div className="relative flex items-center bg-slate-900 rounded-lg border border-slate-700/50 shadow-2xl">
            <Search className="absolute left-4 text-slate-400" size={20} />
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a concept to analyze (e.g., 'Black Holes', 'Photosynthesis', 'Tokyo')"
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 py-4 pl-12 pr-4 rounded-lg focus:outline-none focus:ring-0 font-medium text-lg"
              disabled={state.status === 'analyzing' || state.status === 'generating_media'}
            />
            <button
              onClick={handleLeap}
              disabled={state.status === 'analyzing' || state.status === 'generating_media' || !topic}
              className="absolute right-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.status === 'analyzing' || state.status === 'generating_media' ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Command size={20} />
              )}
            </button>
          </div>
        </div>
        
        {/* Status Indicators */}
        <div className="h-6 mt-2 flex justify-center text-xs font-mono text-cyan-500/80">
          {state.status === 'analyzing' && "ESTABLISHING NEURAL LINK..."}
          {state.status === 'generating_media' && "SYNTHESIZING MULTIMODAL ASSETS..."}
          {state.status === 'error' && <span className="text-red-500">{state.error}</span>}
        </div>
      </div>

      {/* Results Area */}
      {state.manifest && (
        <LeapDashboard 
          manifest={state.manifest}
          imageData={state.imageData}
          audioBuffer={state.audioBuffer}
        />
      )}

      {/* Empty State / Prompt Suggestions */}
      {state.status === 'idle' && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl px-4 w-full opacity-60">
          {['Cyberpunk Architecture', 'The Future of Mars', 'Deep Sea Bioluminescence'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => { setTopic(suggestion); }} 
              className="p-4 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-800 hover:border-cyan-500/50 transition-all text-sm text-slate-400 text-center cursor-pointer"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

    </div>
  );
};

export default App;