import fs from 'fs';
import path from 'path';
import { TopUpRequest, TopUpStatus, SellerWalletBalance } from '@/types/financials';

const DATA_DIR = path.join(process.cwd(), '.data');
const TOPUPS_FILE = path.join(DATA_DIR, 'khidmatik_financial_topups.json');
const WALLETS_FILE = path.join(DATA_DIR, 'khidmatik_financial_wallets.json');

const INITIAL_SEED_WALLETS: SellerWalletBalance[] = [
  {
    sellerId: 'user_1534d1e7',
    sellerName: 'Ahmed Benali',
    entityType: 'client' as any,
    email: 'ahmed.benali@gmail.com',
    phone: '+213 550 12 34 56',
    wilaya: 'Algiers (16)',
    pendingBalance: 0,
    availableBalance: 20000,
    lifetimeGross: 20000,
    totalCommissionPaid: 0,
    totalWithdrawn: 0,
    currency: 'DZD',
    defaultPayoutMethod: 'Algérie Poste (CCP)',
    defaultAccountNumber: '001928374 12',
    defaultRipNumber: '00799999001928374128',
    lastSettlementAt: '2026-08-26 11:00:00',
  },
  {
    sellerId: '1534d1e7-93d2-45f3-94af-180b06fce8a2',
    sellerName: 'Ahmed Benali',
    entityType: 'client' as any,
    email: 'ahmed.benali@gmail.com',
    phone: '+213 550 12 34 56',
    wilaya: 'Algiers (16)',
    pendingBalance: 0,
    availableBalance: 20000,
    lifetimeGross: 20000,
    totalCommissionPaid: 0,
    totalWithdrawn: 0,
    currency: 'DZD',
    defaultPayoutMethod: 'Algérie Poste (CCP)',
    defaultAccountNumber: '001928374 12',
    defaultRipNumber: '00799999001928374128',
    lastSettlementAt: '2026-08-26 11:00:00',
  },
  {
    sellerId: 'usr_2',
    sellerName: 'Karim Bouzid',
    entityType: 'client' as any,
    email: 'karim.bouzid@gmail.com',
    phone: '+213 551 88 99 00',
    wilaya: 'Oran (31)',
    pendingBalance: 0,
    availableBalance: 15000,
    lifetimeGross: 15000,
    totalCommissionPaid: 0,
    totalWithdrawn: 0,
    currency: 'DZD',
    defaultPayoutMethod: 'BaridiMob',
    defaultAccountNumber: '00799999001122334455',
    defaultRipNumber: '00799999001122334455',
    lastSettlementAt: '2026-08-25 15:00:00',
  },
];

