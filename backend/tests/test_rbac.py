import pytest
from fastapi.testclient import TestClient

from k3guard import api, db, rbac

# Aksi yang mengubah data/hardware (reindex, start kamera, ubah ambang) hanya diuji ditolak untuk mahasiswa.
STUDENT_DENIED_ONLY = [("post", "/api/sop/reindex"), ("post", "/api/monitoring/stream/1/start"),
                       ("put", "/api/settings/thresholds")]
OFFICER_ONLY = [("get", "/api/chat/unanswered"), ("post", "/api/areas"), ("get", "/api/settings/thresholds"),
                ("delete", "/api/sop/999999"),
                ("get", "/api/events"), ("get", "/api/events/999999"),
                ("patch", "/api/events/999999/verify"), ("patch", "/api/events/999999/note"), ("get", "/api/stats"),
                ("get", "/storage/x.jpg")]


def _token(client, user):
    return client.post("/api/auth/login", json={"username": user, "password": "123"}).json()["access_token"]


@pytest.fixture(scope="module")
def client():
    db.init()
    return TestClient(api.app)


@pytest.mark.parametrize("method,path", OFFICER_ONLY)
def test_student_forbidden_officer_not(client, method, path):
    s = {"Authorization": "Bearer " + _token(client, "mahasiswa")}
    o = {"Authorization": "Bearer " + _token(client, "petugask3")}
    assert client.request(method.upper(), path, headers=s, json={}).status_code == 403
    assert client.request(method.upper(), path, headers=o, json={}).status_code != 403
    assert client.request(method.upper(), path, json={}).status_code == 401


def test_permissions_in_me_and_student_subset(client):
    h = {"Authorization": "Bearer " + _token(client, "mahasiswa")}
    assert set(client.get("/api/auth/me", headers=h).json()["permissions"]) == rbac.STUDENT
    assert rbac.STUDENT < rbac.OFFICER


@pytest.mark.parametrize("method,path", STUDENT_DENIED_ONLY)
def test_student_denied_on_mutating_actions(client, method, path):
    s = {"Authorization": "Bearer " + _token(client, "mahasiswa")}
    assert client.request(method.upper(), path, headers=s, json={}).status_code == 403
    assert client.request(method.upper(), path, json={}).status_code == 401
