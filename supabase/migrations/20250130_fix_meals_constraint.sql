
-- Remove duplicate meals keeping the one with the highest ID (latest)
DELETE FROM meals a USING meals b
WHERE a.id < b.id
AND a.user_id = b.user_id
AND a.date = b.date
AND a.month_id = b.month_id;

-- Add unique constraint
ALTER TABLE meals
ADD CONSTRAINT meals_user_id_date_month_id_key UNIQUE (user_id, date, month_id);
