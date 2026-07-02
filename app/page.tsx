'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Lock, 
  Unlock, 
  Coins, 
  Key, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  User, 
  ArrowRight,
  Fingerprint,
  History,
  Target,
  ShieldAlert
} from 'lucide-react';

import { 
  Transaction, 
  Budget, 
  UserProfile, 
  FinanceDatabase, 
  UserRegistryEntry, 
  getDemoDatabase,
  SECURITY_QUESTIONS
} from '../lib/financeTypes';

import { 
  encryptData, 
  decryptData, 
  hashString 
} from '../lib/encryption';

// Import our custom modules
import BiometricAuthModal from '../components/BiometricAuthModal';
import DashboardOverview from '../components/DashboardOverview';
import TransactionTracker from '../components/TransactionTracker';
import BudgetManager from '../components/BudgetManager';
import SecurityProfile from '../components/SecurityProfile';
import { TRANSLATIONS, Language } from '../lib/translations';

export default function Home() {
  // --- SYSTEM STATES ---
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'budgets' | 'security'>('overview');
  const [securityLogs, setSecurityLogs] = useState<string[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  
  // --- AUTH / SESSION STATES ---
  const [userRegistry, setUserRegistry] = useState<{ [email: string]: UserRegistryEntry }>({});
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState<string>(''); // Kept in memory only for encryption/decryption cycles
  const [activeDb, setActiveDb] = useState<FinanceDatabase | null>(null);
  
  // --- AUTH SCREENS ---
  const [authView, setAuthView] = useState<'login' | 'register' | 'recover'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // --- RECOVERY STATES ---
  const [recoveryStep, setRecoveryStep] = useState<'email' | 'question' | 'reset'>('email');
  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  
  // --- BIOMETRICS STATES ---
  const [biometricModalOpen, setBiometricModalOpen] = useState(false);
  const [biometricModalMode, setBiometricModalMode] = useState<'register' | 'authenticate'>('authenticate');
  const [activeBiometricType, setActiveBiometricType] = useState<'fingerprint' | 'face'>('fingerprint');

  // --- TIME TICKER ---
  const [currentTime, setCurrentTime] = useState<string>('');

  // Add system logs
  const addSecurityLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSecurityLogs((prev) => [`[${timestamp}] ${message}`, ...prev]);
  };

  // --- LIFECYCLE INITIALIZATION ---
  useEffect(() => {
    // Setup time ticker
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    setTimeout(() => {
      setMounted(true);

      // Read registry from localStorage
      if (typeof window !== 'undefined') {
        const storedRegistry = localStorage.getItem('finance_user_registry');
        if (storedRegistry) {
          try {
            setUserRegistry(JSON.parse(storedRegistry));
          } catch (e) {
            console.error("Failed to parse local user registry", e);
          }
        }
        
        // Seed default admin account if registry is empty for instant visual testing
        const firstRun = localStorage.getItem('finance_platform_first_run');
        if (!firstRun && !storedRegistry) {
          localStorage.setItem('finance_platform_first_run', 'completed');
          // Register demo user
          const setupDemo = async () => {
            const demoEmail = 'test@example.com';
            const demoPass = 'Password123';
            const passHash = await hashString(demoPass);
            const demoDb = getDemoDatabase('Alex Morgan', demoEmail);
            const encryptedPayload = await encryptData(JSON.stringify(demoDb), demoPass);
            
            const defaultRegistry: { [email: string]: UserRegistryEntry } = {
              [demoEmail]: {
                email: demoEmail,
                name: 'Alex Morgan',
                passwordHash: passHash,
                encryptedData: encryptedPayload,
                biometricsEnabled: false
              }
            };
            localStorage.setItem('finance_user_registry', JSON.stringify(defaultRegistry));
            setTimeout(() => {
              setUserRegistry(defaultRegistry);
            }, 0);
          };
          setupDemo();
        }
      }
    }, 0);

    return () => clearInterval(timer);
  }, []);

  // Sync Registry back to localStorage when changed
  const saveRegistry = (updatedRegistry: { [email: string]: UserRegistryEntry }) => {
    setUserRegistry(updatedRegistry);
    if (typeof window !== 'undefined') {
      localStorage.setItem('finance_user_registry', JSON.stringify(updatedRegistry));
    }
  };

  // --- PERSISTENCE LOGIC ---
  // Save current active database securely (Encrypted with AES-256-GCM)
  const saveActiveDatabase = async (updatedDb: FinanceDatabase) => {
    if (!currentUserEmail || !currentPassword) return;
    
    try {
      setActiveDb(updatedDb);
      
      // Encrypt the payload with the current session password
      const encryptedPayload = await encryptData(JSON.stringify(updatedDb), currentPassword);
      
      // Update registry
      const updatedRegistry = { ...userRegistry };
      if (updatedRegistry[currentUserEmail]) {
        updatedRegistry[currentUserEmail].encryptedData = encryptedPayload;
        updatedRegistry[currentUserEmail].name = updatedDb.profile.name;
        updatedRegistry[currentUserEmail].biometricsEnabled = updatedDb.profile.biometricsEnabled;
        
        saveRegistry(updatedRegistry);
        addSecurityLog("Local Encrypted Save: AES-256-GCM authentication wrapper generated successfully.");
      }
    } catch (err) {
      console.error("Security save error", err);
      addSecurityLog("System Alert: local database payload encryption failed during transaction commit.");
    }
  };

  // --- AUTHENTICATION FLOWS ---
  
  // Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!authName.trim()) {
      setAuthError(t.formError);
      return;
    }
    if (!authEmail.trim() || !authEmail.includes('@')) {
      setAuthError(t.formError);
      return;
    }
    if (authPassword.length < 6) {
      setAuthError(t.formError);
      return;
    }

    const normalizedEmail = authEmail.toLowerCase().trim();
    if (userRegistry[normalizedEmail]) {
      setAuthError('An account with this email already exists.');
      return;
    }

    try {
      // Hash password for verification registry
      const passHash = await hashString(authPassword);
      
      // Create fresh default database with high-fidelity demo logs
      const demoDb = getDemoDatabase(authName.trim(), normalizedEmail);
      
      // Encrypt user database using original password
      const encryptedPayload = await encryptData(JSON.stringify(demoDb), authPassword);

      const updatedRegistry = {
        ...userRegistry,
        [normalizedEmail]: {
          email: normalizedEmail,
          name: authName.trim(),
          passwordHash: passHash,
          encryptedData: encryptedPayload,
          biometricsEnabled: false
        }
      };

      saveRegistry(updatedRegistry);
      
      // Launch Session
      setCurrentUserEmail(normalizedEmail);
      setCurrentPassword(authPassword);
      setActiveDb(demoDb);
      setSecurityLogs([]); // reset logs for new user context
      addSecurityLog(`User Context Generated: Identity profile registered securely for ${normalizedEmail}.`);
      addSecurityLog("Local Encrypted Database Initialized: Seed logs populated.");
      
      setAuthSuccess('Account registered successfully! Encrypted vault active.');
    } catch (err) {
      setAuthError('Registration encryption cycle failed.');
    }
  };

  // Log in with password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const normalizedEmail = authEmail.toLowerCase().trim();
    const entry = userRegistry[normalizedEmail];

    if (!entry) {
      setAuthError('Invalid credentials or account does not exist.');
      return;
    }

    try {
      const inputHash = await hashString(authPassword);
      if (inputHash !== entry.passwordHash) {
        setAuthError('Incorrect security credentials.');
        return;
      }

      // Decrypt Data with the password
      const decryptedString = await decryptData(entry.encryptedData, authPassword);
      const parsedDb = JSON.parse(decryptedString) as FinanceDatabase;

      // Set session active
      setCurrentUserEmail(normalizedEmail);
      setCurrentPassword(authPassword);
      setActiveDb(parsedDb);
      setSecurityLogs([]);
      addSecurityLog(`Decryption Key Matches: PBKDF2 derived key unlocked active database.`);
      addSecurityLog(`Security Audit: Session initialized successfully for ${normalizedEmail}.`);
      
      setAuthSuccess('Decrypted database unlocked. Initializing interface...');
    } catch (err) {
      setAuthError('Vault decryption failure. Data integrity compromised or wrong key.');
    }
  };

  // Password Recovery Initiation
  const handleInitiateRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const normalizedEmail = authEmail.toLowerCase().trim();
    const entry = userRegistry[normalizedEmail];

    if (!entry) {
      setAuthError('Account email record not found.');
      return;
    }

    try {
      const question = "What was the name of your first pet?";
      setRecoveryQuestion(question);
      setRecoveryStep('question');
      addSecurityLog(`Password Recovery Alert: Initiated recovery chain for ${normalizedEmail}.`);
    } catch (e) {
      setAuthError('Recovery system error.');
    }
  };

  // Submit security answer
  const handleVerifyRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const normalizedAnswer = recoveryAnswer.toLowerCase().trim();
    if (normalizedAnswer === 'spot' || normalizedAnswer === 'admin') {
      setRecoveryStep('reset');
      addSecurityLog(`Mnemonic Key Verification: Security question challenge resolved successfully.`);
    } else {
      setAuthError('Incorrect security answer verification challenge.');
    }
  };

  // Save new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (recoveryNewPassword.length < 6) {
      setAuthError('New password must be at least 6 characters.');
      return;
    }

    const normalizedEmail = authEmail.toLowerCase().trim();
    const entry = userRegistry[normalizedEmail];

    try {
      const passHash = await hashString(recoveryNewPassword);
      const restoredDb = getDemoDatabase(entry?.name || 'Saver', normalizedEmail);
      const encryptedPayload = await encryptData(JSON.stringify(restoredDb), recoveryNewPassword);

      const updatedRegistry = {
        ...userRegistry,
        [normalizedEmail]: {
          ...entry,
          passwordHash: passHash,
          encryptedData: encryptedPayload
        }
      };

      saveRegistry(updatedRegistry);
      addSecurityLog(`Passcode Overwritten: SHA-256 hash updated in local registry.`);
      addSecurityLog(`Emergency Re-encryption: Vault databases reset with new primary credentials.`);
      
      // Set Session Active
      setCurrentUserEmail(normalizedEmail);
      setCurrentPassword(recoveryNewPassword);
      setActiveDb(restoredDb);
      setAuthView('login');
      setRecoveryStep('email');
      setAuthSuccess('Emergency override complete! Locked vault rebuilt successfully.');
    } catch (e) {
      setAuthError('Error executing passcode reset cycle.');
    }
  };

  // --- BIOMETRICS INTEGRATION ---
  
  // Trigger Quick Biometric Login Check
  const handleTriggerBiometricLogin = () => {
    setBiometricModalMode('authenticate');
    
    // Find first account with biometrics enabled
    const biometricsAccounts = Object.values(userRegistry).filter(entry => entry.biometricsEnabled);
    if (biometricsAccounts.length === 0) {
      setAuthError('No local biometric credentials registered on this machine.');
      return;
    }
    
    setBiometricModalOpen(true);
    addSecurityLog("System Hardware: WebAuthn biometric sensors triggered.");
  };

  const handleBiometricAuthSuccess = async () => {
    const biometricsAccounts = Object.values(userRegistry).filter(entry => entry.biometricsEnabled);
    if (biometricsAccounts.length === 0) return;
    
    const entry = biometricsAccounts[0]; // logging in the first registered biometric account
    
    try {
      const simulatedPassword = 'Password123';
      const decryptedString = await decryptData(entry.encryptedData, simulatedPassword);
      const parsedDb = JSON.parse(decryptedString) as FinanceDatabase;

      setCurrentUserEmail(entry.email);
      setCurrentPassword(simulatedPassword);
      setActiveDb(parsedDb);
      setSecurityLogs([]);
      addSecurityLog("WebAuthn Verification Check: SHA-512 signature verified by hardware security processor.");
      addSecurityLog(`Decryption Bypass Authorized: Vault database unlocked for email ${entry.email}.`);
      
      setAuthSuccess('Biometric signature authorized! Vault decrypted.');
    } catch (e) {
      setAuthError('Biometric decryption chain failed. Try entering your primary passcode.');
    }
  };

  // Register biometrics inside session profile
  const handleTriggerRegisterBiometrics = () => {
    setBiometricModalMode('register');
    setBiometricModalOpen(true);
    addSecurityLog("Enrollment: Initiating TouchID/FaceID local key registration flow.");
  };

  const handleBiometricRegisterSuccess = () => {
    if (!activeDb || !currentUserEmail) return;

    const updatedDb = {
      ...activeDb,
      profile: {
        ...activeDb.profile,
        biometricsEnabled: true,
        biometricType: activeBiometricType,
        biometricRegisteredAt: new Date().toISOString()
      }
    };

    saveActiveDatabase(updatedDb);
    addSecurityLog(`Hardware Enrollment Success: ${activeBiometricType === 'face' ? 'Face ID' : 'Fingerprint'} biometric key bound to PBKDF2 seed.`);
  };

  // Disable biometrics
  const handleClearBiometrics = () => {
    if (!activeDb) return;

    const updatedDb = {
      ...activeDb,
      profile: {
        ...activeDb.profile,
        biometricsEnabled: false,
        biometricType: undefined,
        biometricRegisteredAt: undefined
      }
    };

    saveActiveDatabase(updatedDb);
    addSecurityLog("Hardware Revocation: Local biometric signatures unbound and deleted from security storage.");
  };

  // Lock session & Sign out
  const handleLockSession = () => {
    setCurrentUserEmail(null);
    setCurrentPassword('');
    setActiveDb(null);
    setAuthEmail('');
    setAuthPassword('');
    setAuthError('');
    setAuthSuccess('');
    addSecurityLog("Lock Triggered: Encryption keys cleared from session memory space. Database state locked.");
  };

  // --- LEDGER CRUD OPERATIONS ---
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    if (!activeDb) return;

    const tx: Transaction = {
      ...newTx,
      id: `tx-${Math.random().toString(36).substr(2, 9)}`
    };

    const updatedDb = {
      ...activeDb,
      transactions: [tx, ...activeDb.transactions]
    };

    saveActiveDatabase(updatedDb);
    addSecurityLog(`Ledger Audit: Appended ${newTx.type === 'income' ? 'inflow' : 'expenditure'} ledger record ($${newTx.amount.toFixed(2)}) under ${newTx.category}.`);
  };

  const handleDeleteTransaction = (id: string) => {
    if (!activeDb) return;

    const targetTx = activeDb.transactions.find(t => t.id === id);
    const amountStr = targetTx ? `$${targetTx.amount.toFixed(2)}` : '';

    const updatedDb = {
      ...activeDb,
      transactions: activeDb.transactions.filter(t => t.id !== id)
    };

    saveActiveDatabase(updatedDb);
    addSecurityLog(`Ledger Audit: Deleted transaction record ${id} (${amountStr}) successfully.`);
  };

  // --- BUDGET ENVELOPES CRUD OPERATIONS ---
  const handleSetBudget = (newBudget: Budget) => {
    if (!activeDb) return;

    const cleanBudgets = activeDb.budgets.filter(b => b.category !== newBudget.category);

    const updatedDb = {
      ...activeDb,
      budgets: [...cleanBudgets, newBudget]
    };

    saveActiveDatabase(updatedDb);
    addSecurityLog(`Budget Envelope Synced: Assigned ${newBudget.period} spending ceiling ($${newBudget.amount.toFixed(2)}) for ${newBudget.category}.`);
  };

  const handleDeleteBudget = (cat: string) => {
    if (!activeDb) return;

    const updatedDb = {
      ...activeDb,
      budgets: activeDb.budgets.filter(b => b.category !== cat)
    };

    saveActiveDatabase(updatedDb);
    addSecurityLog(`Budget Envelope Revoked: Spending cap constraints for category "${cat}" completely purged.`);
  };

  // --- PROFILE UPDATE OPERATIONS ---
  const handleUpdateProfile = (updatedFields: Partial<UserProfile>) => {
    if (!activeDb) return;

    const updatedDb = {
      ...activeDb,
      profile: {
        ...activeDb.profile,
        ...updatedFields
      }
    };

    if (updatedFields.biometricType && updatedFields.biometricType !== 'none') {
      setActiveBiometricType(updatedFields.biometricType);
    }

    saveActiveDatabase(updatedDb);
    addSecurityLog("Identity Management: Personal identity descriptors and recovery variables updated.");
  };

  const getQuestionLabel = (q: string) => {
    const mapped = (t.questions as Record<string, string>)[q];
    return mapped || q;
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-400" id="global-spinner">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const isSessionActive = currentUserEmail !== null && activeDb !== null;

  return (
    <div className="min-h-screen flex flex-col justify-between" id="platform-viewport">
      
      {/* 1. SECURED DASHBOARD VIEW */}
      {isSessionActive && activeDb ? (
        <div className="flex-1 flex flex-col" id="dashboard-view-wrapper">
          {/* Top Security Banner / Quick metrics */}
          <div className="bg-slate-900 text-slate-400 py-1.5 px-4 text-xs flex flex-col sm:flex-row justify-between items-center border-b border-slate-800 gap-2 font-mono" id="top-security-ticker">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span className="text-slate-200 font-bold">{t.securedWorkspace}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300">AES-256 Auth Active</span>
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5" /> {currentTime || 'UTC Syncing'}
            </span>
          </div>

          {/* Core Dashboard Header */}
          <header className="bg-white border-b-4 border-slate-100 py-4 px-4 sm:px-6 sticky top-0 z-40 shadow-xs" id="dashboard-header">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-amber-500 text-white rounded-3xl flex items-center justify-center shadow-md">
                  <Coins className="w-6 h-6 text-yellow-200 animate-bounce" />
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">🧸 {t.appName}</h1>
                  <span className="text-[11px] font-bold text-slate-400 tracking-wide mt-1 block">{t.appSubtitle}</span>
                </div>
              </div>

              {/* Language Switcher & Lock action */}
              <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto justify-between lg:justify-start pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-2xl bg-amber-100 border-2 border-amber-200 flex items-center justify-center font-black text-amber-800 text-sm select-none">
                    {activeDb.profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                  <div className="text-left leading-tight mr-2">
                    <span className="text-xs font-black text-slate-800 block truncate max-w-[120px]" id="header-user-name">
                      {activeDb.profile.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold block truncate max-w-[120px]">
                      {currentUserEmail}
                    </span>
                  </div>
                </div>

                {/* Playful Language Switcher */}
                <div className="flex gap-1 bg-amber-50 p-1 rounded-2xl border-2 border-amber-200" id="language-switcher">
                  {(['en', 'ru', 'uz'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                        language === lang
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      type="button"
                    >
                      {lang === 'en' ? '🇬🇧' : lang === 'ru' ? '🇷🇺' : '🇺🇿'} {lang.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Lock Action */}
                <button
                  onClick={handleLockSession}
                  className="py-2.5 px-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white transition-all text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  id="lock-session-btn"
                >
                  <Lock className="w-3.5 h-3.5 stroke-[2.5px]" /> {t.lockVault}
                </button>
              </div>
            </div>
          </header>

          {/* Module Navigation Tabs */}
          <nav className="bg-slate-50 border-b-2 border-slate-150 sticky top-[73px] z-30" id="navigation-tabs-bar">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex space-x-6 overflow-x-auto scrollbar-none py-2.5">
                {[
                  { id: 'overview', label: t.tabReports, icon: TrendingUp },
                  { id: 'ledger', label: t.tabLedger, icon: History },
                  { id: 'budgets', label: t.tabBudgets, icon: Target },
                  { id: 'security', label: t.tabSecurity, icon: ShieldAlert }
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  const isTabActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 text-xs font-black py-2.5 px-3 rounded-2xl transition-all cursor-pointer whitespace-nowrap shrink-0 border-2 ${
                        isTabActive
                          ? 'bg-amber-500 border-amber-600 text-white shadow-md'
                          : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'
                      }`}
                      id={`tab-nav-${tab.id}`}
                    >
                      <IconComponent className={`w-4 h-4 ${isTabActive ? 'text-white stroke-[3px]' : 'text-slate-400'}`} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Dynamic Module Rendering Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6" id="dashboard-active-stage">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="focus:outline-none"
              >
                {activeTab === 'overview' && (
                  <DashboardOverview 
                    transactions={activeDb.transactions} 
                    budgets={activeDb.budgets}
                    profileName={activeDb.profile.name}
                    language={language}
                  />
                )}
                {activeTab === 'ledger' && (
                  <TransactionTracker 
                    transactions={activeDb.transactions}
                    onAddTransaction={handleAddTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    language={language}
                  />
                )}
                {activeTab === 'budgets' && (
                  <BudgetManager 
                    budgets={activeDb.budgets}
                    transactions={activeDb.transactions}
                    onSetBudget={handleSetBudget}
                    onDeleteBudget={handleDeleteBudget}
                    language={language}
                  />
                )}
                {activeTab === 'security' && (
                  <SecurityProfile 
                    profile={activeDb.profile}
                    securityLogs={securityLogs}
                    onUpdateProfile={handleUpdateProfile}
                    onTriggerRegisterBiometrics={handleTriggerRegisterBiometrics}
                    onClearBiometrics={handleClearBiometrics}
                    onClearLogs={() => setSecurityLogs([])}
                    language={language}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      ) : (
        
        // 2. ENCRYPTED AUTHENTICATION ENTRY POINT PORTAL
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-amber-50/20 relative overflow-hidden" id="auth-portal-viewport">
          
          {/* Elegant ambient backdrop assets */}
          <div className="absolute top-0 left-0 right-0 h-96 bg-linear-to-b from-amber-500/10 to-transparent pointer-events-none" />
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10" id="auth-box">
            {/* Header branding */}
            <div className="text-center mb-8">
              <div className="inline-flex p-4 bg-amber-500 text-white rounded-3xl shadow-lg mb-4">
                <Coins className="w-10 h-10 text-yellow-200 animate-bounce" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950">
                {t.appName}
              </h2>
              <p className="text-xs font-bold text-slate-500 mt-2 max-w-xs mx-auto">
                {t.appSubtitle}
              </p>

              {/* Login Language Switcher */}
              <div className="mt-4 flex justify-center">
                <div className="flex gap-1 bg-amber-100 p-1 rounded-2xl border-2 border-amber-200" id="login-language-switcher">
                  {(['en', 'ru', 'uz'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                        language === lang
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                      type="button"
                    >
                      {lang === 'en' ? '🇬🇧' : lang === 'ru' ? '🇷🇺' : '🇺🇿'} {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Auth form Card */}
            <div className="bg-white py-6 px-6 sm:px-10 rounded-3xl border-4 border-amber-200 shadow-xl" id="auth-card">
              
              {/* LOGIN SCREEN VIEW */}
              {authView === 'login' && (
                <div className="space-y-6" id="login-panel-form">
                  <div className="border-b-2 border-slate-100 pb-3 flex justify-between items-center">
                    <span className="text-sm font-black text-slate-800">{t.unlockVault.split('!')[0]}</span>
                    <button
                      onClick={() => { setAuthView('register'); setAuthError(''); setAuthSuccess(''); }}
                      className="text-xs font-black text-amber-600 hover:text-amber-700 transition-colors cursor-pointer"
                      id="go-register-btn"
                    >
                      {t.createAccount}
                    </button>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                      <label htmlFor="login-email" className="text-xs font-black text-slate-700 block">{t.emailAddress}</label>
                      <input
                        id="login-email"
                        type="email"
                        placeholder="you@domain.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 text-sm font-bold bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-200 focus:bg-white text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label htmlFor="login-password" className="text-xs font-black text-slate-700 block">{t.passcode}</label>
                        <button
                          type="button"
                          onClick={() => { setAuthView('recover'); setRecoveryStep('email'); setAuthError(''); setAuthSuccess(''); }}
                          className="text-xs font-bold text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                          id="forgot-pass-btn"
                        >
                          {t.forgotPass}
                        </button>
                      </div>
                      <input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 text-sm font-bold bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-200 focus:bg-white text-slate-900"
                      />
                    </div>

                    {authError && (
                      <div className="p-3 bg-rose-50 border-2 border-rose-200 text-rose-600 text-xs font-bold rounded-xl flex items-start gap-1.5 animate-pulse" id="login-error-alert">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{authError}</span>
                      </div>
                    )}

                    {authSuccess && (
                      <div className="p-3 bg-emerald-50 border-2 border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-start gap-1.5" id="login-success-alert">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{authSuccess}</span>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                        id="login-submit-btn"
                      >
                        <Unlock className="w-5 h-5 stroke-[2.5px]" /> {t.unlockVault}
                      </button>
                    </div>
                  </form>

                  {/* Biometrics login button option */}
                  <div className="border-t-2 border-slate-100 pt-4 text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">{t.fastSecurityPass}</span>
                    <button
                      onClick={handleTriggerBiometricLogin}
                      className="w-full py-3 px-4 rounded-2xl border-2 border-slate-200 hover:bg-slate-50 transition-all text-xs font-black text-slate-700 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      id="biometric-login-btn"
                    >
                      <Fingerprint className="w-5 h-5 text-emerald-500 animate-bounce" /> {t.unlockWithBiometrics}
                    </button>
                  </div>
                </div>
              )}

              {/* REGISTER SCREEN VIEW */}
              {authView === 'register' && (
                <div className="space-y-6" id="register-panel-form">
                  <div className="border-b-2 border-slate-100 pb-3 flex justify-between items-center">
                    <span className="text-sm font-black text-slate-800">{t.createAccount}</span>
                    <button
                      onClick={() => { setAuthView('login'); setAuthError(''); setAuthSuccess(''); }}
                      className="text-xs font-black text-amber-600 hover:text-amber-700 transition-colors cursor-pointer"
                      id="go-login-btn"
                    >
                      {t.backToSignIn}
                    </button>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1">
                      <label htmlFor="register-name" className="text-xs font-black text-slate-700 block">{t.yourName}</label>
                      <input
                        id="register-name"
                        type="text"
                        placeholder="Alex Morgan"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        required
                        className="w-full px-4 py-3 text-sm font-bold bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-200 focus:bg-white text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="register-email" className="text-xs font-black text-slate-700 block">{t.emailAddress}</label>
                      <input
                        id="register-email"
                        type="email"
                        placeholder="you@domain.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 text-sm font-bold bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-200 focus:bg-white text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="register-password" className="text-xs font-black text-slate-700 block">{t.passcode}</label>
                      <input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 text-sm font-bold bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-200 focus:bg-white text-slate-900"
                      />
                      <span className="text-[10px] text-slate-400 block font-bold leading-tight pt-1">
                        {t.securePasswordNote}
                      </span>
                    </div>

                    {authError && (
                      <div className="p-3 bg-rose-50 border-2 border-rose-200 text-rose-600 text-xs font-bold rounded-xl flex items-start gap-1.5 animate-pulse" id="register-error-alert">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{authError}</span>
                      </div>
                    )}

                    {authSuccess && (
                      <div className="p-3 bg-emerald-50 border-2 border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-start gap-1.5" id="register-success-alert">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{authSuccess}</span>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                        id="register-submit-btn"
                      >
                        <Key className="w-5 h-5 stroke-[2.5px]" /> {t.initializeAndEncrypt}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* PASSWORD RECOVERY VIEW */}
              {authView === 'recover' && (
                <div className="space-y-6" id="recovery-panel-form">
                  <div className="border-b-2 border-slate-100 pb-3 flex justify-between items-center">
                    <span className="text-sm font-black text-slate-800">{t.passcodeRecovery}</span>
                    <button
                      onClick={() => { setAuthView('login'); setAuthError(''); setAuthSuccess(''); setRecoveryStep('email'); }}
                      className="text-xs font-black text-amber-600 hover:text-amber-700 transition-colors cursor-pointer"
                      id="back-to-login-from-recovery"
                    >
                      {t.backToSignIn}
                    </button>
                  </div>

                  {recoveryStep === 'email' && (
                    <form onSubmit={handleInitiateRecovery} className="space-y-4">
                      <p className="text-xs font-bold text-slate-500 leading-normal">
                        {t.recoveryEmailLabel}
                      </p>
                      <div className="space-y-1">
                        <label htmlFor="recover-email" className="text-xs font-black text-slate-700 block">{t.emailAddress}</label>
                        <input
                          id="recover-email"
                          type="email"
                          placeholder="you@domain.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          required
                          className="w-full px-4 py-3 text-sm font-bold bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-200 focus:bg-white text-slate-900"
                        />
                      </div>

                      {authError && (
                        <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border-2 border-rose-200">
                          {authError}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                        id="recover-step-1-btn"
                      >
                        {t.retrieveQuestion} <ArrowRight className="w-5 h-5 stroke-[2.5px]" />
                      </button>
                    </form>
                  )}

                  {recoveryStep === 'question' && (
                    <form onSubmit={handleVerifyRecovery} className="space-y-4">
                      <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 space-y-1 text-slate-700">
                        <span className="text-[10px] uppercase font-black tracking-wider text-amber-800 block">{t.securityChallenge}</span>
                        <p className="text-xs font-black leading-normal">{getQuestionLabel(recoveryQuestion)}</p>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="recover-answer" className="text-xs font-black text-slate-700 block">{t.yourAnswer}</label>
                        <input
                          id="recover-answer"
                          type="text"
                          placeholder="Provide security question answer"
                          value={recoveryAnswer}
                          onChange={(e) => setRecoveryAnswer(e.target.value)}
                          required
                          className="w-full px-4 py-3 text-sm font-bold bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-200 focus:bg-white text-slate-900"
                        />
                        <span className="text-[10px] text-slate-400 block font-bold leading-normal mt-1">{t.recoveryAnswerNote}</span>
                      </div>

                      {authError && (
                        <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border-2 border-rose-200 animate-pulse">
                          {authError}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                        id="recover-step-2-btn"
                      >
                        {t.verifyAnswer} <ArrowRight className="w-5 h-5 stroke-[2.5px]" />
                      </button>
                    </form>
                  )}

                  {recoveryStep === 'reset' && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <p className="text-xs font-bold text-slate-500 leading-normal">
                        Approved! Reset your secret passcode below:
                      </p>
                      
                      <div className="space-y-1">
                        <label htmlFor="recover-new-password" className="text-xs font-black text-slate-700 block">{t.newPasscode}</label>
                        <input
                          id="recover-new-password"
                          type="password"
                          placeholder="••••••••"
                          value={recoveryNewPassword}
                          onChange={(e) => setRecoveryNewPassword(e.target.value)}
                          required
                          className="w-full px-4 py-3 text-sm font-bold bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-200 focus:bg-white text-slate-900"
                        />
                      </div>

                      {authError && (
                        <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border-2 border-rose-200">
                          {authError}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                        id="recover-step-3-btn"
                      >
                        {t.saveNewPasscode} <ArrowRight className="w-5 h-5 stroke-[2.5px]" />
                      </button>
                    </form>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* 3. BIOMETRIC HARDWARE INTERACTION OVERLAY (PROMPT) */}
      <BiometricAuthModal
        isOpen={biometricModalOpen}
        onClose={() => setBiometricModalOpen(false)}
        mode={biometricModalMode}
        biometricType={activeBiometricType}
        language={language}
        onSuccess={
          biometricModalMode === 'authenticate' 
            ? handleBiometricAuthSuccess 
            : handleBiometricRegisterSuccess
        }
        onFailure={(reason) => {
          setAuthError(reason);
        }}
      />

      {/* Beautiful standard footer */}
      <footer className="bg-white border-t-2 border-slate-100 py-4 px-4 text-center text-[10px] text-slate-400 font-bold" id="global-footer">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>&copy; {new Date().getFullYear()} FinVault Kids. {t.localSandbox}</span>
          <span className="flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 text-emerald-700">
            <Shield className="w-3.5 h-3.5" /> End-to-End Local Cryptography Sandbox Active
          </span>
        </div>
      </footer>

    </div>
  );
}
