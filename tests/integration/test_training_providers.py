"""
Integration tests for /training/* endpoints.
Covers: provider CRUD, course CRUD, course recommendations + RBAC.
"""
import uuid
import pytest

pytestmark = pytest.mark.integration


def _provider_payload(**overrides):
    base = {
        "name": f"RTO {uuid.uuid4().hex[:6]}",
        "contact_email": "rto@test.com",
        "website_url": "https://rto.com",
        "country": "Australia",
    }
    base.update(overrides)
    return base


def _course_payload(provider_id, **overrides):
    base = {
        "provider_id": str(provider_id),
        "title": "Electrical Safety",
        "description": "Core electrical safety training",
        "trade_category": "electrical",
        "delivery_mode": "online",
    }
    base.update(overrides)
    return base


# ══════════════════════════════════════════════════════════════════════════════
# PROVIDER CRUD
# ══════════════════════════════════════════════════════════════════════════════

async def test_create_provider_as_training_provider_returns_201(client, training_provider_user):
    r = await client.post("/training/provider", json=_provider_payload(),
                          headers=training_provider_user["headers"])
    assert r.status_code == 201


async def test_create_provider_as_candidate_returns_403(client, candidate_user):
    r = await client.post("/training/provider", json=_provider_payload(),
                          headers=candidate_user["headers"])
    assert r.status_code == 403


async def test_list_providers_public_returns_200(client, training_provider_obj):
    r = await client.get("/training/provider")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


async def test_get_single_provider_public_returns_200(client, training_provider_obj):
    r = await client.get(f"/training/provider/{training_provider_obj.id}")
    assert r.status_code == 200
    assert r.json()["id"] == str(training_provider_obj.id)


async def test_get_nonexistent_provider_returns_404(client):
    r = await client.get(f"/training/provider/{uuid.uuid4()}")
    assert r.status_code == 404


async def test_update_provider_as_training_provider_returns_200(
    client, training_provider_user, training_provider_obj
):
    r = await client.put(
        f"/training/provider/{training_provider_obj.id}",
        json={"name": "Updated RTO Name"},
        headers=training_provider_user["headers"],
    )
    assert r.status_code == 200


async def test_update_provider_as_admin_returns_200(
    client, admin_user, training_provider_obj
):
    r = await client.put(
        f"/training/provider/{training_provider_obj.id}",
        json={"country": "New Zealand"},
        headers=admin_user["headers"],
    )
    assert r.status_code == 200


async def test_delete_provider_as_admin_returns_200(
    client, admin_user, training_provider_obj
):
    r = await client.delete(
        f"/training/provider/{training_provider_obj.id}",
        headers=admin_user["headers"],
    )
    assert r.status_code in (200, 204)


async def test_delete_provider_as_candidate_returns_403(
    client, candidate_user, training_provider_obj
):
    r = await client.delete(
        f"/training/provider/{training_provider_obj.id}",
        headers=candidate_user["headers"],
    )
    assert r.status_code == 403


# ══════════════════════════════════════════════════════════════════════════════
# COURSE CRUD
# ══════════════════════════════════════════════════════════════════════════════

async def test_create_course_as_training_provider_returns_201(
    client, training_provider_user, training_provider_obj
):
    r = await client.post(
        f"/training/provider/{training_provider_obj.id}/courses",
        json=_course_payload(training_provider_obj.id),
        headers=training_provider_user["headers"],
    )
    assert r.status_code == 201


async def test_list_courses_public_returns_200(client, training_course):
    r = await client.get("/training/courses")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


async def test_get_single_course_returns_200(client, training_course):
    r = await client.get(f"/training/courses/{training_course.id}")
    assert r.status_code == 200


async def test_update_course_as_training_provider_returns_200(
    client, training_provider_user, training_course
):
    r = await client.put(
        f"/training/courses/{training_course.id}",
        json={"title": "Updated Course Title"},
        headers=training_provider_user["headers"],
    )
    assert r.status_code == 200


async def test_delete_course_as_admin_returns_200(client, admin_user, training_course):
    r = await client.delete(f"/training/courses/{training_course.id}",
                            headers=admin_user["headers"])
    assert r.status_code in (200, 204)


# ══════════════════════════════════════════════════════════════════════════════
# RECOMMENDATIONS
# ══════════════════════════════════════════════════════════════════════════════

async def test_recommend_course_as_admin_returns_201(
    client, admin_user, candidate_profile, training_course
):
    r = await client.post(
        f"/training/recommend/{candidate_profile.id}/{training_course.id}",
        headers=admin_user["headers"],
    )
    assert r.status_code == 201


async def test_get_candidate_course_recommendations_returns_list(
    client, admin_user, candidate_profile, training_course
):
    await client.post(
        f"/training/recommend/{candidate_profile.id}/{training_course.id}",
        headers=admin_user["headers"],
    )
    r = await client.get(
        f"/training/recommend/{candidate_profile.id}",
        headers=admin_user["headers"],
    )
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert len(r.json()) >= 1


async def test_delete_recommendation_returns_200(
    client, admin_user, candidate_profile, training_course
):
    create_r = await client.post(
        f"/training/recommend/{candidate_profile.id}/{training_course.id}",
        headers=admin_user["headers"],
    )
    rec_id = create_r.json()["id"]
    r = await client.delete(f"/training/recommend/{rec_id}", headers=admin_user["headers"])
    assert r.status_code in (200, 204)
