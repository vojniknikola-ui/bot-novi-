import type { Db } from '../database';

export async function guildStatus(
  db: Db,
  params: { guildId: string; type: 'online' | 'on-break' | 'on-vacation' | 'team-overview' }
) {
  switch (params.type) {
    case 'online':
      return formatSessionList(await fetchSessions(db, params.guildId, false), '🟢 Ko je online');
    case 'on-break':
      return formatSessionList(await fetchSessions(db, params.guildId, true), '☕ Na pauzi su');
    case 'on-vacation':
      return formatVacationList(await fetchVacations(db, params.guildId));
    case 'team-overview':
    default:
      return teamOverview(db, params.guildId);
  }
}

export async function scheduleView(
  db: Db,
  params: { guildId: string; type: 'today' | 'week' | 'vacation-calendar' }
) {
  switch (params.type) {
    case 'today':
      return todaySchedule(db, params.guildId);
    case 'week':
      return weeklySummary(db, params.guildId);
    case 'vacation-calendar':
    default:
      return vacationCalendar(db, params.guildId);
  }
}

async function fetchSessions(db: Db, guildId: string, breaksOnly: boolean) {
  if (breaksOnly) {
    return db`
      SELECT u.username, s.location, s.started_at, s.on_break
      FROM active_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.guild_id = ${guildId} AND s.on_break = TRUE
      ORDER BY s.started_at ASC
    `;
  }

  return db`
    SELECT u.username, s.location, s.started_at, s.on_break
    FROM active_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.guild_id = ${guildId} AND s.status = 'working'
    ORDER BY s.started_at ASC
  `;
}

function formatSessionList(rows: any[], title: string) {
  if (rows.length === 0) {
    return `${title}: niko`;
  }

  const body = rows.map(
    (row) => `• ${row.username} – ${row.location ?? 'office'} od ${new Date(row.started_at).toLocaleTimeString('en-GB')}`
  );
  return [title, ...body].join('\n');
}

async function fetchVacations(db: Db, guildId: string) {
  return db`
    SELECT u.username, v.start_date, v.end_date, v.working_days
    FROM vacation_requests v
    JOIN users u ON u.id = v.user_id
    WHERE v.guild_id = ${guildId}
      AND v.status = 'approved'
      AND CURRENT_DATE BETWEEN v.start_date AND v.end_date
    ORDER BY v.start_date ASC
  `;
}

function formatVacationList(rows: any[]) {
  if (rows.length === 0) {
    return '🏖️ Trenutno niko nije na godišnjem.';
  }

  const body = rows.map((row) => `• ${row.username}: ${row.start_date} → ${row.end_date} (${row.working_days} dana)`);
  return ['🏖️ Ko je na odmoru', ...body].join('\n');
}

async function teamOverview(db: Db, guildId: string) {
  const [working, onBreak, vacation] = await Promise.all([
    db`SELECT COUNT(*)::int AS count FROM active_sessions WHERE guild_id = ${guildId} AND status = 'working'`,
    db`SELECT COUNT(*)::int AS count FROM active_sessions WHERE guild_id = ${guildId} AND on_break = TRUE`,
    db`SELECT COUNT(*)::int AS count FROM vacation_requests WHERE guild_id = ${guildId} AND status = 'approved' AND CURRENT_DATE BETWEEN start_date AND end_date`
  ]);

  return [
    '📊 Team Overview:',
    `🟢 Online: ${working[0].count}`,
    `☕ Pauza: ${onBreak[0].count}`,
    `🏖️ Na odmoru: ${vacation[0].count}`
  ].join('\n');
}

async function todaySchedule(db: Db, guildId: string) {
  const rows = await db`
    SELECT u.username, te.started_at, te.ended_at, te.location
    FROM time_entries te
    JOIN users u ON u.id = te.user_id
    WHERE te.guild_id = ${guildId} AND te.started_at::date = CURRENT_DATE
    ORDER BY te.started_at ASC
  `;

  if (rows.length === 0) {
    return '📅 Nema današnjih unosa.';
  }

  const body = rows.map((row) => {
    const start = new Date(row.started_at).toLocaleTimeString('en-GB');
    const end = row.ended_at ? new Date(row.ended_at).toLocaleTimeString('en-GB') : 'u toku';
    return `• ${row.username}: ${start} – ${end} (${row.location ?? 'office'})`;
  });

  return ['📅 Današnji raspored', ...body].join('\n');
}

async function weeklySummary(db: Db, guildId: string) {
  const rows = await db`
    SELECT u.username, SUM(te.duration_minutes) AS minutes, COUNT(*) AS entries
    FROM time_entries te
    JOIN users u ON u.id = te.user_id
    WHERE te.guild_id = ${guildId} AND te.started_at >= NOW() - INTERVAL '7 days'
    GROUP BY u.username
    ORDER BY minutes DESC
  `;

  if (rows.length === 0) {
    return '📊 Nema unosa u posljednjih 7 dana.';
  }

  return rows
    .map((row) => `• ${row.username}: ${(row.minutes / 60).toFixed(1)}h (${row.entries} dana)`)
    .join('\n');
}

async function vacationCalendar(db: Db, guildId: string) {
  const rows = await db`
    SELECT u.username, v.start_date, v.end_date, v.working_days
    FROM vacation_requests v
    JOIN users u ON u.id = v.user_id
    WHERE v.guild_id = ${guildId}
      AND v.status IN ('approved', 'pm_approved')
      AND v.start_date >= CURRENT_DATE
    ORDER BY v.start_date ASC
    LIMIT 15
  `;

  if (rows.length === 0) {
    return '🗓️ Nema zakazanih odmora.';
  }

  const body = rows.map((row) => `• ${row.username}: ${row.start_date} – ${row.end_date} (${row.working_days} dana)`);
  return ['🗓️ Kalendar godišnjeg', ...body].join('\n');
}