const INITIAL_SEED_TOPUPS: TopUpRequest[] = [
  {
    id: 'topup_1',
    publicRequestNumber: 'TOP-2026-000125',
    userId: 'user_1534d1e7',
    userName: 'Ahmed Benali',
    userEmail: 'ahmed.benali@gmail.com',
    userPhone: '+213 550 12 34 56',
    accountType: 'client',
    walletId: 'w_ahmed_1',
    amount: 20000,
    currency: 'DZD',
    paymentMethod: 'ccp',
    status: 'APPROVED',
    createdAt: '2026-08-26 10:30:00',
    expiresAt: '2026-08-28 10:30:00',
    platformAccountName: 'KHIDMATIK / منصة خدماتك',
    platformCcpNumber: '0022334455 88',
    platformRipNumber: '00799999002233445588',
    postalTransactionCode: '98412034',
    senderName: 'Ahmed Benali',
    senderAccount: '001928374 12',
    transferDate: '2026-08-26',
    receiptUrl: '/receipts/ccp_sample_1.jpg',
    userNotes: 'تحويل عبر مكتب بريد الجزائر - وسط العاصمة',
    reviewedBy: 'Admin Supervisor',
    reviewedAt: '2026-08-26 11:15:00',
    adminNotes: 'تم التحقق من الحوالة البريدية والمطابقة اليدوية بنجاح',
  },
  {
    id: 'topup_2',
    publicRequestNumber: 'TOP-2026-000124',
    userId: 'usr_2',
    userName: 'Karim Bouzid',
    userEmail: 'karim.bouzid@gmail.com',
    userPhone: '+213 551 88 99 00',
    accountType: 'client',
    walletId: 'w_karim_1',
    amount: 15000,
    currency: 'DZD',
    paymentMethod: 'baridimob',
    status: 'APPROVED',
    createdAt: '2026-08-25 14:20:00',
    expiresAt: '2026-08-27 14:20:00',
    platformAccountName: 'KHIDMATIK / منصة خدماتك',
    platformCcpNumber: '0022334455 88',
    platformRipNumber: '00799999002233445588',
    postalTransactionCode: 'BM-20260825-9921',
    senderName: 'Karim Bouzid',
    senderAccount: '00799999001122334455',
    transferDate: '2026-08-25',
    reviewedBy: 'Admin Supervisor',
    reviewedAt: '2026-08-25 15:00:00',
    adminNotes: 'تمت مطابقة الكود مع كشف BaridiMob وإيداع الرصيد بنجاح',
  },
  {
    id: 'topup_nabil_15',
    publicRequestNumber: 'TOP-2026-000015',
    userId: 'usr_nabil',
    userName: 'NABIL',
    userEmail: 'nabil@khidmatik.dz',
    userPhone: '+213 661 00 00 15',
    accountType: 'client',
    walletId: 'w_nabil_1',
    amount: 20000,
    currency: 'DZD',
    paymentMethod: 'baridimob',
    status: 'UNDER_REVIEW',
    createdAt: '2026-09-08 15:30:00',
    expiresAt: '2026-09-10 15:30:00',
    platformAccountName: 'KHIDMATIK / منصة خدماتك',
    platformCcpNumber: '0022334455 88',
    platformRipNumber: '00799999002233445588',
    postalTransactionCode: 'BM-20260908-7712',
    paymentReference: 'BM-20260908-7712',
    senderName: 'Nabil Client',
    transferDate: '2026-09-08',
    userNotes: 'الطلب قيد المراجعة والمطابقة المالية من قبل إدارة منصة خدمتك',
  },
];

function ensureDataFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(TOPUPS_FILE)) {
      fs.writeFileSync(TOPUPS_FILE, JSON.stringify(INITIAL_SEED_TOPUPS, null, 2), 'utf-8');
    } else {
      const raw = fs.readFileSync(TOPUPS_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        let changed = false;
        INITIAL_SEED_TOPUPS.forEach(seed => {
          if (!list.some(item => item.publicRequestNumber === seed.publicRequestNumber || item.id === seed.id)) {
            list.unshift(seed);
            changed = true;
          }
        });
        if (changed) {
          fs.writeFileSync(TOPUPS_FILE, JSON.stringify(list, null, 2), 'utf-8');
        }
      }
    }

    if (!fs.existsSync(WALLETS_FILE)) {
      fs.writeFileSync(WALLETS_FILE, JSON.stringify(INITIAL_SEED_WALLETS, null, 2), 'utf-8');
    }
  } catch (e) {
    console.warn('[serverFinancialStore] Failed to initialize data files:', e);
  }
}

export function readServerTopUps(): TopUpRequest[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(TOPUPS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.warn('[serverFinancialStore] Failed to read topups file:', e);
  }
  return INITIAL_SEED_TOPUPS;
}

