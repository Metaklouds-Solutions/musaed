/**
 * Entity types for adapters. Every entity includes tenantId for tenant isolation.
 */

export interface Tenant {
  id: string;
  name: string;
}

export interface Agent {
  id: string;
  tenantId: string;
  name: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
}

export interface Call {
  id: string;
  tenantId: string;
  customerId: string;
  duration: number;
  sentimentScore: number;
  transcript: string;
  escalationFlag: boolean;
  bookingCreated: boolean;
  bookingId?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  tenantId: string;
  callId?: string;
  customerId: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  tenantId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  resolved: boolean;
  createdAt: string;
}

export interface Credits {
  tenantId: string;
  balance: number;
  minutesUsed: number;
}
