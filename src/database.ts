import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

export type Db = NeonQueryFunction<false, false>;

export interface Env {
  DISCORD_PUBLIC_KEY: string;
  DISCORD_APPLICATION_ID: string;
  NEON_DATABASE_URL: string;
}

export function getDb(env: Env): Db {
  if (!env.NEON_DATABASE_URL) {
    throw new Error('NEON_DATABASE_URL is not configured');
  }

  return neon(env.NEON_DATABASE_URL);
}

export async function ensureUser(db: Db, userId: string, guildId: string, username: string) {
  await db`
    INSERT INTO users (id, guild_id, username)
    VALUES (${userId}, ${guildId}, ${username})
    ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username
  `;

  await db`
    INSERT INTO user_vacation_balance (user_id)
    VALUES (${userId})
    ON CONFLICT (user_id) DO NOTHING
  `;
}
