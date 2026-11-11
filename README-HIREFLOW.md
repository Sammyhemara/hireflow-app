# HireFlow

Standalone, Australia-first recruitment platform prototype for employers, agencies and jobseekers.

## Milestone 1

- React + TypeScript + Vite dashboard foundation
- Employer, agency and jobseeker workspace switching
- Responsive layout, fictional metrics and searchable example jobs
- No authentication, database, messaging, or production deployment yet

## Run locally

```bash
npm install
npm run dev
```

Run `npm run build` before deployment.

## Isolation

This repository is separate from all existing projects. Do not reuse existing Supabase or Vercel production credentials. The `.env.example` contains no secrets.

## Next

Add Supabase development project, authentication, organisation memberships, RLS policies, job posting and screening. Keep development changes on the `development` branch and review before merging to `main`.
