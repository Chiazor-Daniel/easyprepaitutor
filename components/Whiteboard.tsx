import React, { useRef, useEffect } from 'react';
import { BoardContent } from '../types';

interface WhiteboardProps {
  contents: BoardContent[];
  currentExplanation: string | null;
  onNext: () => void;
  onPrevious: () => void;
  onRestart: () => void;
  autoPlay: boolean;
  onToggleAutoPlay: () => void;
  canNext: boolean;
  canPrev: boolean;
  isLoading: boolean;
  isComplete: boolean;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ 
  contents, 
  currentExplanation, 
  onNext, 
  onPrevious, 
  onRestart,
  autoPlay,
  onToggleAutoPlay,
  canNext,
  canPrev,
  isLoading,
  isComplete
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [contents]);

  return (
    <div className="relative w-full h-[75vh] md:h-[650px] bg-white border-4 md:border-[12px] border-slate-900 rounded-3xl md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
      {/* Texture for board feel */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" 
           style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      {/* Main Board Area */}
      <div 
        ref={scrollRef}
        className="relative z-10 flex-[2] h-full p-6 md:p-14 flex flex-col gap-8 md:gap-12 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-100 custom-scrollbar"
      >
        {contents.map((item) => (
          <div key={item.id} className="flex w-full animate-write justify-center">
            <div className="handwriting text-3xl md:text-5xl lg:text-6xl text-slate-800 font-bold leading-tight text-center max-w-full break-words">
              {item.text}
            </div>
          </div>
        ))}
        {/* Buffer for bottom spacing */}
        <div className="h-32 shrink-0" />
      </div>

      {/* Teacher's Side Panel */}
      <div className="relative flex-1 md:w-[35%] bg-slate-50/80 backdrop-blur-md p-6 md:p-8 flex flex-col z-20">
        <div className="flex justify-between items-center mb-4 md:mb-8">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tutor Insights</div>
          <button 
            onClick={onToggleAutoPlay}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${autoPlay ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}
          >
            <div className={`w-2 h-2 rounded-full ${autoPlay ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
            {autoPlay ? 'Auto-Play' : 'Manual'}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[100px]">
          {currentExplanation ? (
            <div className="w-full animate-write">
              <div className="bg-white border border-indigo-50 p-5 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm">
                <p className="text-slate-700 text-sm md:text-lg font-medium leading-relaxed italic">
                  <span className="mr-2 text-xl inline-block rotate-3">👨‍🏫</span>{currentExplanation}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 opacity-40">
               <div className="w-10 h-10 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin mb-3" />
               <p className="text-[10px] font-bold uppercase tracking-widest">Preparing Note...</p>
            </div>
          )}
        </div>

        <button 
          onClick={onRestart}
          className="mt-4 md:mt-6 w-full py-4 border-2 border-slate-200 rounded-xl md:rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm active:scale-95"
        >
          Reset Session
        </button>
      </div>

      {/* Floating Navigation Controls */}
      <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 md:gap-4 z-40 bg-white/95 backdrop-blur-xl p-2.5 rounded-full shadow-2xl border border-slate-100">
        <button
          onClick={onPrevious}
          disabled={!canPrev || isLoading}
          className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${canPrev ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-50 text-slate-200'}`}
          aria-label="Previous step"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
        </button>

        <button
          onClick={onNext}
          disabled={!canNext || isLoading}
          className={`h-10 md:h-14 px-8 md:px-12 rounded-full flex items-center justify-center gap-2 transition-all active:scale-95 ${isComplete ? 'bg-emerald-600' : 'bg-indigo-600'} text-white shadow-xl hover:opacity-90`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="font-black text-[10px] md:text-xs uppercase tracking-widest">
              {isComplete ? 'Finish 🏁' : 'Continue'}
            </span>
          )}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
    </div>
  );
};

export default Whiteboard;