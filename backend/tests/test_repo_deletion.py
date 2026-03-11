import httpx
import asyncio

async def test_repo_deletion():
    base_url = "http://localhost:8000"
    namespace = "fiat-lux-system"
    test_repo = "temp-test-repo"

    async with httpx.AsyncClient() as client:
        print(f"1. Initializing test repository: {test_repo}")
        resp = await client.post(f"{base_url}/storage/repository", json={"name": test_repo})
        print(f"   Response: {resp.json()}")
        
        print("2. Listing repositories...")
        resp = await client.get(f"{base_url}/storage/repositories")
        repos = [r["name"] for r in resp.json()]
        print(f"   Current repos: {repos}")
        assert test_repo in repos

        print(f"3. Deleting test repository: {test_repo}")
        resp = await client.request("DELETE", f"{base_url}/storage/repository", params={"name": test_repo})
        print(f"   Fiat-Lux Response: {resp.json()}")
        
        if not resp.json().get("success"):
            print("   Attempting direct DocuHub call for debugging...")
            docuhub_url = "http://localhost:8001" # Based on .env
            try:
                dh_resp = await client.delete(f"{docuhub_url}/repo/delete", params={"namespace": namespace, "repo_name": test_repo})
                print(f"   Direct DocuHub Response: {dh_resp.status_code} - {dh_resp.text}")
            except Exception as e:
                print(f"   Direct DocuHub Call Failed: {e}")
        
        assert resp.json()["success"] is True

        print("4. Verifying deletion...")
        resp = await client.get(f"{base_url}/storage/repositories")
        repos = [r["name"] for r in resp.json()]
        print(f"   Updated repos: {repos}")
        assert test_repo not in repos

        print("\nVerification SUCCESSFUL!")

if __name__ == "__main__":
    asyncio.run(test_repo_deletion())
