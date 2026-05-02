/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  X, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  FileDown,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import mammoth from 'mammoth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging tailwind classes
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FileState {
  id: string;
  file: File;
  status: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  result?: string;
  error?: string;
}

export default function App() {
  const [files, setFiles] = useState<FileState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (fileState: FileState) => {
    setFiles(prev => prev.map(f => f.id === fileState.id ? { ...f, status: 'converting' } : f));

    try {
      if (!fileState.file.name.endsWith('.docx')) {
        // Simple check for docx. .doc is binary and not supported by mammoth.
        throw new Error('目前仅支持 .docx 格式。对于旧版 .doc 格式，请先转换为 .docx');
      }

      const arrayBuffer = await fileState.file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      setFiles(prev => prev.map(f => f.id === fileState.id ? { 
        ...f, 
        status: 'completed', 
        result: result.value 
      } : f));
    } catch (err: any) {
      setFiles(prev => prev.map(f => f.id === fileState.id ? { 
        ...f, 
        status: 'error', 
        error: err.message || '转换失败' 
      } : f));
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files) as File[];
    addFiles(droppedFiles);
  }, []);

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(f => 
      f.name.endsWith('.docx') || f.name.endsWith('.doc')
    );

    const states: FileState[] = validFiles.map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      status: 'idle',
      progress: 0
    }));

    setFiles(prev => [...prev, ...states]);

    // Automatically process each file
    states.forEach(state => processFile(state));
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const downloadFile = (fileState: FileState) => {
    if (!fileState.result) return;

    const blob = new Blob([fileState.result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileState.file.name.replace(/\.(docx|doc)$/, '.txt');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-brand selection:text-white overflow-x-hidden">
      {/* Header */}
      <header className="h-[100px] px-8 md:px-16 flex justify-between items-center border-bottom border-white/10">
        <div className="font-black text-2xl uppercase tracking-tighter">
          Text<span className="text-brand">Extractor</span>
        </div>
        <div className="text-[10px] opacity-40 uppercase tracking-[0.2em] font-mono font-medium hidden sm:block">
          Build 0.4.1 [Stable]
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-8 md:px-16 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-16 md:gap-24">
        {/* Hero Section */}
        <section className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
          >
            <h1 className="text-[80px] md:text-[120px] font-[900] leading-[0.8] tracking-[-0.05em] uppercase mb-8">
              <span className="opacity-30 block">DOC TO</span>
              PLAIN TEXT
            </h1>
            <p className="text-lg md:text-xl max-w-md opacity-60 font-light leading-relaxed mb-8">
              一个极简且迅速的工具，专为从复杂文档中提取纯净内容而设计。
              <span className="block mt-2 italic">无数据存储，无追踪，仅提取文本。</span>
            </p>
            
            {/* Stats list shown in design as bottom bar, but can be here too or in footer */}
            <div className="flex flex-wrap gap-8 text-[11px] font-mono uppercase tracking-[0.2em] opacity-40">
              <div>Uptime: 100%</div>
              <div>Converted: 1.2M+</div>
              <div>Latency: 14ms</div>
            </div>
          </motion.div>
        </section>

        {/* Converter Section */}
        <section className="flex flex-col gap-8">
          {/* Drop Zone */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            onDragOver={handleDragOver}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-[32px] cursor-pointer transition-all duration-500",
              "bg-white/5 hover:bg-white/[0.08]",
              isDragging ? "border-brand bg-brand/10 ring-8 ring-brand/10 shadow-2xl scale-[1.02]" : "border-white/20",
              "group overflow-hidden"
            )}
          >
            <input 
              type="file" 
              className="hidden" 
              multiple 
              accept=".docx,.doc" 
              ref={fileInputRef}
              onChange={(e) => addFiles(Array.from(e.target.files || []))}
            />
            
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mb-8 transition-all duration-500 text-3xl font-black",
              isDragging ? "bg-brand text-white scale-125 rotate-6" : "bg-brand text-white group-hover:scale-110"
            )}>
              +
            </div>

            <div className="text-center">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] opacity-60 mb-2 group-hover:opacity-100 transition-opacity">
                {isDragging ? 'Drop to Extract' : 'Drag documents here'}
              </h3>
              <p className="text-[11px] opacity-30 font-mono">Supports .docx, .doc files</p>
            </div>

            {/* Scanning animation line */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity">
               <div className="w-full h-px bg-brand absolute top-0 animate-[scan_3s_linear_infinite]" />
            </div>
          </motion.div>

          {/* File List */}
          <AnimatePresence mode="popLayout">
            {files.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Queue ({files.length})</span>
                  <button onClick={() => setFiles([])} className="text-[10px] uppercase font-black tracking-widest text-red-500/60 hover:text-red-500 transition-colors">Clear All</button>
                </div>
                
                {files.map((fileState) => (
                  <motion.div
                    key={fileState.id}
                    layout
                    initial={{ opacity: 0, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                      "flex items-center justify-between p-5 rounded-2xl glass-card transition-all duration-300",
                      fileState.status === 'error' && "border-red-500/30 bg-red-500/5"
                    )}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/10",
                        fileState.status === 'completed' ? "bg-green-500/20 text-green-400" : 
                        fileState.status === 'error' ? "bg-red-500/20 text-red-400" : "bg-white/5 text-white/40"
                      )}>
                        {fileState.status === 'converting' ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : fileState.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : fileState.status === 'error' ? (
                          <X className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate uppercase tracking-tight">
                          {fileState.file.name}
                        </p>
                        <p className="text-[10px] font-mono opacity-30 mt-0.5">
                          {(fileState.file.size / 1024).toFixed(1)} KB • {fileState.status}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {fileState.status === 'completed' && (
                        <button
                          onClick={() => downloadFile(fileState)}
                          className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:bg-brand-dark hover:scale-105 active:scale-95"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      )}
                      <button
                        onClick={() => removeFile(fileState.id)}
                        className="p-2.5 text-white/20 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <footer className="px-8 md:px-16 py-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase font-black tracking-[0.2em] opacity-30 italic">
        <div>Privacy First: All processing happens in-browser</div>
        <div className="flex gap-8">
          <span>v0.4.1</span>
          <span>Open Source</span>
          <span className="text-brand">No Tracking</span>
        </div>
      </footer>

      {/* Global CSS for scanning animation */}
      <style>{`
        @keyframes scan {
          from { top: 0%; }
          to { top: 100%; }
        }
      `}</style>
    </div>
  );
}

