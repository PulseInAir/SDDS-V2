# SDDS Rollback and Incident Response Runbook

**Version:** 1.0  
**Effective date:** 2026-06-20  
**Applies to:** Vercel (frontend), Supabase (database, auth, storage)

---

## 1. Vercel: Instant Rollback

Vercel retains every deployment. Rollback is instantaneous with zero data risk.

### When to roll back
- Route returns 500 or blank page in production
- Auth redirect loop that blocks the owner
- Build deploys successfully but visible regression is observed

### How to roll back
1. Open the Vercel dashboard → Project → **Deployments** tab.
2. Locate the last known good deployment (look for the green "Ready" badge).
3. Click the three-dot menu → **Promote to Production**.
4. The promotion completes in under 30 seconds.
5. Verify the production URL loads the dashboard and the login flow works.

### After rollback
- Create a Git branch from the last good commit.
- Isolate the regression in that branch before merging again.
- Never rewrite published history.

---

## 2. Supabase: Migration Rollback

Schema rollback is destructive when rows exist. Apply with caution.

### Principle
Every SDDS migration is forward-only in production. Rollback means:

1. Run a compensating migration that undoes the forward migration.
2. Never delete accepted committed migrations from the `supabase/migrations` directory.

### Migration rollback procedure
```bash
# On local machine only — confirm the compensating SQL first
npx supabase db diff --schema public

# Apply compensating migration
npx supabase migration new compensate_<migration_name>
# Write the compensating SQL in the new migration file
npx supabase db push
```

### RLS / policy rollback
If an RLS policy is dropped or weakened by accident:

1. Immediately identify the affected table from Supabase dashboard → Table Editor → Policies.
2. Restore the policy by running the original `CREATE POLICY` statement via Supabase SQL editor.
3. Test that data is no longer accessible without a valid session.

---

## 3. Supabase: Auth Lockout Recovery

If the owner account is locked out:

1. Open the Supabase dashboard → Authentication → Users.
2. Locate the owner email and use **Send password reset**.
3. If MFA is blocking recovery, open Authentication → Settings and temporarily disable MFA for recovery — then re-enable immediately after.
4. If the workspace membership row is missing, insert it via Supabase SQL Editor:

```sql
-- Replace values as appropriate
INSERT INTO workspace_members (workspace_id, user_id, role, active)
SELECT w.id, u.id, 'owner', true
FROM workspaces w, auth.users u
WHERE u.email = 'owner@example.com'
LIMIT 1;
```

---

## 4. Credential Encryption Key Loss

If `CREDENTIAL_ENCRYPTION_KEY` is lost or rotated incorrectly:

- Existing encrypted credential blobs cannot be decrypted with the wrong key.
- There is no recovery without the original key.
- **Prevention:** The key must be stored securely in a password manager outside the codebase.
- **If key is lost:** Affected clients must re-enter their portal credentials via the credential update flow. No data is lost except the encrypted blobs.

---

## 5. Document Storage Recovery

Documents are stored in Supabase private Storage.

- Supabase provides point-in-time recovery (PITR) on Pro and Team plans.
- For individual file recovery, use the Supabase Storage dashboard to browse buckets and restore from backup if PITR is configured.
- Do not expose permanent public URLs for documents — all access is via signed URLs through the authenticated API route.

---

## 6. Environment Variable Emergency Rotation

If `CREDENTIAL_ENCRYPTION_KEY` or Supabase keys are suspected to be compromised:

1. Rotate the key in Supabase dashboard → Settings → API.
2. Update the Vercel environment variables immediately via Vercel dashboard → Settings → Environment Variables.
3. Trigger a redeployment by clicking **Redeploy** on the latest deployment.
4. Update `.env.local` locally.
5. Update `.env.example` placeholders if the variable name changes.
6. Do not commit the actual key value. Commit only `.env.example` updates if required.

---

## 7. Vercel: Preview vs Production

| Environment | Trigger | Purpose |
|---|---|---|
| Preview | Every push to master (non-production branch) | Smoke test before production promote |
| Production | Explicit promote from Vercel dashboard | Live traffic |

For SDDS, `master` branch is the production branch. Vercel is configured to deploy `master` to production automatically. Preview deployments are generated for pull requests.

**To test on a preview URL before promoting:**
1. Note the preview URL from the Vercel dashboard after a push.
2. Navigate to `/login` and confirm the auth flow works.
3. Navigate to `/clients` and confirm data loads (requires correct Supabase env vars in preview environment).
4. Verify no console errors and no exposed secret values.

---

## 8. Smoke Test Checklist (Post-Deploy)

Run after every production deploy:

- [ ] `/login` loads and accepts credentials
- [ ] Dashboard loads with correct metrics
- [ ] Client list loads (pagination functional)
- [ ] Filing queue table view loads
- [ ] Document upload works (file appears in Supabase Storage)
- [ ] Invoice is visible and PDF export works
- [ ] Settings page loads and AY switcher works
- [ ] Privacy Mode toggle works
- [ ] Global search returns results
- [ ] Logout redirects to `/login`

---

## 9. Contact and Escalation

This is a private single-user system. All escalation goes to the owner directly.

- Vercel support: https://vercel.com/support
- Supabase support: https://supabase.com/support
- GitHub repository: https://github.com/PulseInAir/SDDS-V2
