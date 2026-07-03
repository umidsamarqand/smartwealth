'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fingerprint, Scan, ShieldAlert, CheckCircle2, X } from 'lucide-react';

interface BiometricAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onFailure: (reason: string) => void;
  mode: 'register' | 'authenticate';
  biometricType?: 'fingerprint' | 'face';
}

export default function BiometricAuthModal({
  isOpen,
  onClose,
  onSuccess,
  onFailure,
  mode,
  biometricType = 'fingerprint'
}: BiometricAuthModalProps) {
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
          // 90% chance of success for smooth simulation
          if (Math.random() < 0.95) {
            setScanState('success');
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 1200);
          } else {
            setScanState('failed');
            setTimeout(() => {
              onFailure('Biometric scanner matching error. Please try again.');
              setScanState('idle');
            }, 2000);
          }
          return 100;
        }
        return prev + 5;
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
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-xl border border-slate-100 z-10"
          id="biometric-modal-content"
        >
          {/* Close Button */}
          {scanState !== 'scanning' && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-50"
              aria-label="Close"
              id="biometric-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex flex-col items-center text-center mt-2">
            <div className="mb-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 uppercase tracking-wider">
                Local Biometric Security
              </span>
            </div>

            <h3 className="text-xl font-semibold text-slate-900 mt-2">
              {mode === 'register' ? 'Register Biometric Access' : 'Biometric Security Check'}
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs">
              {mode === 'register' 
                ? 'Register your device biometric fingerprint or face profile to enable rapid login.' 
                : 'Authenticate using your local biometric profile to unlock and decrypt your financial vault.'}
            </p>

            {/* Scanning Stage */}
            <div className="relative my-8 flex items-center justify-center w-40 h-40">
              {/* Outer Pulse rings */}
              {scanState === 'scanning' && (
                <>
                  <motion.div 
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full border border-emerald-400/40"
                  />
                  <motion.div 
                    animate={{ scale: [1.1, 1.6, 1.1], opacity: [0.3, 0, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
                    className="absolute inset-0 rounded-full border border-emerald-400/20"
                  />
                </>
              )}

              {/* Central Circle */}
              <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-colors duration-300 relative overflow-hidden ${
                scanState === 'success' ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-600' :
                scanState === 'failed' ? 'bg-rose-50 border-2 border-rose-500 text-rose-600' :
                scanState === 'scanning' ? 'bg-slate-50 border-2 border-slate-200 text-slate-400' :
                'bg-slate-50 border border-slate-200 text-slate-500 hover:border-slate-300 cursor-pointer'
              }`}
              onClick={scanState === 'idle' ? startScan : undefined}
              id="biometric-trigger-zone"
              >
                {/* Simulated Scanning Line */}
                {scanState === 'scanning' && (
                  <motion.div
                    animate={{ y: [-48, 80, -48] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_12px_#10b981] z-10"
                  />
                )}

                {/* Icons based on state */}
                {scanState === 'success' ? (
                  <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                    <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                  </motion.div>
                ) : scanState === 'failed' ? (
                  <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                    <ShieldAlert className="w-16 h-16 text-rose-500" />
                  </motion.div>
                ) : biometricType === 'fingerprint' ? (
                  <Fingerprint className={`w-16 h-16 ${scanState === 'scanning' ? 'text-emerald-500/80 animate-pulse' : 'text-slate-400 hover:text-indigo-500 transition-colors'}`} />
                ) : (
                  <Scan className={`w-16 h-16 ${scanState === 'scanning' ? 'text-emerald-500/80 animate-pulse' : 'text-slate-400 hover:text-indigo-500 transition-colors'}`} />
                )}
              </div>
            </div>

            {/* Status Text & Progress */}
            <div className="w-full max-w-xs mb-4">
              {scanState === 'idle' && (
                <button
                  onClick={startScan}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 active:scale-98 transition-all shadow-sm flex items-center justify-center gap-2"
                  id="biometric-start-scan"
                >
                  {biometricType === 'fingerprint' ? <Fingerprint className="w-4 h-4" /> : <Scan className="w-4 h-4" />}
                  {mode === 'register' ? 'Tap to Initialize Sensor' : 'Tap to Unlock Vault'}
                </button>
              )}

              {scanState === 'scanning' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                    <span className="animate-pulse">Accessing Secure Hardware...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-100" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {scanState === 'success' && (
                <p className="text-emerald-600 font-semibold text-sm animate-bounce">
                  Verification Succeeded! Access Granted.
                </p>
              )}

              {scanState === 'failed' && (
                <p className="text-rose-600 font-semibold text-sm">
                  Authentication Failed. Try again.
                </p>
              )}
            </div>

            <p className="text-xs text-slate-400 max-w-xs mt-2">
              Note: This security system utilizes standard web platform credentials paired with high-entropy cryptographic seeds, completely executed in your local sandbox.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
