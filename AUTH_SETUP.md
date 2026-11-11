# HireFlow authentication setup (development only)

## Isolation
Supabase project: HireFlow Development (`txtjvbbnztnlavaggnxt`), Sydney.
Never use Clubhouse project credentials. Only the Supabase publishable key belongs in browser environment variables. Never expose a secret or service-role key.

## Current implementation
- Email/password sign-up, sign-in and reset-password requests
- Account-type selection (employer, agency, jobseeker)
- Email verification expected (confirm in Supabase Auth settings)
- First-login profile and organisation provisioning
- Supabase RLS on profiles, organisations, organisation_members and jobseeker_profiles

## Before end-to-end testing
1. Configure Supabase Authentication > URL Configuration with the approved HireFlow preview URL as Site URL and an exact approved redirect allow-list.
2. Confirm email confirmations are enabled and an appropriate SMTP service is configured for external testers.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for **Preview** only on the isolated HireFlow Vercel project.
4. Ensure Vercel Git integration is linked to `Sammyhemara/hireflow-app`, with `main` as the production branch, before any additional deployment. Never treat `development` as a production release.
5. Verify `npm install && npm run build` and complete actual registration, email verification, login, logout, password reset, cross-account RLS tests and responsive browser checks.

## Limitations
- Dashboard navigation is still sample-data based.
- No invitations, jobs, applications, real messaging or document uploads yet.
- Organisation owner membership rows are not yet provisioned; ownership is enforced via `organisations.owner_id`.
- Role data in user metadata is only a sign-up preference, not an authorisation claim.
- No production deployment is authorised.

## Deployment verification update
The separate Vercel Git-linked project is `hireflow-preview` (production branch `main`). The direct API deploy incorrectly classified `development` as production and was canceled. Only an actual Preview-target deployment is acceptable. Verify deployment target and build before user testing.
