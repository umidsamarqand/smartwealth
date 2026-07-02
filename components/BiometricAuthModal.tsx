'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fingerprint, Scan, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { TRANSLATIONS, Language } from '../lib/translations';

interface BiometricAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onFailure: (reason: string) => void;
  mode: 'register' | 'authenticate';
  biometricType?: 'fingerprint' | 'face';
  language: Language;
}

export default function BiometricAuthModal({
  isOpen,
  onClose,
  onSuccess,
  onFailure,
  mode,
  biometricType = 'fingerprint',
  language
}: BiometricAuthModalProps) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setScanState('idle');
        setProgress(0);
      }, 0);
    }
  }, [isOpen]);

  const startScan = () => {
    setScanState('scanning');
    setProgress(0);
    
    // Simulate progression of scanning
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // 95% chance of success for smooth simulation
          if (Math.random() < 0.95) {
            setScanState('success');
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 1200);
          } else {
            setScanState('failed');
            setTimeout(() => {
              onFailure('Biometric scan match mismatch.');
              setScanState('idle');
            }, 2000);
          }
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={scanState === 'scanning' ? undefined : onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          id="biometric-modal-backdrop"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border-4 border-emerald-200 z-10"
          id="biometric-modal-content"
        >
          {/* Close Button */}
          {scanState !== 'scanning' && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-50 cursor-pointer border-2 border-slate-100"
              aria-label="Close"
              id="biometric-close-btn"
            >
              <X className="w-5 h-5 stroke-[2.5px]" />
            </button>
          )}

          <div className="flex flex-col items-center text-center mt-2">
            <div className="mb-2">
              <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                {t.biometricTitle}
              </span>
            </div>

            <h3 className="text-xl font-black text-slate-900 mt-2">
              {mode === 'register' ? t.registerBiometrics : t.fastSecurityPass}
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-1 max-w-xs">
              {mode === 'register' 
                ? t.biometricsNotActiveSub
                : t.biometricsActiveSub}
            </p>

            {/* Scanning Stage */}
            <div className="relative my-8 flex items-center justify-center w-40 h-40">
              {/* Outer Pulse rings */}
              {scanState === 'scanning' && (
                <>
                  <motion.div 
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full border-4 border-emerald-400/40"
                  />
                  <motion.div 
                    animate={{ scale: [1.1, 1.6, 1.1], opacity: [0.3, 0, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
                    className="absolute inset-0 rounded-full border-4 border-emerald-400/20"
                  />
                </>
              )}

              {/* Central Circle */}
              <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 relative overflow-hidden border-4 ${
                scanState === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' :
                scanState === 'failed' ? 'bg-rose-50 border-rose-500 text-rose-600' :
                scanState === 'scanning' ? 'bg-slate-50 border-slate-200 text-slate-400' :
                'bg-emerald-50 border-emerald-200 text-emerald-600 hover:scale-105 cursor-pointer shadow-md'
              }`}
              onClick={scanState === 'idle' ? startScan : undefined}
              id="biometric-trigger-zone"
              >
                {/* Simulated Scanning Line */}
                {scanState === 'scanning' && (
                  <motion.div
                    animate={{ y: [-48, 80, -48] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_12px_#10b981] z-10"
                  />
                )}

                {/* Icons based on state */}
                {scanState === 'success' ? (
                  <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 stroke-[3px]" />
                  </motion.div>
                ) : scanState === 'failed' ? (
                  <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                    <ShieldAlert className="w-16 h-16 text-rose-500 stroke-[3px]" />
                  </motion.div>
                ) : biometricType === 'fingerprint' ? (
                  <Fingerprint className={`w-16 h-16 stroke-[2.5px] ${scanState === 'scanning' ? 'text-emerald-500/80 animate-pulse' : 'text-emerald-600 hover:text-emerald-700 transition-colors'}`} />
                ) : (
                  <Scan className={`w-16 h-16 stroke-[2.5px] ${scanState === 'scanning' ? 'text-emerald-500/80 animate-pulse' : 'text-emerald-600 hover:text-emerald-700 transition-colors'}`} />
                )}
              </div>
            </div>

            {/* Status Text & Progress */}
            <div className="w-full max-w-xs mb-4">
              {scanState === 'idle' && (
                <button
                  onClick={startScan}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-500 text-white font-black hover:bg-emerald-600 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  id="biometric-start-scan"
                >
                  {biometricType === 'fingerprint' ? <Fingerprint className="w-5 h-5 stroke-[2.5px]" /> : <Scan className="w-5 h-5 stroke-[2.5px]" />}
                  {t.biometricIdle}
                </button>
              )}

              {scanState === 'scanning' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span className="animate-pulse">{t.biometricScanning}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-100" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {scanState === 'success' && (
                <p className="text-emerald-600 font-black text-sm animate-bounce">
                  {t.biometricSuccess}
                </p>
              )}

              {scanState === 'failed' && (
                <p className="text-rose-600 font-black text-sm">
                  {t.biometricFailed}
                </p>
              )}
            </div>

            <p className="text-[10px] font-bold text-slate-400 max-w-xs mt-2">
              {t.biometricNote}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
