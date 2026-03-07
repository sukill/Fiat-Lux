import os
import sys
from fastapi.testclient import TestClient

# src 디렉토리를 path에 추가
src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(src_path)


try:
    from api.server import app
except Exception as e:
    print(f"Import Error: {e}")
    sys.exit(1)

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Fiat-Lux Unified API"}
    print("Test root: SUCCESS")


def test_workflow():
    payload = {"user_request": "Rosetta 가이드라인 알려줘"}
    response = client.post("/workflow/", json=payload)

    assert response.status_code == 200
    data = response.json()
    run = data["run"]
    assert run["user_request"] == payload["user_request"]
    # Based on our current mock/inferrer logic, it might not always return Business Analyst, 
    # but the structure should be correct.
    assert "selected_personas" in run
    print("Test workflow: SUCCESS")
    print(f"Response: {data}")


def test_options_persona():
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/personas/", headers=headers)
    print(f"OPTIONS /personas/ status: {response.status_code}")
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers
    print("Test options persona: SUCCESS")


if __name__ == "__main__":
    try:
        test_root()
        test_options_persona()
        test_workflow()
        print("\nAll API tests passed!")
    except Exception as e:
        print(f"\nTest Failed: {e}")
        sys.exit(1)
