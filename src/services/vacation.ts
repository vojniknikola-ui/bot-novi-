import type { Db } from '../database';

export async function requestVacation(db: Db, params: {
  userId: string;
  guildId: string;
  start: string;
  end: string;
  workingDays: number;
  reason?: string;
}) {
  const [request] = await db`
    INSERT INTO vacation_requests (user_id, guild_id, start_date, end_date, working_days, reason)
    VALUES (${params.userId}, ${params.guildId}, ${params.start}, ${params.end}, ${params.workingDays}, ${params.reason ?? null})
    RETURNING id
  `;

  await db`
    INSERT INTO audit_log (guild_id, actor_id, action, payload)
    VALUES (${params.guildId}, ${params.userId}, 'vacation-request', ${JSON.stringify(params)})
  `;

  return `📝 Zahtjev poslan. ID: ${request.id}`;
}

export async function sickLeave(db: Db, params: {
  userId: string;
  guildId: string;
  start: string;
  end: string;
  workingDays: number;
  reason?: string;
}) {
  const [request] = await db`
    INSERT INTO vacation_requests (user_id, guild_id, start_date, end_date, working_days, reason, status)
    VALUES (${params.userId}, ${params.guildId}, ${params.start}, ${params.end}, ${params.workingDays}, ${params.reason ?? null}, 'approved')
    RETURNING id
  `;

  await db`
    UPDATE user_vacation_balance
    SET used_days = used_days + ${params.workingDays}
    WHERE user_id = ${params.userId}
  `;

  return `🤒 Bolovanje prijavljeno (ID: ${request.id}).`;
}

export async function vacationStatus(db: Db, params: { userId: string }) {
  const [balance] = await db`
    SELECT annual_allocation, carried_over, used_days
    FROM user_vacation_balance
    WHERE user_id = ${params.userId}
  `;

  if (!balance) {
    return 'ℹ️ Nema podataka o godišnjem odmoru.';
  }

  const remaining = balance.annual_allocation + balance.carried_over - balance.used_days;
  return `🏖️ Godišnji: ${balance.used_days}/${balance.annual_allocation} korišteno. Preostalo: ${remaining} dana.`;
}

export async function approveVacation(db: Db, params: { requestId: string; role: 'pm' | 'admin'; actorId: string }) {
  const column = params.role === 'pm' ? 'pm_id' : 'admin_id';
  const statusUpdate = params.role === 'pm' ? 'pm_approved' : 'approved';

  const updated = await db`
    UPDATE vacation_requests
    SET status = ${statusUpdate}, ${column} = ${params.actorId}, ${params.role}_decision_at = NOW()
    WHERE id = ${params.requestId}
    RETURNING *
  `;

  if (updated.length === 0) {
    return '⚠️ Zahtjev nije pronađen.';
  }

  if (params.role === 'admin') {
    await db`
      UPDATE user_vacation_balance
      SET used_days = used_days + ${updated[0].working_days}
      WHERE user_id = ${updated[0].user_id}
    `;
  }

  return `✅ Zahtjev ${params.requestId} ažuriran.`;
}

export async function denyVacation(db: Db, params: { requestId: string; actorId: string; reason: string }) {
  const updated = await db`
    UPDATE vacation_requests
    SET status = 'denied', pm_id = ${params.actorId}, pm_decision_at = NOW(), reason = COALESCE(reason, '') || '\nDenied: ' || ${params.reason}
    WHERE id = ${params.requestId}
    RETURNING *
  `;

  if (updated.length === 0) {
    return '⚠️ Zahtjev nije pronađen.';
  }

  return `❌ Zahtjev ${params.requestId} odbijen.`;
}

export async function pendingRequests(db: Db, params: { guildId: string; limit?: number }) {
  const rows = await db`
    SELECT id, user_id, start_date, end_date, working_days, status
    FROM vacation_requests
    WHERE guild_id = ${params.guildId} AND status IN ('pending', 'pm_approved')
    ORDER BY created_at ASC
    LIMIT ${params.limit ?? 10}
  `;

  if (rows.length === 0) {
    return '🎉 Nema zahtjeva na čekanju.';
  }

  const lines = rows.map((row) => `• ${row.id} – ${row.user_id} (${row.start_date} → ${row.end_date}) status: ${row.status}`);
  return ['📬 Zahtjevi na čekanju:', ...lines].join('\n');
}
