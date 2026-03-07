import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from infrastructure.database import Base, SessionLocal, engine
from infrastructure.agent.persona.adapters.repositories import (
    MySQLPersonaRepository,
    MySQLPersonaSetRepository,
)
from domain.agent.persona.models import AgentPersona, PersonaSet


def test_persona_db():
    print(
        "Initializing test database (SQLite for verification if MySQL is not available)..."
    )
    # For verification, we can override DB_URL to use SQLite
    # DATABASE_URL=sqlite:///./test.db

    Base.metadata.create_all(bind=engine)
    session = SessionLocal()

    persona_repo = MySQLPersonaRepository(session)
    set_repo = MySQLPersonaSetRepository(session)

    # 1. Create Persona
    print("Creating persona...")
    persona = AgentPersona(
        role="Test Role",
        system_prompt="You are a test assistant.",
        guidelines=["g1", "g2"],
    )
    persona_repo.save(persona)

    # 2. Find Persona
    print("Finding persona...")
    found_persona = persona_repo.find_by_id(persona.id)
    assert found_persona is not None
    assert found_persona.role == "Test Role"
    print(f"Found persona: {found_persona.role}")

    # 3. Create Persona Set
    print("Creating persona set...")
    p_set = PersonaSet(
        name="Test Set", description="A test set of personas", personas=[persona]
    )
    set_repo.save(p_set)

    # 4. Find Persona Set
    print("Finding persona set...")
    found_set = set_repo.find_by_id(p_set.id)
    assert found_set is not None
    assert len(found_set.personas) == 1
    assert found_set.personas[0].role == "Test Role"
    print(f"Found set: {found_set.name} with {len(found_set.personas)} personas")

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
