ALTER TABLE users
ADD COLUMN IF NOT EXISTS two_factor_last_management_timecode INTEGER;
