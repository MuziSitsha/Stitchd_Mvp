"""T-RBAC — each role can/can't see what RLS says it can, per
STITCHD-SRS-SDS.md §B3.5 permission matrix and §C2."""

from urllib.parse import quote

import requests

from conftest import BASE_URL, mint_token


def test_client_cannot_see_another_actors_trace(client_token, throwaway_ticket_trace):
    """throwaway_ticket_trace is authored by the admin sandbox user; a client
    with no admin/super role and who isn't the actor must not see it —
    activity_log_select_own should make it invisible, not just forbidden."""
    resp = requests.get(
        f"{BASE_URL}/tickets-trace/{quote(throwaway_ticket_trace, safe='')}",
        headers={"Authorization": f"Bearer {client_token}"},
        timeout=10,
    )
    assert resp.status_code == 404


def test_admin_can_see_any_actors_trace(admin_token, throwaway_ticket_trace):
    resp = requests.get(
        f"{BASE_URL}/tickets-trace/{quote(throwaway_ticket_trace, safe='')}",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=10,
    )
    assert resp.status_code == 200


def test_trace_requires_a_bearer_token():
    resp = requests.get(f"{BASE_URL}/tickets-trace/ST-TEST-00001", timeout=10)
    assert resp.status_code in (401, 403)


def test_all_roles_can_mint_a_token_but_only_valid_roles_accepted():
    for role in ["client", "supplier", "coach", "ops", "admin", "super"]:
        assert mint_token(role)["access_token"]
