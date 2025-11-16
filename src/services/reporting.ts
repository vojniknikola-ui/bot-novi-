import type { Db } from '../database';

export async function runReport(db: Db, params: { guildId: string; type: string }) {
  switch (params.type) {
    case 'time-today':
      return timeToday(db, params.guildId);
    case 'vacation-pending':
      return pending(db, params.guildId);
    case 'user-activity':
      return userActivity(db, params.guildId);
    case 'vacation-usage':
      return vacationUsage(db, params.guildId);
    case 'work-hours':
      return workHours(db, params.guildId);
    default:
      return 'Report not implemented yet.';
  }
}

async function timeToday(db: Db, guildId: string) {
  const rows = await db`
    SELECT u.username, SUM(te.duration_minutes) as minutes
    FROM time_entries te
    JOIN users u ON u.id = te.user_id
    WHERE te.guild_id = ${guildId} AND te.started_at::date = CURRENT_DATE
    GROUP BY u.username
  `;

  if (rows.length === 0) return '📭 Nema današnjih unosa.';

  return rows.map((r) => `• ${r.username}: ${(r.minutes / 60).toFixed(2)}h`).join('\n');
}

async function pending(db: Db, guildId: string) {
  const rows = await db`
    SELECT COUNT(*) as count
    FROM vacation_requests
    WHERE guild_id = ${guildId} AND status IN ('pending', 'pm_approved')
  `;

  return `📬 Zahtjevi na čekanju: ${rows[0].count}`;
}

async function userActivity(db: Db, guildId: string) {
  const rows = await db`
    SELECT u.username, COUNT(*) as entries
    FROM time_entries te
    JOIN users u ON u.id = te.user_id
    WHERE te.guild_id = ${guildId} AND te.started_at >= NOW() - INTERVAL '7 days'
    GROUP BY u.username
    ORDER BY entries DESC
    LIMIT 10
  `;

  if (rows.length === 0) return '📭 Nema aktivnosti u zadnjih 7 dana.';
  return rows.map((r) => `• ${r.username}: ${r.entries} unosa`).join('\n');
}

async function vacationUsage(db: Db, guildId: string) {
  const rows = await db`
    SELECT u.username, v.used_days, (v.annual_allocation + v.carried_over - v.used_days) AS remaining
    FROM user_vacation_balance v
    JOIN users u ON u.id = v.user_id
    WHERE u.guild_id = ${guildId}
    ORDER BY v.used_days DESC
    LIMIT 10
  `;

  if (rows.length === 0) return '📭 Nema podataka o godišnjem.';
  return rows.map((r) => `• ${r.username}: ${r.used_days} iskorišteno, ${r.remaining} preostalo`).join('\n');
}

async function workHours(db: Db, guildId: string) {
  const rows = await db`
    SELECT DATE(started_at) as day, SUM(duration_minutes) as minutes
    FROM time_entries
    WHERE guild_id = ${guildId} AND started_at >= NOW() - INTERVAL '7 days'
    GROUP BY day
    ORDER BY day DESC
  `;

  if (rows.length === 0) return '📭 Nema radnih sati za prikaz.';

  return rows.map((r) => `${r.day}: ${(r.minutes / 60).toFixed(2)}h`).join('\n');
}
