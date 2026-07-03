'use client';

import React, { useState } from 'react';
import { UserProfile, SECURITY_QUESTIONS } from '../lib/financeTypes';
import { User, ShieldCheck, Key, Fingerprint, Scan, CheckCircle2, AlertCircle } from 'lucide-react';
import { TRANSLATIONS, Language } from '../lib/translations';

interface SecurityProfileProps {
  profile: UserProfile;
  securityLogs: string[];
  onUpdateProfile: (updatedProfile: Partial<UserProfile>) => void;
  onTriggerRegisterBiometrics: () => void;
  onClearBiometrics: () => void;
  onClearLogs: () => void;
  language: Language;
}

export default function SecurityProfile({
  profile,
  securityLogs,
  onUpdateProfile,
  onTriggerRegisterBiometrics,
  onClearBiometrics,
  onClearLogs,
  language
}: SecurityProfileProps) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const [name, setName] = useState(profile.name);
  const [email] = useState(profile.email);
  const [securityQuestion, setSecurityQuestion] = useState(profile.securityQuestion || SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState(profile.securityAnswer || '');
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'face'>(profile.biometricType === 'face' ? 'face' : 'fingerprint');

  const [formSuccessMsg, setFormSuccessMsg] = useState('');
  const [formErrorMsg, setFormErrorMsg] = useState('');

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccessMsg('');
    setFormErrorMsg('');

    if (!name.trim()) {
      setFormErrorMsg(t.formError);
      return;
    }

    if (!securityAnswer.trim()) {
      setFormErrorMsg(t.formError);
      return;
    }

    onUpdateProfile({
      name: name.trim(),
      securityQuestion,
      securityAnswer: securityAnswer.trim(),
      biometricType
    });

    setFormSuccessMsg(t.profileSuccess);
    setTimeout(() => setFormSuccessMsg(''), 4000);
  };

  const getQuestionLabel = (q: string) => {
    const mapped = (t.questions as Record<string, string>)[q];
    return mapped || q;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="security-profile-module">
      {/* Profile and Security Question settings */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs" id="profile-management-panel">
        <div className="flex items-center gap-2 mb-4">
          <span className="p-2 bg-sky-50 border border-sky-100 rounded-xl text-sky-700">
            <User className="w-4 h-4 stroke-[2px]" />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900">{t.identityProfile}</h3>
            <p className="text-xs font-semibold text-slate-400">{t.manageIdentity}</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4" id="update-profile-form">
          {/* Name */}
          <div className="space-y-1">
            <label htmlFor="profile-name" className="text-xs font-semibold text-slate-600 block">{t.fullName}</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm font-semibold bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 text-slate-900"
            />
          </div>

          {/* Email (Readonly) */}
          <div className="space-y-1">
            <label htmlFor="profile-email" className="text-xs font-semibold text-slate-600 block">{t.emailPrimary}</label>
            <input
              id="profile-email"
              type="email"
              value={email}
              disabled
              className="w-full px-3 py-2 text-sm font-semibold bg-slate-100/50 border border-slate-200 rounded-xl text-slate-400 select-none cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-400 block font-semibold">{t.lockedEmailNote}</span>
          </div>

          {/* Security Question Selection */}
          <div className="space-y-1">
            <label htmlFor="profile-question" className="text-xs font-semibold text-slate-600 block">{t.recoveryQuestion}</label>
            <select
              id="profile-question"
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
              className="w-full px-3 py-2 text-sm font-semibold bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 text-slate-900 cursor-pointer"
            >
              {SECURITY_QUESTIONS.map(q => (
                <option key={q} value={q}>{getQuestionLabel(q)}</option>
              ))}
            </select>
          </div>

          {/* Security Question Answer */}
          <div className="space-y-1">
            <label htmlFor="profile-answer" className="text-xs font-semibold text-slate-600 block">{t.questionAnswer}</label>
            <input
              id="profile-answer"
              type="password"
              placeholder="••••••••"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              className="w-full px-3 py-2 text-sm font-semibold bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 text-slate-900"
            />
            <span className="text-[10px] text-slate-400 block font-semibold">{t.caseInsensitive}</span>
          </div>

          {formErrorMsg && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 shrink-0" /> {formErrorMsg}
            </p>
          )}

          {formSuccessMsg && (
            <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {formSuccessMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white transition-all text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
            id="save-profile-btn"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2px]" /> {t.saveBudget.replace('Goal', 'Profile')}
          </button>
        </form>
      </div>

      {/* Biometrics Setup */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between" id="biometrics-config-panel">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700">
              <Fingerprint className="w-4 h-4 stroke-[2px]" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">{t.localBiometrics}</h3>
              <p className="text-xs font-semibold text-slate-400">{t.configureBiometric}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Choose biometric type */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-600 block">{t.biometricType}</span>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setBiometricType('fingerprint')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    biometricType === 'fingerprint'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  id="biometric-type-fingerprint"
                >
                  <Fingerprint className="w-3.5 h-3.5" /> {t.touchId.split(' ')[0]}
                </button>
                <button
                  type="button"
                  onClick={() => setBiometricType('face')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    biometricType === 'face'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  id="biometric-type-face"
                >
                  <Scan className="w-3.5 h-3.5" /> {t.faceId.split(' ')[0]}
                </button>
              </div>
            </div>

            {/* Current status */}
            <div className="p-3.5 rounded-xl bg-emerald-50/20 border border-emerald-100/80">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">{t.vaultBiometricStatus}</span>
              {profile.biometricsEnabled ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{t.biometricsActive}</span>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-medium leading-relaxed">
                    {t.biometricsActiveSub}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{t.biometricsNotActive}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    {t.biometricsNotActiveSub}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buttons for configuration */}
        <div className="space-y-2 mt-6">
          <button
            onClick={onTriggerRegisterBiometrics}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
            id="register-biometrics-trigger"
          >
            {biometricType === 'face' ? <Scan className="w-4 h-4 stroke-[2px]" /> : <Fingerprint className="w-4 h-4 stroke-[2px]" />}
            {profile.biometricsEnabled ? t.reRegisterBiometrics : t.registerBiometrics}
          </button>
          
          {profile.biometricsEnabled && (
            <button
              onClick={onClearBiometrics}
              className="w-full py-2 px-4 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 transition-all text-xs font-semibold cursor-pointer"
              id="clear-biometrics-btn"
            >
              {t.disableBiometrics}
            </button>
          )}
        </div>
      </div>

      {/* Local Cryptography Auditing Logs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between" id="cryptography-logs-panel">
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700">
                <Key className="w-4 h-4 stroke-[2px]" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">{t.localSecurityLedger.split(' ')[0]} Ledger</h3>
                <p className="text-xs font-semibold text-slate-400">{t.liveOperations}</p>
              </div>
            </div>
            
            {securityLogs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/60"
                id="clear-logs-btn"
              >
                {t.clearLogs.split(' ')[0]}
              </button>
            )}
          </div>

          {/* Audit logs timeline */}
          <div className="bg-slate-950 text-slate-400 font-mono text-[10px] rounded-xl p-4 h-[300px] overflow-y-auto border border-slate-800 space-y-2 select-all scrollbar-none" id="terminal-logs-window">
            <div className="text-slate-500 border-b border-slate-800 pb-1 flex justify-between items-center font-bold">
              <span>SECURITY_VAULT_AUDIT.LOG</span>
              <span className="text-emerald-500 animate-pulse font-semibold">● SECURED_LOCAL_CONTEXT</span>
            </div>
            {securityLogs.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-slate-600 text-xs font-bold">
                {t.waitingLogs}
              </div>
            ) : (
              securityLogs.map((log, idx) => (
                <div key={idx} className="leading-normal flex items-start gap-1">
                  <span className="text-emerald-500 font-bold shrink-0">&gt;</span>
                  <span className="text-slate-200 font-semibold">{log}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="text-[10px] text-slate-400 mt-4 leading-relaxed font-semibold">
          {t.securityDesc}
        </p>
      </div>
    </div>
  );
}
