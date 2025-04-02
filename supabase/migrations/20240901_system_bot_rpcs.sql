
-- Create RPC function to get system bots
CREATE OR REPLACE FUNCTION public.get_system_bots()
RETURNS SETOF public.system_bots
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.system_bots
  ORDER BY created_at DESC;
$$;

-- Create RPC function to create a system bot
CREATE OR REPLACE FUNCTION public.create_system_bot(
  p_name TEXT,
  p_description TEXT,
  p_type TEXT,
  p_is_active BOOLEAN,
  p_prompt_template TEXT,
  p_schedule TEXT
)
RETURNS SETOF public.system_bots
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bot_id INTEGER;
BEGIN
  INSERT INTO public.system_bots (
    name,
    description,
    type,
    is_active,
    prompt_template,
    schedule,
    created_by
  )
  VALUES (
    p_name,
    p_description,
    p_type,
    p_is_active,
    p_prompt_template,
    p_schedule,
    auth.uid()
  )
  RETURNING id INTO v_bot_id;
  
  RETURN QUERY SELECT * FROM public.system_bots WHERE id = v_bot_id;
END;
$$;

-- Create RPC function to delete a system bot
CREATE OR REPLACE FUNCTION public.delete_system_bot(p_bot_id INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.system_bots WHERE id = p_bot_id;
END;
$$;

-- Create RPC function to update a bot's status
CREATE OR REPLACE FUNCTION public.update_bot_status(p_bot_id INTEGER, p_is_active BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.system_bots
  SET is_active = p_is_active
  WHERE id = p_bot_id;
END;
$$;

-- Create RPC function to manually run a bot
CREATE OR REPLACE FUNCTION public.run_bot_manually(p_bot_id INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.system_bots
  SET last_run = NOW()
  WHERE id = p_bot_id;
  
  -- In a real implementation, this would trigger the bot execution
  -- via a webhook or background job
END;
$$;
