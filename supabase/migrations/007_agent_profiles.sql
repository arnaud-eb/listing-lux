-- Phase 5: Agent profiles (session-linked, no auth)

CREATE TABLE IF NOT EXISTS agent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID,
  user_id UUID,
  full_name TEXT NOT NULL DEFAULT '',
  agency_name TEXT,
  phone TEXT,
  email TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  agency_address TEXT,
  agency_website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT has_owner CHECK (session_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_profiles_session_id ON agent_profiles(session_id);

-- Storage bucket for agent logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-logos', 'agent-logos', true)
ON CONFLICT (id) DO NOTHING;
