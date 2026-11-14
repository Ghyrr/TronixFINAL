/*
# Admin setup check

1. Plain-English summary
Adds a small check the sign-in page uses to know whether the first super admin account still needs to be created. It only returns true or false and reveals no account details.

2. New functions
- `admins_exist()`: returns true when at least one admin account exists.

3. Security changes
- Callable by visitors and signed-in users; it exposes no personal data.

4. Important notes
- No tables are changed.
*/

CREATE OR REPLACE FUNCTION public.admins_exist()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admins);
$$;

REVOKE EXECUTE ON FUNCTION public.admins_exist() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admins_exist() TO anon, authenticated;
