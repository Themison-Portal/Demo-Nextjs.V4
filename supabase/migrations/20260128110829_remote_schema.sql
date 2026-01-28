drop extension if exists "pg_net";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_org_admin(org_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.organization_members
    WHERE user_id = auth.uid()
    AND org_id = org_id_param
    AND org_role IN ('superadmin', 'admin')
    AND status = 'active'
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_org_superadmin(org_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.organization_members
    WHERE user_id = auth.uid()
    AND org_id = org_id_param
    AND org_role = 'superadmin'
    AND status = 'active'
  );
END;
$function$
;


