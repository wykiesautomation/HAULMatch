BEGIN;

CREATE OR REPLACE FUNCTION public.get_existing_unlock(p_request_reference text)
RETURNS TABLE (
  unlock_reference text,
  request_reference text,
  customer_name text,
  customer_email text,
  customer_mobile text,
  collection_area text,
  delivery_area text,
  credits_remaining integer,
  already_unlocked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, neon_auth
AS $$
DECLARE
  v_auth_subject text;
  v_transporter_id uuid;
BEGIN
  v_auth_subject := auth.uid()::text;
  IF v_auth_subject IS NULL OR v_auth_subject = '' THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT t.id
    INTO v_transporter_id
  FROM public.transporters AS t
  WHERE t.auth_subject = v_auth_subject
    AND t.status = 'APPROVED'
  LIMIT 1;

  IF v_transporter_id IS NULL THEN
    RAISE EXCEPTION 'Approved transporter account required';
  END IF;

  RETURN QUERY
  SELECT
    u.unlock_reference::text,
    r.reference::text,
    r.name::text,
    r.email::text,
    r.mobile::text,
    r.collection_area::text,
    r.delivery_area::text,
    COALESCE(w.balance,0)::integer,
    TRUE
  FROM public.lead_unlocks AS u
  JOIN public.transport_requests AS r ON r.id = u.request_id
  JOIN public.wallets AS w ON w.transporter_id = u.transporter_id
  WHERE u.transporter_id = v_transporter_id
    AND upper(r.reference) = upper(trim(p_request_reference))
    AND u.status = 'UNLOCKED'
  ORDER BY u.created_at DESC
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_existing_unlock(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_existing_unlock(text) TO authenticated;

COMMIT;

-- Verification only. Run while signed in through the website, not in SQL Editor:
-- select * from public.get_existing_unlock('HMREQ-20260920-C40KCS');
