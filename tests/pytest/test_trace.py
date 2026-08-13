"""T-TRACE — /tickets-trace/:ref returns contiguous state history, per
STITCHD-SRS-SDS.md §A4.11/§C2."""

from urllib.parse import quote

import requests

from conftest import BASE_URL


def test_trace_rejects_malformed_ref(admin_token):
    resp = requests.get(
        f"{BASE_URL}/tickets-trace/not-a-valid-ref",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=10,
    )
    assert resp.status_code == 400


def test_trace_404s_for_unknown_ref(admin_token):
    resp = requests.get(
        f"{BASE_URL}/tickets-trace/ST-NOPE-99999",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=10,
    )
    assert resp.status_code == 404


def test_trace_returns_contiguous_history(admin_token, throwaway_ticket_trace):
    ref = throwaway_ticket_trace
    resp = requests.get(
        f"{BASE_URL}/tickets-trace/{quote(ref, safe='')}",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=10,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["ref"] == ref
    states = [(row["from_state"], row["to_state"]) for row in body["trace"]]
    assert states == [(None, "created"), ("created", "done")]
