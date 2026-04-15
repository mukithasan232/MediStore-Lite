// Security Utilities for MediStore Lite

/**
 * Input Validation and Sanitization
 */

export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>\"']/g, '') // Remove special characters
    .trim();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

export function validateMoney(amount: number): boolean {
  return amount >= 0 && !isNaN(amount) && isFinite(amount);
}

/**
 * SQL Injection Prevention
 * Always use parameterized queries (handled by Prisma/Supabase)
 */

/**
 * CSRF Token Validation
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Server-side fallback
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Session Security
 */
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
export const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: SESSION_TIMEOUT,
};

/**
 * Password Security Requirements
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Authorization Checks
 */
export function isAuthorized(userRole: string, requiredRole: string | string[]): boolean {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(userRole);
}

/**
 * Audit Logging
 */
export interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  status: 'SUCCESS' | 'FAILED';
  details?: Record<string, any>;
}

/**
 * Request Validation
 */
export function validateRequest(data: Record<string, any>, requiredFields: string[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * XSS Protection - Content Security Policy enforced via headers
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * API Response Helper
 */
export function apiResponse(success: boolean, data: any = null, error: string | null = null) {
  return {
    success,
    data,
    error,
    timestamp: new Date().toISOString(),
  };
}
