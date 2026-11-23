import React, { useState, useEffect, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Configure Monaco Editor directly with the local bundled monaco instance
// This guarantees 100% offline operation with zero CDN network requests!
try {
  loader.config({ monaco });
} catch (e) {
  console.warn('Monaco bundled loader init:', e);
}

interface OfflineCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
}

export const OfflineCodeEditor: React.FC<OfflineCodeEditorProps> = ({
  value,
  onChange,
  language
}) => {
  const [editorType, setEditorType] = useState<'monaco' | 'simple'>('monaco');
  const [monacoLoaded, setMonacoLoaded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // If Monaco takes longer than 2.5s to initialize (e.g. strict offline sandbox), auto-fallback to native editor
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!monacoLoaded) {
        setEditorType('simple');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [monacoLoaded]);

  // Handle Tab key in simple native editor (inserts 4 spaces instead of losing focus)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const lineCount = (value || '').split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 15) }, (_, i) => i + 1);

  const monacoLanguage =
    language === 'cpp' ? 'cpp' : language === 'c' ? 'c' : language === 'java' ? 'java' : 'python';

  return (
    <div className="h-full w-full flex flex-col relative bg-[#1e1e1e] overflow-hidden">
      {/* Editor Engine Switcher Indicator */}
      <div className="absolute top-2 right-4 z-20 flex items-center space-x-2 text-[10px] text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-700/80 backdrop-blur">
        <span>Engine:</span>
        <button
          onClick={() => setEditorType(prev => (prev === 'monaco' ? 'simple' : 'monaco'))}
          className="text-blue-400 hover:text-blue-300 font-bold uppercase transition"
          title="Click to toggle editor engine"
        >
          {editorType === 'monaco' ? 'Monaco (Offline)' : 'Native IDE'}
        </button>
      </div>

      {editorType === 'monaco' ? (
        <Editor
          height="100%"
          theme="vs-dark"
          language={monacoLanguage}
          value={value}
          onChange={(val) => onChange(val || '')}
          onMount={() => setMonacoLoaded(true)}
          loading={
            <div className="h-full w-full flex flex-col items-center justify-center space-y-3 bg-[#1e1e1e] text-slate-400 font-mono text-xs">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Initializing Offline Editor...</span>
              <button
                onClick={() => setEditorType('simple')}
                className="text-xs text-blue-400 hover:underline pt-2 font-sans"
              >
                Switch to Native IDE
              </button>
            </div>
          }
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 4,
            renderLineHighlight: 'all',
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace"
          }}
        />
      ) : (
        /* Fast, Native Dark IDE Code Editor with Line Numbers */
        <div className="h-full w-full flex overflow-hidden font-mono text-sm">
          {/* Gutter / Line Numbers */}
          <div className="w-12 bg-[#181818] text-slate-500 select-none py-3 pr-2 text-right border-r border-[#2d2d2d] font-mono text-xs overflow-hidden">
            {lineNumbers.map((num) => (
              <div key={num} className="leading-6">
                {num}
              </div>
            ))}
          </div>

          {/* Code Textarea Canvas */}
          <div className="flex-1 relative h-full">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              className="w-full h-full p-3 bg-[#1e1e1e] text-slate-100 font-mono text-sm leading-6 resize-none outline-none border-none overflow-y-auto selection:bg-blue-600/40"
              placeholder="// Write your offline code solution here..."
            />
          </div>
        </div>
      )}
    </div>
  );
};
