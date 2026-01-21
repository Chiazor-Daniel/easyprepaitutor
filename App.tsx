import React, { useState, useCallback, useEffect, useRef } from 'react';
import Whiteboard from './components/Whiteboard';
import { fetchLesson, FileData } from './services/geminiService';
import { LessonData, BoardContent } from './types';

const PRESETS = [
  { label: "Calc", q: "Integral of sin(x)cos(x) dx" },
  { label: "Phys", q: "F=ma example problem" },
  { label: "Chem", q: "Balance: C6H12O6 + O2" },
  { label: "Alg", q: "Quadratic: x^2 - 5x + 6 = 0" }
];

const App: React.FC = () => {
  const [userInput, setUserInput] = useState('');
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [boardContents, setBoardContents] = useState<BoardContent[]>([]);
  const [currentExplanation, setCurrentExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{name: string, data: string, type: string}[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Fix: replaced NodeJS.Timeout with number for browser-side execution context
  const autoPlayTimerRef = useRef<number | null>(null);

  const reconstructBoardState = useCallback((targetIndex: number) => {
    if (!lessonData) return;
    let newBoard: BoardContent[] = [];
    let lastExpl: string | null = null;

    for (let i = 0; i <= targetIndex; i++) {
      const step = lessonData.lesson[i];
      if (step.action === 'write') {
        newBoard.push({
          id: `step-${i}`,
          text: step.content,
          position: step.position || 'center',
          timestamp: i
        });
        lastExpl = null;
      } else if (step.action === 'explain') {
        lastExpl = step.content;
      }
    }
    setBoardContents(newBoard);
    setCurrentExplanation(lastExpl);
  }, [lessonData]);

  const handleNext = useCallback(() => {
    if (!lessonData) return;
    if (currentStepIndex >= lessonData.lesson.length - 1) {
      setAutoPlay(false);
      setLessonData(null);
      return;
    }
    setCurrentStepIndex(prev => prev + 1);
  }, [lessonData, currentStepIndex]);

  // Auto-Play Logic
  useEffect(() => {
    if (autoPlay && lessonData && currentStepIndex < lessonData.lesson.length - 1 && !loading) {
      const delay = lessonData.lesson[currentStepIndex + 1]?.action === 'explain' ? 2500 : 1500;
      // Fix: cast the timeout ID to number for storage in the ref
      autoPlayTimerRef.current = window.setTimeout(handleNext, delay) as unknown as number;
    }
    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [autoPlay, currentStepIndex, lessonData, loading, handleNext]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | null } }) => {
    const files = e.target.files;
    if (!files) return;
    // Fix: cast to File[] to ensure the 'file' parameter has name and type properties
    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const result = readerEvent.target?.result;
        if (typeof result === 'string') {
          const base64 = result.split(',')[1];
          setAttachedFiles(prev => [...prev, { name: file.name, data: base64, type: file.type }]);
        }
      };
      // Fix: typed 'file' is now valid as a Blob for readAsDataURL
      reader.readAsDataURL(file);
    });
  };

  const startLesson = useCallback(async (prompt?: string) => {
    const finalPrompt = prompt || userInput;
    if (!finalPrompt.trim() && attachedFiles.length === 0) return;

    setLoading(true);
    setError(null);
    setBoardContents([]);
    setCurrentExplanation(null);
    setCurrentStepIndex(-1);
    
    const formattedFiles: FileData[] = attachedFiles.map(f => ({
      inlineData: { data: f.data, mimeType: f.type }
    }));

    try {
      const data = await fetchLesson(finalPrompt, formattedFiles);
      setLessonData(data);
      setCurrentStepIndex(0); 
    } catch (err) {
      setError("Easy PrepAI couldn't process that. Try a clearer question.");
    } finally {
      setLoading(false);
      setAttachedFiles([]);
    }
  }, [userInput, attachedFiles]);

  useEffect(() => {
    if (lessonData && currentStepIndex !== -1) {
      reconstructBoardState(currentStepIndex);
    }
  }, [currentStepIndex, lessonData, reconstructBoardState]);

  const isComplete = lessonData ? currentStepIndex >= lessonData.lesson.length - 1 : false;

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-4 md:py-8 flex flex-col font-sans text-slate-900 overflow-x-hidden">
      <header className="mb-4 md:mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg md:text-xl shadow-lg">E</div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-800">Easy PrepAI</h1>
        </div>
        {lessonData && (
          <div className="bg-slate-100 px-3 py-1 rounded-full text-slate-500 font-bold text-[10px] md:text-xs">
            Step {currentStepIndex + 1} / {lessonData.lesson.length}
          </div>
        )}
      </header>

      {error && (
        <div className="bg-rose-50 border-2 border-rose-100 p-4 mb-4 rounded-2xl flex items-center justify-between text-rose-700 text-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center">
        {lessonData ? (
          <Whiteboard 
            contents={boardContents} 
            currentExplanation={currentExplanation}
            onNext={handleNext}
            onPrevious={() => { setAutoPlay(false); if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1); }}
            onRestart={() => { setAutoPlay(false); setLessonData(null); }}
            autoPlay={autoPlay}
            onToggleAutoPlay={() => setAutoPlay(!autoPlay)}
            canNext={true}
            canPrev={currentStepIndex > 0}
            isLoading={loading}
            isComplete={isComplete}
          />
        ) : (
          <div className="max-w-4xl mx-auto w-full">
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-14 shadow-2xl border border-slate-50 flex flex-col items-center">
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2 text-center">Ready to learn?</h2>
              <p className="text-slate-400 font-medium mb-8 text-center text-xs md:text-sm">Drop a file or ask a question.</p>
              
              <div className="w-full flex flex-col gap-4">
                <div className="relative group bg-slate-50 border-2 border-dashed border-slate-200 rounded-[1.5rem] md:rounded-[2rem] p-1">
                  <textarea 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="E.g. Explain how to integrate x^2..."
                    className="w-full text-base md:text-lg p-4 md:p-6 bg-transparent border-none focus:outline-none min-h-[140px] resize-none font-medium text-slate-700"
                  />
                  
                  <div className="flex flex-wrap gap-2 px-4 pb-2">
                    {attachedFiles.map((f, i) => (
                      <span key={i} className="bg-white px-2 py-1 rounded text-[10px] font-bold text-indigo-500 shadow-sm">{f.name}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between p-3 md:p-4 bg-white/50 rounded-b-[1.5rem]">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-indigo-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    </button>
                    <button
                      onClick={() => startLesson()}
                      disabled={loading || (!userInput.trim() && attachedFiles.length === 0)}
                      className="px-6 py-2 md:py-3 bg-indigo-600 text-white rounded-xl font-black text-xs md:text-sm hover:bg-indigo-700 disabled:bg-slate-200"
                    >
                      {loading ? 'Wait...' : 'START 🚀'}
                    </button>
                  </div>
                </div>

                <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept="image/*,.pdf" className="hidden" />

                <div className="flex flex-wrap justify-center gap-2">
                  {PRESETS.map((p) => (
                    <button key={p.label} onClick={() => { setUserInput(p.q); startLesson(p.q); }}
                      className="px-3 py-1.5 bg-white text-slate-500 rounded-full font-bold text-[10px] uppercase border border-slate-100 hover:bg-indigo-50">
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-8 py-4 flex flex-col md:flex-row justify-between items-center text-[10px] font-black text-slate-300 uppercase tracking-widest gap-2">
        <div>&copy; 2025 EASY PREPAI</div>
        <div className="flex gap-4">
          <span>Gemini-3 Pro Mode</span>
          <span>&bull;</span>
          <span>Responsive Web App</span>
        </div>
      </footer>
    </div>
  );
};

export default App;