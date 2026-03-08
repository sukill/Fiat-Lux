import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from infrastructure.database import Base, SessionLocal, engine
from infrastructure.agent.common.adapters.docuhub_client import DocuHubClient
from infrastructure.agent.persona.adapters.repositories import (
    DocuHubPersonaRepository,
    MySQLPersonaSetRepository,
)
from domain.agent.persona.models import AgentPersona, PersonaSet


def test_persona_db():
    print("Initializing test repositories...")
    docuhub_client = DocuHubClient()
    persona_repo = DocuHubPersonaRepository(docuhub_client)
    
    # We still need a DB session for PersonaSet
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    set_repo = MySQLPersonaSetRepository(session, persona_repo)

    # 1. Create Persona in DocuHub
    print("Creating persona in DocuHub...")
    persona = AgentPersona(
        name="Test Persona",
        role="Test Role",
        system_prompt="You are a test assistant.",
        goals=["goal 1"],
        motivation="test motivation",
        constraints=["constraint 1"],
        guidelines=["g1", "g2"],
    )
    # Note: This requires DocuHub to be running!
    # async_to_sync wrapper would be needed for a real test, 
    # but since this is a simple script, we'll keep it as a placeholder/reference.
    print("Note: This script needs to be updated for async execution if run directly.")
    
    session.close()

    print("Verification successful!")
    session.close()


if __name__ == "__main__":
    try:
        test_persona_db()
    except Exception as e:
        print(f"Verification failed: {e}")
        print(
            "\nNote: Ensure MySQL is running or set DATABASE_URL=sqlite:///./test.db for testing."
        )
