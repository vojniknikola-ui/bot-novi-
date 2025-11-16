import type { Db } from '../database';

async function ensureBalanceRow(db: Db, userId: string) {
  await db`
    INSERT INTO user_vacation_balance (user_id)
    VALUES (${userId})
    ON CONFLICT (user_id) DO NOTHING
  `;
}

export async function setVacationAllocation(
  db: Db,
  params: { guildId: string; targetUserId: string; days: number; actorId: string }
) {
  await ensureBalanceRow(db, params.targetUserId);

  const [row] = await db`
    UPDATE user_vacation_balance
    SET annual_allocation = ${params.days}, updated_at = NOW()
    WHERE user_id = ${params.targetUserId}
    RETURNING annual_allocation, carried_over, used_days
  `;

  await db`
    INSERT INTO audit_log (guild_id, actor_id, action, payload)
    VALUES (${params.guildId}, ${params.actorId}, 'admin-set-balance', ${JSON.stringify(params)})
  `;

  const remaining = row.annual_allocation + row.carried_over - row.used_days;
  return `✅ Postavljeno na ${row.annual_allocation} dana. Preostalo: ${remaining}`;
}

export async function addVacationDays(
  db: Db,
  params: { guildId: string; targetUserId: string; days: number; actorId: string }
) {
  await ensureBalanceRow(db, params.targetUserId);

  const [row] = await db`
    UPDATE user_vacation_balance
    SET annual_allocation = annual_allocation + ${params.days}, updated_at = NOW()
    WHERE user_id = ${params.targetUserId}
    RETURNING annual_allocation
  `;

  await db`
    INSERT INTO audit_log (guild_id, actor_id, action, payload)
    VALUES (${params.guildId}, ${params.actorId}, 'admin-add-days', ${JSON.stringify(params)})
  `;

  return `➕ Dodano ${params.days} dana. Nova kvota: ${row.annual_allocation}`;
}

export async function removeVacationDays(
  db: Db,
  params: { guildId: string; targetUserId: string; days: number; actorId: string }
) {
  await ensureBalanceRow(db, params.targetUserId);

  const [row] = await db`
    UPDATE user_vacation_balance
    SET annual_allocation = GREATEST(used_days, annual_allocation - ${params.days}), updated_at = NOW()
    WHERE user_id = ${params.targetUserId}
    RETURNING annual_allocation, used_days
  `;

  await db`
    INSERT INTO audit_log (guild_id, actor_id, action, payload)
    VALUES (${params.guildId}, ${params.actorId}, 'admin-remove-days', ${JSON.stringify(params)})
  `;

  const remaining = row.annual_allocation - row.used_days;
  return `➖ Oduzeto ${params.days} dana. Preostalo: ${Math.max(remaining, 0)}`;
}

export async function getServerSettings(db: Db, guildId: string) {
  const [settings] = await db`
    SELECT timezone, workday_start, workday_end, admin_role_id, pm_role_id
    FROM server_settings
    WHERE guild_id = ${guildId}
  `;

  if (!settings) {
    return '⚙️ Nema konfiguracije – koristi se podrazumijevano (09-17h, Europe/Sarajevo).';
  }

  return formatSettings(settings);
}

export async function updateServerSettings(
  db: Db,
  params: {
    guildId: string;
    timezone?: string;
    workdayStart?: string;
    workdayEnd?: string;
    adminRoleId?: string;
    pmRoleId?: string;
  }
) {
  await db`
    INSERT INTO server_settings (guild_id)
    VALUES (${params.guildId})
    ON CONFLICT (guild_id) DO NOTHING
  `;

  const [settings] = await db`
    UPDATE server_settings
    SET timezone = COALESCE(${params.timezone}, timezone),
        workday_start = COALESCE(${params.workdayStart}, workday_start),
        workday_end = COALESCE(${params.workdayEnd}, workday_end),
        admin_role_id = COALESCE(${params.adminRoleId}, admin_role_id),
        pm_role_id = COALESCE(${params.pmRoleId}, pm_role_id),
        updated_at = NOW()
    WHERE guild_id = ${params.guildId}
    RETURNING timezone, workday_start, workday_end, admin_role_id, pm_role_id
  `;

  return formatSettings(settings);
}

function formatSettings(settings: {
  timezone: string;
  workday_start: string;
  workday_end: string;
  admin_role_id: string | null;
  pm_role_id: string | null;
}) {
  const adminRole = settings.admin_role_id ? `<@&${settings.admin_role_id}>` : 'nije postavljeno';
  const pmRole = settings.pm_role_id ? `<@&${settings.pm_role_id}>` : 'nije postavljeno';

  return [
    '⚙️ Server postavke:',
    `• Timezone: ${settings.timezone}`,
    `• Radni dan: ${settings.workday_start} – ${settings.workday_end}`,
    `• Admin role: ${adminRole}`,
    `• PM role: ${pmRole}`
  ].join('\n');
}
