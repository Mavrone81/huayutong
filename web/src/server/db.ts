import { Pool } from "pg";

// Singleton pool (survives Next.js dev HMR).
const g = globalThis as unknown as { __mmPool?: Pool };
export const pool: Pool =
  g.__mmPool ??
  (g.__mmPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 }));

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const r = await pool.query(text, params);
  return r.rows as T[];
}

export async function one<T = any>(text: string, params?: any[]): Promise<T | null> {
  const r = await pool.query(text, params);
  return (r.rows[0] ?? null) as T | null;
}
