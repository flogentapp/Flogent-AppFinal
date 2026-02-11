-- Migration to allow high-precision decimal hours in time logs
ALTER TABLE public.time_entries 
ALTER COLUMN hours TYPE NUMERIC(12,4);

-- Update minutes to also be numeric just in case
ALTER TABLE public.time_entries
ALTER COLUMN minutes TYPE NUMERIC(12,4);
