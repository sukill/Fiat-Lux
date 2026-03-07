import os
import sys
from fastapi.testclient import TestClient
from api.server import app

# src 디렉토리를 path에 추가
src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../src"))
sys.path.append(src_path)


client = TestClient(app)


def test_full_persona_guideline_workflow():
    print("Starting full persona-guideline-workflow integration test...")

    # 1. 페르소나 생성
    persona_data = {
        "name": "Test Python Dev",
        "role": "Python Developer",
        "system_prompt": "You are an expert Python developer.",
        "guidelines": ["Use PEP8", "Write clean code"],
    }
    response = client.post("/personas/", json=persona_data)
    assert response.status_code == 200
    persona = response.json()
    persona_id = persona["id"]
    print(f"Persona created with ID: {persona_id}")

    # 2. 가이드라인 생성
    guideline_data = {
        "title": "TDD Guideline",
        "content": "Always write tests before code.",
    }
    response = client.post("/guidelines/", json=guideline_data)
    assert response.status_code == 200
    guideline = response.json()
    guideline_id = guideline["id"]
    print(f"Guideline created with ID: {guideline_id}")

    # 3. 페르소나 세트 생성
    persona_set_data = {
        "name": "Dev Team",
        "description": "Our development team personas",
        "persona_ids": [persona_id],
    }
    response = client.post("/personas/sets", json=persona_set_data)
    assert response.status_code == 200
    persona_set = response.json()
    persona_set_id = persona_set["id"]
    print(f"PersonaSet created with ID: {persona_set_id}")

    # 4. 가이드라인 세트 생성
    guideline_set_data = {
        "name": "Standard Guidelines",
        "description": "Mandatory guidelines for all tasks",
        "guideline_ids": [guideline_id],
    }
    response = client.post("/guidelines/sets", json=guideline_set_data)
    assert response.status_code == 200
    guideline_set = response.json()
    guideline_set_id = guideline_set["id"]
    print(f"GuidelineSet created with ID: {guideline_set_id}")

    # 5. 워크플로우 실행
    workflow_data = {
        "user_request": "Create a new API endpoint",
        "persona_set_id": persona_set_id,
        "guideline_set_id": guideline_set_id,
    }
    response = client.post("/workflow/", json=workflow_data)
    assert response.status_code == 200
    result = response.json()
    run = result["run"]

    # 검증: 페르소나가 세트에서 선택되었는지, 가이드라인이 추가되었는지
    assert run["selected_personas"][0]["persona"]["role"] == "Python Developer"
    # 기존 가이드라인 2개 + 세트에서 추가된 가이드라인 1개 = 총 3개
    assert len(run["selected_personas"][0]["persona"]["guidelines"]) == 3
    assert "Always write tests before code." in run["selected_personas"][0]["persona"]["guidelines"]
    assert run["user_request"] == "Create a new API endpoint"
    print("Full workflow integration test: SUCCESS")


if __name__ == "__main__":
    try:
        test_full_persona_guideline_workflow()
        print("\nAll integration tests passed!")
    except Exception as e:
        print(f"\nTest Failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
