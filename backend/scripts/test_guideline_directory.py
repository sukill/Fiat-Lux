import asyncio
import os
import sys
from uuid import UUID, uuid4

# Add backend to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))

from domain.agent.guideline.models import Guideline
from infrastructure.agent.common.adapters.docuhub_client import DocuHubClient
from infrastructure.agent.guideline.adapters.repositories import DocuHubGuidelineRepository

async def verify_directory_support():
    client = DocuHubClient()
    repo = DocuHubGuidelineRepository(client)
    
    # 1. Create a guideline with a nested directory
    directory = "test/nested/dir"
    title = f"Test Guideline {uuid4().hex[:6]}"
    content = "This is a test content for nested directory support."
    
    guideline = Guideline(title=title, content=content, directory=directory)
    print(f"--- Step 1: Saving guideline with directory '{directory}' ---")
    await repo.save(guideline)
    print(f"Saved guideline ID: {guideline.id}")
    
    # 2. List all and verify it's there
    print("\n--- Step 2: Listing all guidelines to verify recursive search ---")
    all_guidelines = await repo.list_all()
    found = False
    for g in all_guidelines:
        if g.id == guideline.id:
            print(f"Found guideline in list! ID: {g.id}, Title: {g.title}, Directory: {g.directory}")
            assert g.directory == directory
            found = True
            break
    
    if not found:
        print("Error: Guideline not found in recursive list!")
        return

    # 3. Find by ID
    print("\n--- Step 3: Finding by ID ---")
    fetched = await repo.find_by_id(guideline.id)
    if fetched:
        print(f"Successfully fetched by ID: {fetched.id}, Directory: {fetched.directory}")
    else:
        print("Error: Failed to fetch by ID!")

    # 4. Update directory
    new_directory = "test/updated/dir"
    print(f"\n--- Step 4: Updating directory to '{new_directory}' ---")
    fetched.directory = new_directory
    await repo.save(fetched)
    
    print("\n--- Step 5: Verifying move and deletion of old path ---")
    all_guidelines_after = await repo.list_all()
    count = 0
    for g in all_guidelines_after:
        if g.id == guideline.id:
            print(f"Found guideline after move. Directory: {g.directory}")
            count += 1
    
    assert count == 1, f"Expected 1 guideline, found {count}. Old file might not have been deleted."
    print("Verification SUCCESS: Old file deleted and new file created correctly.")

if __name__ == "__main__":
    asyncio.run(verify_directory_support())
