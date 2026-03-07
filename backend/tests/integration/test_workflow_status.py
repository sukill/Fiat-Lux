from fastapi.testclient import TestClient
from api.server import app
import uuid

client = TestClient(app)

def test_workflow_status_endpoint():
    # 1. Start a workflow
    workflow_data = {
        "user_request": "Status test request",
        "persona_set_id": None,
        "guideline_set_id": None,
    }
    response = client.post("/workflow/", json=workflow_data)
    assert response.status_code == 200
    run_id = response.json()["run"]["id"]
    
    # 2. Check status immediately
    response = client.get(f"/workflow/{run_id}")
    assert response.status_code == 200
    result = response.json()["run"]
    assert result["id"] == run_id
    # According to our simulation, it should be COMPLETED
    assert result["status"] == "completed"

def test_workflow_not_found():
    random_id = uuid.uuid4()
    response = client.get(f"/workflow/{random_id}")
    assert response.status_code == 404
