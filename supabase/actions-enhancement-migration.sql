-- Migration to add notes and time tracking fields to actions table
ALTER TABLE public.actions
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS estimated_time INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS actual_time INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS time_generated BOOLEAN DEFAULT FALSE;

-- Migration to add notes and time tracking fields to milestone_actions table
ALTER TABLE public.milestone_actions
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS estimated_time INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS actual_time INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS time_generated BOOLEAN DEFAULT FALSE;