export function writeServerTopUps(list: TopUpRequest[]): void {
  ensureDataFile();
  try {
    fs.writeFileSync(TOPUPS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.error('[serverFinancialStore] Failed to write topups file:', e);
  }
}

export function readServerWallets(): SellerWalletBalance[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(WALLETS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.warn('[serverFinancialStore] Failed to read wallets file:', e);
  }
  return INITIAL_SEED_WALLETS;
}

export function writeServerWallets(list: SellerWalletBalance[]): void {
  ensureDataFile();
  try {
    fs.writeFileSync(WALLETS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.error('[serverFinancialStore] Failed to write wallets file:', e);
  }
}

export function getServerWallet(userId: string): SellerWalletBalance {
  const wallets = readServerWallets();
  const cleanId = (userId || '').trim().toLowerCase();
  let wallet = wallets.find(w => w.sellerId.toLowerCase() === cleanId || 
    (cleanId.startsWith('1534d1e7') && (w.sellerId.includes('1534d1e7') || w.sellerId === 'user_1534d1e7'))
  );

  if (!wallet) {
    wallet = {
      sellerId: userId,
      sellerName: 'Khidmatik User',
      entityType: 'client' as any,
      email: '',
      phone: '',
      wilaya: 'Algiers (16)',
      pendingBalance: 0,
      availableBalance: 0,
      lifetimeGross: 0,
      totalCommissionPaid: 0,
      totalWithdrawn: 0,
      currency: 'DZD',
      defaultPayoutMethod: 'Algérie Poste (CCP)',
      defaultAccountNumber: '',
      defaultRipNumber: '',
      lastSettlementAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    wallets.unshift(wallet);
    writeServerWallets(wallets);
  }
  return wallet;
}

export function creditServerWallet(userId: string, amount: number, referenceId?: string): SellerWalletBalance {
  const wallets = readServerWallets();
  const cleanId = (userId || '').trim().toLowerCase();
  let wallet = wallets.find(w => w.sellerId.toLowerCase() === cleanId || 
    (cleanId.startsWith('1534d1e7') && (w.sellerId.includes('1534d1e7') || w.sellerId === 'user_1534d1e7'))
  );

  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

  if (!wallet) {
    wallet = {
      sellerId: userId,
      sellerName: 'Khidmatik User',
      entityType: 'client' as any,
      email: '',
      phone: '',
      wilaya: 'Algiers (16)',
      pendingBalance: 0,
      availableBalance: amount,
      lifetimeGross: amount,
      totalCommissionPaid: 0,
      totalWithdrawn: 0,
      currency: 'DZD',
      defaultPayoutMethod: 'Algérie Poste (CCP)',
      defaultAccountNumber: '',
      defaultRipNumber: '',
      lastSettlementAt: nowStr,
    };
    wallets.unshift(wallet);
  } else {
    wallet.availableBalance += amount;
    wallet.lifetimeGross += amount;
    wallet.lastSettlementAt = nowStr;
  }

  writeServerWallets(wallets);
  return wallet;
}

export function getServerTopUps(filter?: {
  status?: TopUpStatus;
  userId?: string;
  search?: string;
}): TopUpRequest[] {
  let list = readServerTopUps();
  if (!filter) return list;

  if (filter.status) {
    list = list.filter((r) => r.status === filter.status);
  }
  if (filter.userId) {
    list = list.filter((r) => r.userId === filter.userId);
  }
  if (filter.search) {
    const q = filter.search.toLowerCase();
    list = list.filter(
      (r) =>
        r.publicRequestNumber.toLowerCase().includes(q) ||
        r.userName.toLowerCase().includes(q) ||
        (r.postalTransactionCode && r.postalTransactionCode.toLowerCase().includes(q))
    );
  }
  return list;
}

export function getServerTopUpById(id: string): TopUpRequest | null {
  const list = readServerTopUps();
  return list.find((r) => r.id === id || r.publicRequestNumber === id) || null;
}

export function addServerTopUp(newReq: TopUpRequest): TopUpRequest {
  const list = readServerTopUps();
  const existingIdx = list.findIndex(
    (r) => r.id === newReq.id || r.publicRequestNumber === newReq.publicRequestNumber
  );
  if (existingIdx !== -1) {
    list[existingIdx] = newReq;
  } else {
    list.unshift(newReq);
  }
  writeServerTopUps(list);
  return newReq;
}

export function updateServerTopUp(
  id: string,
  updates: Partial<TopUpRequest>
): TopUpRequest | null {
  const list = readServerTopUps();
  const idx = list.findIndex((r) => r.id === id || r.publicRequestNumber === id);
  if (idx === -1) return null;

  const prevStatus = list[idx].status;
  list[idx] = {
    ...list[idx],
    ...updates,
    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };
  writeServerTopUps(list);

  // Link TopUp approval directly to user wallet balance
  if (updates.status === 'APPROVED' && prevStatus !== 'APPROVED') {
    creditServerWallet(list[idx].userId, list[idx].amount, list[idx].publicRequestNumber);
  }

  return list[idx];
}

export function isServerPostalCodeUsed(code: string, excludeId?: string): boolean {
  if (!code) return false;
  const cleanCode = code.trim().toLowerCase();
  const list = readServerTopUps();
  return list.some(
    (r) =>
      r.id !== excludeId &&
      (r.status === 'APPROVED' || r.status === 'UNDER_REVIEW') &&
      r.postalTransactionCode &&
      r.postalTransactionCode.trim().toLowerCase() === cleanCode
  );
}

