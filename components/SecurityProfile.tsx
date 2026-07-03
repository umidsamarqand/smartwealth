'use client';

import React, { useState } from 'react';
import { UserProfile, SECURITY_QUESTIONS } from '../lib/financeTypes';
import { User, ShieldCheck, Key, Fingerprint, Scan, RefreshCw, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface SecurityProfileProps {
  profile: UserProfile;
  securityLogs: string[];
  onUpdateProfile: (updatedProfile: Partial<UserProfile>) => void;
  onTriggerRegisterBiometrics: () => void;
  onClearBiometrics: () => void;
  onClearLogs: () => void;
}

export default function SecurityProfile({
  profile,
  securityLogs,
  onUpdateProfile,
  onTriggerRegisterBiometrics,
  onClearBiometrics,
  onClearLogs
}: SecurityProfileProps) {
  const [name, setName] = useState(profile.name);
  const [email] = useState(profile.email); // Read-only for auth integrity
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
      setFormErrorMsg('Profile name cannot be blank.');
      return;
    }

    if (!securityAnswer.trim()) {
      setFormErrorMsg('Please provide an answer to your chosen security question for emergency password recovery.');
      return;
    }

    onUpdateProfile({
      name: name.trim(),
      securityQuestion,
      securityAnswer: securityAnswer.trim(),
      biometricType
    });

    setFormSuccessMsg('Personal profile and security configurations successfully committed!');
    setTimeout(() => setFormSuccessMsg(''), 4000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="security-profile-module">
      {/* Profile and Security Question settings */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs" id="profile-management-panel">
        <div className="flex items-center gap-2 mb-4">
          <span className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-700">
            <User className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Identity Profiles</h3>
            <p className="text-xs text-slate-500">Manage identity details and recovery credentials</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4" id="update-profile-form">
          {/* Name */}
          <div className="space-y-1">
            <label htmlFor="profile-name" className="text-xs font-semibold text-slate-600">Full Name</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white text-slate-900"
            />
          </div>

          {/* Email (Readonly) */}
          <div className="space-y-1">
            <label htmlFor="profile-email" className="text-xs font-semibold text-slate-600">Email Address (Primary Login)</label>
            <input
              id="profile-email"
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-400 font-medium select-none cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-400 block font-medium">To protect encryption safety, login emails are locked.</span>
          </div>

          {/* Security Question Selection */}
          <div className="space-y-1">
            <label htmlFor="profile-question" className="text-xs font-semibold text-slate-600">Recovery Security Question</label>
            <select
              id="profile-question"
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
              className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white text-slate-900 cursor-pointer"
            >
              {SECURITY_QUESTIONS.map(q => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>

          {/* Security Question Answer */}
          <div className="space-y-1">
            <label htmlFor="profile-answer" className="text-xs font-semibold text-slate-600">Question Answer</label>
            <input
              id="profile-answer"
              type="password"
              placeholder="••••••••"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white text-slate-900"
            />
            <span className="text-[10px] text-slate-400 block font-medium">Case-insensitive. Required for emergency password recovery.</span>
          </div>

          {formErrorMsg && (
            <p className="text-xs font-medium text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {formErrorMsg}
            </p>
          )}

          {formSuccessMsg && (
            <p className="text-xs font-medium text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {formSuccessMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
            id="save-profile-btn"
          >
            <ShieldCheck className="w-4 h-4" /> Save Profile Details
          </button>
        </form>
      </div>

      {/* Biometrics Setup */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between" id="biometrics-config-panel">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-700">
              <Fingerprint className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Local Biometrics</h3>
              <p className="text-xs text-slate-500">Configure fingerprint or face security locks</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Choose biometric type */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-600 block">Biometric Hardware Type</span>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBiometricType('fingerprint')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    biometricType === 'fingerprint'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  id="biometric-type-fingerprint"
                >
                  <Fingerprint className="w-3.5 h-3.5" /> Touch ID
                </button>
                <button
                  type="button"
                  onClick={() => setBiometricType('face')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    biometricType === 'face'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  id="biometric-type-face"
                >
                  <Scan className="w-3.5 h-3.5" /> Face ID
                </button>
              </div>
            </div>

            {/* Current status */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Vault Biometric Status</span>
              {profile.biometricsEnabled ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Active & Secured</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Simulated {profile.biometricType === 'face' ? 'Face ID' : 'Fingerprint'} authentication is enabled. You can bypass password entry upon launching.
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono">
                    Registered: {profile.biometricRegisteredAt ? new Date(profile.biometricRegisteredAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Not Configured</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Password entry is required. Enable biometrics below to configure immediate local unlocks.
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
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all text-sm font-semibold flex items-center justify-center gap-2 shadow-xs active:scale-98 cursor-pointer"
            id="register-biometrics-trigger"
          >
            {biometricType === 'face' ? <Scan className="w-4 h-4" /> : <Fingerprint className="w-4 h-4" />}
            {profile.biometricsEnabled ? 'Re-register Biometric Credentials' : 'Enroll Biometric Profile'}
          </button>
          
          {profile.biometricsEnabled && (
            <button
              onClick={onClearBiometrics}
              className="w-full py-2 px-4 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 transition-all text-xs font-semibold cursor-pointer"
              id="clear-biometrics-btn"
            >
              Disable Biometric Authentication
            </button>
          )}
        </div>
      </div>

      {/* Local Cryptography Auditing Logs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between" id="cryptography-logs-panel">
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-700">
                <Key className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-950">Local Security Ledger</h3>
                <p className="text-xs text-slate-500">Live cryptographic operation audits</p>
              </div>
            </div>
            
            {securityLogs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider cursor-pointer"
                id="clear-logs-btn"
              >
                Clear
              </button>
            )}
          </div>

          {/* Audit logs timeline */}
          <div className="bg-slate-950 text-slate-400 font-mono text-[10px] rounded-xl p-4 h-[310px] overflow-y-auto border border-slate-800 space-y-2.5 scrollbar-thin select-all" id="terminal-logs-window">
            <div className="text-slate-500 border-b border-slate-800 pb-1 flex justify-between items-center">
              <span>SECURITY_VAULT_AUDIT.LOG</span>
              <span className="text-emerald-500 animate-pulse">● SECURED_LOCAL_CONTEXT</span>
            </div>
            {securityLogs.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-slate-600 text-xs">
                Waiting for encryption operations...
              </div>
            ) : (
              securityLogs.map((log, idx) => (
                <div key={idx} className="leading-normal flex items-start gap-1">
                  <span className="text-emerald-500 font-bold shrink-0">&gt;</span>
                  <span className="text-slate-200">{log}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="text-[10px] text-slate-400 mt-4 leading-relaxed font-semibold">
          Data encryption leverages a PBKDF2 high-entropy key derivation matrix executing 10,000 iterations to power AES-256-GCM authenticated database envelopes. Perfect privacy is maintained locally in the iframe container.
        </p>
      </div>
    </div>
  );
}
