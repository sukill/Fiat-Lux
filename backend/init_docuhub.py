import asyncio
import httpx
import os
from dotenv import load_dotenv
from pathlib import Path

# Load env from backend/.env
env_path = Path(__file__).parent / "backend" / ".env"
load_dotenv(dotenv_path=env_path)

DOCUHUB_URL = os.getenv("DOCUHUB_BASE_URL", "http://localhost:8001")
USER_ID = "fiat-lux"

async def init_repos():
    repos = ["guideline-repo", "persona-repo"]
    async with httpx.AsyncClient() as client:
        for repo in repos:
            print(f"Initializing repository: {repo} at {DOCUHUB_URL}...")
            try:
                response = await client.post(
                    f"{DOCUHUB_URL}/repo/init",
                    params={"namespace": USER_ID, "repo_name": repo}
                )
                if response.status_code == 200:
                    print(f"Successfully initialized {repo}")
                else:
                    print(f"Failed to initialize {repo}: {response.text}")
            except Exception as e:
                print(f"Error connecting to DocuHub: {e}")

if __name__ == "__main__":
    asyncio.run(init_repos())
