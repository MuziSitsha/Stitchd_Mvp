import base64
import json
import os

import psycopg2
import pytest
import requests

BASE_URL = os.environ.get("STITCHD_API_BASE_URL", "http://127.0.0.1:54321/functions/v1")
DB_DSN = os.environ.get("STITCHD_TEST_DB_DSN")  # postgres connection string, fixtures only


def mint_token(role: str) -> dict:
    """Calls /auth-test-token for the given role. Returns the parsed JSON body."""
    resp = requests.post(f"{BASE_URL}/auth-test-token", json={"role": role}, timeout=10)
    resp.raise_for_status()
    return resp.json()


def decode_jwt_claims(token: str) -> dict:
    payload_b64 = token.split(".")[1]
    padded = payload_b64 + "=" * (-len(payload_b64) % 4)
    return json.loads(base64.urlsafe_b64decode(padded))


@pytest.fixture
def admin_token() -> str:
    return mint_token("admin")["access_token"]


@pytest.fixture
def client_token() -> str:
    return mint_token("client")["access_token"]


@pytest.fixture
def db_conn():
    """Direct Postgres connection for fixture setup only — never used to test
    the API itself, only to create throwaway data for the API to read back.
    Requires STITCHD_TEST_DB_DSN (not needed for tests that don't use this fixture)."""
    if not DB_DSN:
        pytest.skip("STITCHD_TEST_DB_DSN not set — skipping DB-fixture-dependent test")
    conn = psycopg2.connect(DB_DSN)
    yield conn
    conn.close()


@pytest.fixture
def throwaway_ticket_trace(db_conn):
    """Generates a real ST-TEST-##### ref via next_ref() and writes two
    activity_log rows simulating a state transition, exactly what a real
    entity's own trigger will do from Phase 3 onward once Order/Lead/etc.
    exist. Yields the ref; cleans up afterward.

    Inserted directly rather than through a real table+trigger because no
    ST-*-producing entity exists yet in Phase 1 — this tests the /trace read
    path in isolation from that dependency, honestly, rather than faking it
    through role_assignments (whose audit ref is role_assignments:<uuid>,
    which /trace correctly rejects — it's for ST-* tickets specifically)."""
    admin = mint_token("admin")
    actor_id = admin["user_id"]

    with db_conn.cursor() as cur:
        cur.execute("select next_ref('TEST')")
        (ref,) = cur.fetchone()
        cur.execute(
            "insert into public.activity_log "
            "(ref, entity_type, actor_id, actor_role, from_state, to_state, event) "
            "values (%s, 'test', %s, 'admin', null, 'created', 'test.created')",
            (ref, actor_id),
        )
        cur.execute(
            "insert into public.activity_log "
            "(ref, entity_type, actor_id, actor_role, from_state, to_state, event) "
            "values (%s, 'test', %s, 'admin', 'created', 'done', 'test.updated')",
            (ref, actor_id),
        )
        db_conn.commit()

    yield ref

    with db_conn.cursor() as cur:
        cur.execute("delete from public.activity_log where ref = %s", (ref,))
        db_conn.commit()
