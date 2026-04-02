// src/constants/appConstants.js

import { Clock, CheckCircle2, Truck, XCircle } from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────

export const CLIENT_TYPE = {
  personal: { label: 'Personal', className: 'bg-blue-50 text-blue-700' },
  family: { label: 'Familiar', className: 'bg-purple-50 text-purple-700' },
};

export const PLAN_TYPE = {
  estandar: { label: '⭐ Estándar', className: 'bg-slate-100 text-slate-600' },
  nutricional: { label: '🥗 Nutricional', className: 'bg-green-50 text-green-700' },
};

export const DAY_LABELS = {
  Monday: 'Lunes',
  Tuesday: 'Martes',
  Wednesday: 'Miércoles',
  Thursday: 'Jueves',
  Friday: 'Viernes',
  Saturday: 'Sábado',
  Sunday: 'Domingo',
};

export const STATUS_CONFIG = {
  PENDING: {
    label: 'Pendiente',
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-50 text-amber-700',
  },
  PACKED: {
    label: 'Empacado',
    icon: CheckCircle2,
    color: 'text-blue-500',
    bg: 'bg-blue-50 text-blue-700',
  },
  DELIVERED: {
    label: 'Entregado',
    icon: Truck,
    color: 'text-green-500',
    bg: 'bg-green-50 text-green-700',
  },
  CANCELLED: {
    label: 'Cancelado',
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-50 text-red-600',
  },
};