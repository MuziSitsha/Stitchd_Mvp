import { BadRequestException } from '@nestjs/common';

// Normalize SA phone numbers to +27 format
export function normalizeSaPhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
  if (cleaned.startsWith('0')) return `+27${cleaned.slice(1)}`;
  if (cleaned.startsWith('27')) return `+${cleaned}`;
  if (cleaned.startsWith('+27')) return cleaned;
  throw new BadRequestException('Invalid South African phone number');
}
