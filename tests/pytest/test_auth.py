"""T-AUTH — sandbox test-token minting, per STITCHD-SRS-SDS.md §C2."""

import pytest
import requests

from conftest import BASE_URL, decode_jwt_claims, mint_token

ROLES = ["client", "supplier", "coach", "ops", "admin", "super"]


@pytest.mark.parametrize("role", ROLES)
def test_mint_token_for_each_role(role):
    body = mint_token(role)
    assert body["role"] == role
    assert body["access_token"]

    claims = decode_jwt_claims(body["access_token"])
    assert claims["user_role"] == role
    assert claims["role"] == "authenticated"  # PostgREST's own role claim must stay untouched


def test_mint_token_rejects_invalid_role():
    resp = requests.post(f"{BASE_URL}/auth-test-token", json={"role": "not-a-role"}, timeout=10)
    assert resp.status_code == 400


def test_mint_token_is_idempotent():
    first = mint_token("supplier")
    second = mint_token("supplier")
    assert first["user_id"] == second["user_id"]
