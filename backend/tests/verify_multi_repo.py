import asyncio
import os
import sys
from uuid import uuid4

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from infrastructure.database import Base, SessionLocal, engine
from infrastructure.agent.common.adapters.docuhub_client import DocuHubClient
from infrastructure.agent.persona.adapters.repositories import (
    DocuHubPersonaRepository,
    MySQLPersonaSetRepository,
)
from domain.agent.persona.models import AgentPersona, PersonaSet
from domain.agent.persona.use_cases import PersonaService

async def verify_multi_repo():
    print("Initializing verification...")
    docuhub_client = DocuHubClient()
    persona_repo = DocuHubPersonaRepository(docuhub_client)
    
    # We still need a DB session for PersonaSet
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    set_repo = MySQLPersonaSetRepository(session, persona_repo)
    service = PersonaService(persona_repo, set_repo)

    print("1. Creating Persona Set with multi-repo item references...")
    # Mocking items that might exist in different repos
    item1 = {"id": str(uuid4()), "repository": "repo-a", "branch": "main"}
    item2 = {"id": str(uuid4()), "repository": "repo-b", "branch": "develop"}
    
    try:
        # Note: This won't actually fetch from DocuHub unless those IDs exist,
        # but we can test the SAVE logic which stores the references.
        persona_set = await service.create_persona_set(
            name="Multi-Repo Test Set",
            description="Testing cross-repo aggregation",
            items=[item1, item2]
        )
        print(f"Set created with ID: {persona_set.id}")
        
        # 2. Verify DB storage
        from infrastructure.agent.persona.persistence_models import PersonaSetORM
        orm_set = session.query(PersonaSetORM).filter_by(id=str(persona_set.id)).first()
        print(f"Stored persona_ids JSON: {orm_set.persona_ids}")
        
        assert len(orm_set.persona_ids) == 2
        assert orm_set.persona_ids[0]["repository"] == "repo-a"
        assert orm_set.persona_ids[1]["repository"] == "repo-b"
        assert orm_set.persona_ids[1]["branch"] == "develop"
        
        print("Verification of storage successful!")

    except Exception as e:
        print(f"Verification failed: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    asyncio.run(verify_multi_repo())
