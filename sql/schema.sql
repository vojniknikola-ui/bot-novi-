CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    username TEXT NOT NULL,
    discriminator TEXT,
    locale TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_vacation_balance (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    annual_allocation INTEGER NOT NULL DEFAULT 20,
    carried_over INTEGER NOT NULL DEFAULT 0,
    used_days INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    guild_id TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    location TEXT,
    source TEXT NOT NULL DEFAULT 'clock-in',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS active_sessions (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    guild_id TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    location TEXT NOT NULL DEFAULT 'office',
    on_break BOOLEAN NOT NULL DEFAULT FALSE,
    break_started_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'working'
);

CREATE TABLE IF NOT EXISTS vacation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    guild_id TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    working_days INTEGER NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    pm_id TEXT,
    admin_id TEXT,
    pm_decision_at TIMESTAMPTZ,
    admin_decision_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS server_settings (
    guild_id TEXT PRIMARY KEY,
    timezone TEXT NOT NULL DEFAULT 'Europe/Sarajevo',
    workday_start TIME NOT NULL DEFAULT '09:00',
    workday_end TIME NOT NULL DEFAULT '17:00',
    admin_role_id TEXT,
    pm_role_id TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
