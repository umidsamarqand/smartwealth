export type TransactionType = 'income' | 'expense';
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  notes: string;
}

export interface Budget {
  category: string;
  amount: number;
  period: BudgetPeriod;
}

export interface UserProfile {
  name: string;
  email: string;
  securityQuestion: string;
  securityAnswer: string;
  biometricsEnabled: boolean;
  biometricType?: 'fingerprint' | 'face' | 'none';
  biometricRegisteredAt?: string;
}

export interface FinanceDatabase {
  transactions: Transaction[];
  budgets: Budget[];
  profile: UserProfile;
}

export interface UserRegistryEntry {
  email: string;
  name: string;
  passwordHash: string;
  encryptedData: string; // FinanceDatabase encrypted with password
  biometricsEnabled: boolean;
  biometricCredentialId?: string; // ID of simulated biometric credential
}

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Gifts',
  'Other Income'
];

export const EXPENSE_CATEGORIES = [
  'Groceries',
  'Rent & Housing',
  'Utilities',
  'Dining Out',
  'Entertainment',
  'Shopping',
  'Transport',
  'Healthcare',
  'Travel',
  'Miscellaneous'
];

export const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What was the name of your elementary school?",
  "In what city or town was your first job?",
  "What is the model of your first car?"
];

// High-fidelity initial demo data for new accounts to make reports beautiful immediately
export function getDemoDatabase(name: string, email: string): FinanceDatabase {
  const currentDate = new Date();
  const formatOffsetDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(currentDate.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  return {
    transactions: [
      {
        id: 'tx-1',
        amount: 3200,
        type: 'income',
        category: 'Salary',
        date: formatOffsetDate(25),
        notes: 'Monthly principal payroll direct deposit'
      },
      {
        id: 'tx-2',
        amount: 450,
        type: 'income',
        category: 'Freelance',
        date: formatOffsetDate(10),
        notes: 'Frontend UI design consulting project'
      },
      {
        id: 'tx-3',
        amount: 1200,
        type: 'expense',
        category: 'Rent & Housing',
        date: formatOffsetDate(28),
        notes: 'Apartment monthly lease'
      },
      {
        id: 'tx-4',
        amount: 142.50,
        type: 'expense',
        category: 'Groceries',
        date: formatOffsetDate(12),
        notes: 'Organic market food run'
      },
      {
        id: 'tx-5',
        amount: 85.20,
        type: 'expense',
        category: 'Groceries',
        date: formatOffsetDate(3),
        notes: 'Weekly pantry replenishment'
      },
      {
        id: 'tx-6',
        amount: 95.00,
        type: 'expense',
        category: 'Utilities',
        date: formatOffsetDate(15),
        notes: 'High-speed Fiber Internet & power bill'
      },
      {
        id: 'tx-7',
        amount: 54.30,
        type: 'expense',
        category: 'Dining Out',
        date: formatOffsetDate(8),
        notes: 'Sushi dinner with team members'
      },
      {
        id: 'tx-8',
        amount: 15.75,
        type: 'expense',
        category: 'Dining Out',
        date: formatOffsetDate(1),
        notes: 'Craft espresso and pastry'
      },
      {
        id: 'tx-9',
        amount: 29.99,
        type: 'expense',
        category: 'Entertainment',
        date: formatOffsetDate(20),
        notes: 'Music & Video streaming services subscription'
      },
      {
        id: 'tx-10',
        amount: 120.00,
        type: 'expense',
        category: 'Shopping',
        date: formatOffsetDate(5),
        notes: 'Premium ergonomic mechanical keyboard keycaps'
      },
      {
        id: 'tx-11',
        amount: 45.00,
        type: 'expense',
        category: 'Transport',
        date: formatOffsetDate(18),
        notes: 'City rapid transit card reload'
      }
    ],
    budgets: [
      { category: 'Groceries', amount: 350, period: 'monthly' },
      { category: 'Rent & Housing', amount: 1300, period: 'monthly' },
      { category: 'Utilities', amount: 150, period: 'monthly' },
      { category: 'Dining Out', amount: 200, period: 'monthly' },
      { category: 'Entertainment', amount: 100, period: 'monthly' },
      { category: 'Shopping', amount: 250, period: 'monthly' }
    ],
    profile: {
      name,
      email,
      securityQuestion: SECURITY_QUESTIONS[0],
      securityAnswer: 'Spot',
      biometricsEnabled: false
    }
  };
}
