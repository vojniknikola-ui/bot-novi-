import {
  InteractionResponseType,
  InteractionType,
  type APIApplicationCommandInteraction,
  type APIChatInputApplicationCommandInteractionData,
  type APIInteraction
} from 'discord-api-types/v10';
import { verifyKey } from 'discord-interactions';
import { ensureUser, getDb, type Db, type Env } from './database';
import { clockIn, clockOut, endBreak, fetchTimeLog, markOff, startBreak } from './services/time-tracking';
import { approveVacation, denyVacation, pendingRequests, requestVacation, sickLeave, vacationStatus } from './services/vacation';
import { runReport } from './services/reporting';
import {
  addVacationDays,
  getServerSettings,
  removeVacationDays,
  setVacationAllocation,
  updateServerSettings
} from './services/admin';
import { guildStatus, scheduleView } from './services/status';

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Vacation Tracker Bot', { status: 200 });
    }

    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    const body = await request.text();

    if (!signature || !timestamp) {
      return new Response('Missing signature', { status: 401 });
    }

    const isValid = await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
    if (!isValid) {
      return new Response('Bad signature', { status: 401 });
    }

    const interaction = JSON.parse(body) as APIInteraction;

    if (interaction.type === InteractionType.Ping) {
      return Response.json({ type: InteractionResponseType.Pong });
    }

    if (interaction.type !== InteractionType.ApplicationCommand) {
      return new Response('Unsupported interaction type', { status: 400 });
    }

    const response = await handleApplicationCommand(interaction, env);
    return Response.json({ type: InteractionResponseType.ChannelMessageWithSource, data: { content: response } });
  }
} satisfies ExportedHandler<Env>;

async function handleApplicationCommand(interaction: APIApplicationCommandInteraction, env: Env) {
  const db = getDb(env);
  const guildId = interaction.guild_id ?? 'dm';
  const userId = interaction.member?.user?.id ?? interaction.user?.id ?? 'unknown';
  const username = interaction.member?.user?.username ?? interaction.user?.username ?? 'unknown';

  await ensureUser(db, userId, guildId, username);

  const data = interaction.data as APIChatInputApplicationCommandInteractionData;
  const name = data.name;
  const options = Object.fromEntries((data.options ?? []).map((opt) => [opt.name, 'value' in opt ? opt.value : undefined]));

  switch (name) {
    case 'clock-in':
      return await clockIn(db, { userId, guildId, location: options.location as string | undefined });
    case 'clock-out':
      return await clockOut(db, { userId, guildId });
    case 'pauza-start':
      return await startBreak(db, { userId });
    case 'pauza-end':
      return await endBreak(db, { userId });
    case 'off':
      return await markOff(db, { userId });
    case 'wfh':
      return await clockIn(db, { userId, guildId, location: 'home' });
    case 'wfo':
      return await clockIn(db, { userId, guildId, location: 'office' });
    case 'time-log':
      return await fetchTimeLog(db, { userId, guildId, days: Number(options.days ?? 7) });
    case 'vacation-request':
      return await requestVacation(db, {
        userId,
        guildId,
        start: String(options.start),
        end: String(options.end),
        workingDays: Number(options.working_days),
        reason: options.reason as string | undefined
      });
    case 'sick-leave':
      return await sickLeave(db, {
        userId,
        guildId,
        start: String(options.start),
        end: String(options.end),
        workingDays: Number(options.working_days),
        reason: options.reason as string | undefined
      });
    case 'vacation-status':
      return await vacationStatus(db, { userId });
    case 'pm-pending':
      return await pendingRequests(db, { guildId });
    case 'pm-approve':
      return await approveVacation(db, { requestId: String(options.request_id), role: 'pm', actorId: userId });
    case 'pm-deny':
      return await denyVacation(db, { requestId: String(options.request_id), actorId: userId, reason: String(options.reason) });
    case 'admin-approve':
      return await approveVacation(db, { requestId: String(options.request_id), role: 'admin', actorId: userId });
    case 'admin-set-balance': {
      const targetId = String(options.user);
      await ensureTargetUser(db, interaction, targetId, guildId);
      const days = Number(options.days ?? 0);
      if (!Number.isFinite(days) || days <= 0) {
        return '⚠️ Unesite pozitivan broj dana.';
      }
      return await setVacationAllocation(db, {
        guildId,
        targetUserId: targetId,
        days,
        actorId: userId
      });
    }
    case 'admin-add-days': {
      const targetId = String(options.user);
      await ensureTargetUser(db, interaction, targetId, guildId);
      const days = Number(options.days ?? 0);
      if (!Number.isFinite(days) || days <= 0) {
        return '⚠️ Unesite pozitivan broj dana.';
      }
      return await addVacationDays(db, {
        guildId,
        targetUserId: targetId,
        days,
        actorId: userId
      });
    }
    case 'admin-remove-days': {
      const targetId = String(options.user);
      await ensureTargetUser(db, interaction, targetId, guildId);
      const days = Number(options.days ?? 0);
      if (!Number.isFinite(days) || days <= 0) {
        return '⚠️ Unesite pozitivan broj dana.';
      }
      return await removeVacationDays(db, {
        guildId,
        targetUserId: targetId,
        days,
        actorId: userId
      });
    }
    case 'settings': {
      const hasUpdates = Boolean(
        options.timezone || options.workday_start || options.workday_end || options.admin_role || options.pm_role
      );
      if (!hasUpdates) {
        return await getServerSettings(db, guildId);
      }

      return await updateServerSettings(db, {
        guildId,
        timezone: options.timezone as string | undefined,
        workdayStart: options.workday_start as string | undefined,
        workdayEnd: options.workday_end as string | undefined,
        adminRoleId: options.admin_role as string | undefined,
        pmRoleId: options.pm_role as string | undefined
      });
    }
    case 'status':
      return await guildStatus(db, {
        guildId,
        type: (options.type as 'online' | 'on-break' | 'on-vacation' | 'team-overview') ?? 'team-overview'
      });
    case 'schedule':
      return await scheduleView(db, {
        guildId,
        type: (options.type as 'today' | 'week' | 'vacation-calendar') ?? 'today'
      });
    case 'report':
      return await runReport(db, { guildId, type: String(options.type) });
    default:
      return `Command ${name} not implemented yet.`;
  }
}

async function ensureTargetUser(
  db: Db,
  interaction: APIApplicationCommandInteraction,
  targetUserId: string,
  guildId: string
) {
  const resolvedUsers = (interaction.data as APIChatInputApplicationCommandInteractionData).resolved?.users;
  const username = resolvedUsers?.[targetUserId]?.username ?? 'unknown';
  await ensureUser(db, targetUserId, guildId, username);
}
