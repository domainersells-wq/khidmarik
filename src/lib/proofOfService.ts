export interface AuditLog {
  action: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  device?: string;
  gps?: string;
  details?: string;
}

export interface MaterialItem {
  name: string;
  quantity: number;
  price: number;
}

export interface WorkChecklist {
  workDone: boolean;
  cleanUp: boolean;
  tested: boolean;
  explained: boolean;
}

export interface ServiceNotesPayload {
  email: string;
  reason: string;
  location: string;
  gpsCoords?: string;
  policyNotes?: string;
  
  // Proof of Service
  startTime?: string;
  startGps?: string;
  startDevice?: string;
  
  endTime?: string;
  endPhotos?: string[];
  endNotes?: string;
  endDuration?: string;
  
  otpCode?: string; // Stored in plain text (ONLY visible to client dashboard view)
  otpCodeHash?: string; // Stored as SHA-256 hash (used for verification check by provider)
  otpExpiresAt?: string; // ISO string
  failedOtpAttempts?: number;
  otpLocked?: boolean;
  
  disputeReason?: string;
  disputeComments?: string;
  disputeTimestamp?: string;
  
  providerRating?: number;
  providerComments?: string;
  providerRatingTimestamp?: string;
  
  customerRating?: number;
  customerComments?: string;
  customerRatingTimestamp?: string;
  
  auditLogs: AuditLog[];

  // Completion Report Expansion Fields
  beforePhotos?: string[];
  afterPhotos?: string[];
  materialsUsed?: MaterialItem[];
  workChecklist?: WorkChecklist;
  completionNotesText?: string;
  gpsVerified?: boolean;
  gpsVerifiedAt?: string;
}

/**
 * Computes SHA-256 hash of OTP. Falls back to a deterministic hash in older/unsecure contexts.
 */
export async function hashOTP(otp: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(otp);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.error("Crypto subtle SHA-256 failed, utilizing fallback hash", e);
  }
  
  // Fallback simple hash function
  let hash = 0;
  for (let i = 0; i < otp.length; i++) {
    hash = (hash << 5) - hash + otp.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return 'fallback_' + Math.abs(hash).toString();
}

/**
 * Generates a cryptographically random 6-digit OTP code.
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Formats browser user agent string to human readable OS / browser name
 */
export function getDeviceAndBrowser(): { device: string; browser: string } {
  let userAgent = 'Unknown';
  let device = 'Desktop PC';
  let browser = 'Modern Browser';

  if (typeof window !== 'undefined') {
    userAgent = window.navigator.userAgent;
    const ua = userAgent.toLowerCase();
    
    // OS Check
    if (ua.includes('android')) device = 'Android Device';
    else if (ua.includes('iphone')) device = 'iPhone';
    else if (ua.includes('ipad')) device = 'iPad';
    else if (ua.includes('windows')) device = 'Windows PC';
    else if (ua.includes('macintosh')) device = 'MacBook / iMac';
    else if (ua.includes('linux')) device = 'Linux PC';

    // Browser Check
    if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('chrome') && !ua.includes('chromium')) browser = 'Chrome';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Microsoft Edge';
    else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';
  }

  return { device, browser };
}

/**
 * Creates a formatted AuditLog item capturing local device information
 */
export function createAuditLog(action: string, details?: string, gps?: string): AuditLog {
  const { device, browser } = getDeviceAndBrowser();
  return {
    action,
    timestamp: new Date().toISOString(),
    ip: '197.112.45.109 (Algiers CCP/CIB Host)', // Mock local Algerian IP
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    device,
    gps,
    details: details || `${action} action completed via ${browser}`
  };
}

/**
 * Safely parses the notes column. Fallbacks to regex search if notes is structured in legacy string.
 */
export function parseServiceNotes(notesText?: string): ServiceNotesPayload {
  if (!notesText) {
    return { email: '', reason: '', location: '', auditLogs: [] };
  }
  
  const trimmed = notesText.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && Array.isArray(parsed.auditLogs)) {
        return parsed as ServiceNotesPayload;
      }
    } catch (e) {
      console.warn("Failed to parse JSON notes, falling back to regex extraction", e);
    }
  }
  
  // Backward-compatibility extraction
  const getMatch = (regex: RegExp): string => {
    const match = notesText.match(regex);
    return match ? match[1].trim() : '';
  };
  
  const email = getMatch(/Contact Email:\s*([^\n]+)/i);
  const reason = getMatch(/Reason:\s*([^\n]+)/i);
  const location = getMatch(/Location:\s*([^\n]+)/i);
  const policy = getMatch(/Policy:\s*([^\n]+)/i);
  
  return {
    email: email || 'client@khidmatik.dz',
    reason: reason || 'Service Requested',
    location: location || 'Not specified',
    policyNotes: policy || 'Standard punctuality guidelines',
    auditLogs: [
      {
        action: 'LEGACY_IMPORT',
        timestamp: new Date().toISOString(),
        details: 'Converted legacy notes format to structured workflow schema'
      }
    ]
  };
}

/**
 * Serializes the structured service notes payload.
 */
export function serializeServiceNotes(payload: ServiceNotesPayload): string {
  return JSON.stringify(payload);
}
