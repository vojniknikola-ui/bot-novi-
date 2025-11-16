import type { Db } from '../database';

type Location = 'office' | 'home' | 'remote';

export async function clockIn(db: Db, params: { userId: string; guildId: string; location?: string }) {
  const location = (params.location as Location) ?? 'office';
  const session = await db`
    INSERT INTO active_sessions (user_id, guild_id, location, started_at, status)
    VALUES (${params.userId}, ${params.guildId}, ${location}, NOW(), 'working')
    ON CONFLICT (user_id) DO UPDATE
      SET started_at = EXCLUDED.started_at,
          location = EXCLUDED.location,
          status = 'working',
          on_break = FALSE,
          break_started_at = NULL
    RETURNING *
  `;

  return `✅ Clocked in ${location} at ${new Date(session[0].started_at).toLocaleTimeString('en-GB')}`;
}

export async function clockOut(db: Db, params: { userId: string; guildId: string }) {
  const active = await db`
    DELETE FROM active_sessions
    WHERE user_id = ${params.userId}
    RETURNING *
  `;

  if (active.length === 0) {
    return '⚠️ Nema aktivne sesije za odjavu.';
  }

  const startedAt = new Date(active[0].started_at);
  const endedAt = new Date();
  const durationMinutes = Math.max(1, Math.floor((endedAt.getTime() - startedAt.getTime()) / 60000));

  await db`
    INSERT INTO time_entries (user_id, guild_id, started_at, ended_at, duration_minutes, location)
    VALUES (${params.userId}, ${params.guildId}, ${startedAt.toISOString()}, ${endedAt.toISOString()}, ${durationMinutes}, ${active[0].location})
  `;

  return `✅ Clocked out – Worked ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;
}

export async function startBreak(db: Db, params: { userId: string }) {
  const updated = await db`
    UPDATE active_sessions
    SET on_break = TRUE, break_started_at = NOW(), status = 'break'
    WHERE user_id = ${params.userId}
    RETURNING *
  `;

  if (updated.length === 0) {
    return '⚠️ Nemate aktivnu sesiju za pauzu.';
  }

  return '☕ Pauza je započeta.';
}

export async function endBreak(db: Db, params: { userId: string }) {
  const updated = await db`
    UPDATE active_sessions
    SET on_break = FALSE, break_started_at = NULL, status = 'working'
    WHERE user_id = ${params.userId}
    RETURNING *
  `;

  if (updated.length === 0) {
    return '⚠️ Nije pronađena aktivna pauza.';
  }

  return '✅ Pauza je završena.';
}

export async function markOff(db: Db, params: { userId: string }) {
  await db`
    DELETE FROM active_sessions
    WHERE user_id = ${params.userId}
  `;

  return '🚪 Označeni ste kao off duty.';
}

export async function fetchTimeLog(db: Db, params: { userId: string; guildId: string; days: number }) {
  const entries = await db`
    SELECT started_at, ended_at, duration_minutes, location
    FROM time_entries
    WHERE user_id = ${params.userId} AND guild_id = ${params.guildId}
      AND started_at >= NOW() - INTERVAL '${params.days} days'
    ORDER BY started_at DESC
    LIMIT 20
  `;

  if (entries.length === 0) {
    return '📭 Nema unosa za odabrani period.';
  }

  const lines = entries.map((entry) => {
    const start = new Date(entry.started_at).toLocaleString('en-GB');
    const duration = `${Math.floor(entry.duration_minutes / 60)}h ${entry.duration_minutes % 60}m`;
    return `• ${start} – ${duration} (${entry.location ?? 'office'})`;
  });

  return ['🕐 Vrijeme rada:', ...lines].join('\n');
}
