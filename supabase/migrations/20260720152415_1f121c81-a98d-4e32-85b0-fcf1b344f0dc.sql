REVOKE ALL ON FUNCTION public.protect_profile_verified_flag() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_profile_verified_flag() FROM anon;
REVOKE ALL ON FUNCTION public.protect_profile_verified_flag() FROM authenticated;