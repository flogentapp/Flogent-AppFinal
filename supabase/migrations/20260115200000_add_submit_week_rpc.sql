-- RPC: Submit Week
-- Submits all 'draft' or 'rejected' entries for a user in a given week

CREATE OR REPLACE FUNCTION submit_week(p_user_id UUID, p_date DATE)
RETURNS VOID AS $$
DECLARE
    v_week_start DATE;
    v_week_end DATE;
BEGIN
    -- Calculate week start (Monday) and end (Sunday)
    v_week_start := date_trunc('week', p_date);
    v_week_end := v_week_start + INTERVAL '6 days';

    UPDATE time_entries
    SET status = 'submitted'
    WHERE user_id = p_user_id
    AND entry_date >= v_week_start
    AND entry_date <= v_week_end
    AND status IN ('draft', 'rejected');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
