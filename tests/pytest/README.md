# STITCHD API test suite

Black-box tests against the `/functions/v1/*` API — matches
`STITCHD-SRS-SDS.md` §15/§C2's test catalogue (`T-AUTH`, `T-RBAC`, `T-TRACE`,
...), grown phase by phase alongside `openapi/openapi.yaml`.

```
pip install -r requirements.txt

# against a local `supabase start` stack (default):
pytest

# against a hosted project, or with a different local port:
STITCHD_API_BASE_URL=https://<project>.supabase.co/functions/v1 pytest

# a few fixtures (e.g. throwaway_ticket_trace) need direct DB access purely
# to set up throwaway test data — they're skipped automatically if unset:
STITCHD_TEST_DB_DSN="postgresql://postgres:<password>@<host>:<port>/postgres" pytest
```

Requires `SANDBOX_TEST_TOKENS=on` on whatever backend `STITCHD_API_BASE_URL`
points at — these tests mint their own auth via `/auth-test-token`, no OTP
needed.
