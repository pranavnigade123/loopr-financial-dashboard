import { z } from 'zod';

export const categorySchema = z.enum(['Revenue', 'Expense']);
export const statusSchema = z.enum(['Paid', 'Pending']);
export const sourceTransactionSchema = z
  .object({
    id: z.number().int().positive(),
    date: z.iso.datetime(),
    amount: z
      .number()
      .positive()
      .refine(
        (value) =>
          Number.isSafeInteger(Math.round(value * 100)) &&
          Math.abs(value * 100 - Math.round(value * 100)) < 1e-6,
        'Amount must have at most two decimal places',
      ),
    category: categorySchema,
    status: statusSchema,
    user_id: z.string().regex(/^user_\d+$/),
    user_profile: z.url(),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email()),
    password: z.string().min(1).max(256),
  })
  .strict();

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Enter at least 2 characters.')
      .max(80, 'Use at most 80 characters.'),
    email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address.')),
    password: z
      .string()
      .min(12, 'Use at least 12 characters.')
      .max(256, 'Use at most 256 characters.'),
  })
  .strict();

export const transactionQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    category: categorySchema.optional(),
    status: statusSchema.optional(),
    userId: z
      .string()
      .regex(/^user_\d+$/)
      .optional(),
    dateFrom: z.iso.date().optional(),
    dateTo: z.iso.date().optional(),
    amountMin: z
      .string()
      .regex(/^\d{1,9}(\.\d{1,2})?$/)
      .optional(),
    amountMax: z
      .string()
      .regex(/^\d{1,9}(\.\d{1,2})?$/)
      .optional(),
    sortBy: z.enum(['date', 'amountMinor', 'category', 'status', 'userId', 'id']).default('date'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict()
  .refine((q) => !q.dateFrom || !q.dateTo || q.dateFrom <= q.dateTo, {
    message: 'End date must be on or after the start date.',
    path: ['dateTo'],
  })
  .refine((q) => !q.amountMin || !q.amountMax || Number(q.amountMin) <= Number(q.amountMax), {
    message: 'Maximum amount must be at least the minimum.',
    path: ['amountMax'],
  });

export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
export const exportColumns = ['id', 'date', 'amount', 'category', 'status', 'userId'] as const;
export type ExportColumn = (typeof exportColumns)[number];
export const exportSchema = z
  .object({
    query: transactionQuerySchema,
    columns: z
      .array(z.enum(exportColumns))
      .min(1)
      .max(exportColumns.length)
      .refine((items) => new Set(items).size === items.length, 'Columns must be unique'),
  })
  .strict();

export interface Analytics {
  total: number;
  paidRevenueMinor: number;
  paidExpenseMinor: number;
  netCashFlowMinor: number;
  pendingCount: number;
  pendingRevenueMinor: number;
  pendingExpenseMinor: number;
  monthly: { month: string; revenueMinor: number; expenseMinor: number }[];
}

export interface TransactionMetadata {
  users: string[];
  dateFrom: string | null;
  dateTo: string | null;
}

export interface Transaction {
  id: number;
  date: string;
  amountMinor: number;
  category: z.infer<typeof categorySchema>;
  status: z.infer<typeof statusSchema>;
  userId: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}
export interface SessionResponse {
  user: SessionUser;
}
export interface TransactionPage {
  items: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}
export interface ApiError {
  error: { code: string; message: string; requestId: string; fields?: Record<string, string> };
}
