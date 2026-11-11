# HireFlow competitive product roadmap

Goal: deliver a measurably faster, clearer and safer recruitment workflow for employers, agencies and jobseekers. Compete on workflow outcomes rather than claiming exclusive features.

## Phase 1 — Candidate foundation (implemented; further validation needed)
- Reusable candidate profile: work history, qualifications, licences, availability, professional summary
- Private resume/credential uploads (PDF/JPEG/PNG, max 10 MB), temporary signed URLs, owner-only access
- Explicit unverified status for self-uploaded documents; no candidate self-verification
- Per-application immutable question/answer snapshot for new applications; legacy data labelled as reconstructed
- Screening categories separated from recruiter decisions; hiring decision updates restricted to review_status
- Acceptance: profile persistence; upload/view/delete; own-account and cross-account RLS tests; document ownership; inaccessible direct object paths

## Phase 2 — Trusted credential workflow
- Candidate-controlled sharing of specific documents with authorised hiring organisations for active applications
- Verification requests and independent reviewer/admin workflow; record reviewer, evidence, timestamp, expiry, audit trail
- Distinguish unverified, pending, verified, rejected, expired; never imply an uploaded document was independently verified
- Expiry reminders, revoke sharing, consent history and access logs
- Acceptance: deny unrelated employers; revoke access; verification audit and expiry tests

## Phase 3 — Recruitment operations
- Unified employer/agency candidate profile and application detail
- Interview pipeline: applied, reviewing, shortlisted, interview, offer, hired, declined
- In-app messaging, notifications, interview scheduling and candidate status transparency
- Agency-client permissions and explicit candidate submission consent
- Acceptance: role-based workflow end-to-end, notification delivery and accessibility

## Phase 4 — Differentiation
- Explainable skills/requirements matching with human decisions and bias monitoring
- Assisted ad writing, interview preparation, recruiter summaries and duplicate application detection
- Analytics: time-to-first-response, time-to-hire, candidate drop-off, completion rate
- Accessibility, mobile experience, performance and transparent pricing

## Guardrails
- No automatic rejection solely by algorithm; humans own decisions
- Avoid sensitive inferences, opaque scoring and unsupported credential claims
- Private documents by default, least privilege, short-lived signed links
- Development branch and HireFlow Development only; production release requires explicit approval
