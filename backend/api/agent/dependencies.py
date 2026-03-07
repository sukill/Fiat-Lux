from infrastructure.agent.config import settings

from domain.agent.workflow.use_cases import AgentOrchestrator
from domain.agent.persona.use_cases import PersonaService
from domain.agent.guideline.use_cases import GuidelineService
from infrastructure.agent.intelligence.adapters.clients import (
    GeminiContextInferrer,
    OpenAIContextInferrer,
)
from fastapi import Depends
from infrastructure.database import SessionLocal, init_db
from infrastructure.agent.persona.adapters.repositories import (
    DocuHubPersonaRepository,
    MySQLPersonaRepository,
    MySQLPersonaSetRepository,
)
from infrastructure.agent.guideline.adapters.repositories import (
    DocuHubGuidelineRepository,
    InMemoryGuidelineRepository,
    InMemoryGuidelineSetRepository,
)
from infrastructure.agent.common.adapters.docuhub_client import DocuHubClient
from infrastructure.agent.persona.adapters.selectors import IntelligencePersonaSelector
from infrastructure.agent.workflow.adapters.repositories import (
    InMemoryWorkflowRunRepository,
)
from domain.agent.persona.ports.outputs import PersonaSelector

# Initialize database schema on startup
init_db()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# LLM Provider Factory
def create_inferrer():
    provider = settings.LLM_PROVIDER.lower()
    try:
        if provider == "gemini":
            api_key = settings.GOOGLE_API_KEY
            if not api_key:
                raise ValueError("GOOGLE_API_KEY not found in settings.")
            return GeminiContextInferrer(api_key=api_key, max_tokens=settings.LLM_MAX_TOKENS)
        elif provider == "openai":
            api_key = settings.OPENAI_API_KEY
            if not api_key:
                raise ValueError("OPENAI_API_KEY not found in settings.")
            return OpenAIContextInferrer(api_key=api_key, max_tokens=settings.LLM_MAX_TOKENS)
        else:
            raise ValueError(f"Unsupported or unconfigured LLM provider: {provider}")
    except ImportError as e:
        print(f"CRITICAL: Missing dependency for LLM provider '{provider}': {e}")
        print("Please run 'uv sync' to install missing packages.")
        raise
    except Exception as e:
        print(f"ERROR: Failed to initialize LLM provider '{provider}': {e}")
        raise


# DocuHub Integration
_docuhub_client = DocuHubClient()
_guideline_repo = DocuHubGuidelineRepository(_docuhub_client)
_persona_repo = DocuHubPersonaRepository(_docuhub_client)
_guideline_set_repo = InMemoryGuidelineSetRepository()

_run_repo = InMemoryWorkflowRunRepository()
_inferrer = create_inferrer()
_persona_selector = IntelligencePersonaSelector(_inferrer)


def get_persona_service(db: SessionLocal = Depends(get_db)) -> PersonaService:
    # Persona는 DocuHub를 기본으로 사용하고, PersonaSet은 아직 MySQL 병행 사용 고려 가능 (현재는 PersonaService에서 DocuHub 중심)
    return PersonaService(_persona_repo, MySQLPersonaSetRepository(db))


def get_guideline_service() -> GuidelineService:
    return GuidelineService(_guideline_repo, _guideline_set_repo)


def get_persona_selector() -> PersonaSelector:
    return _persona_selector


def get_orchestrator(db: SessionLocal = Depends(get_db)) -> AgentOrchestrator:
    # Use fresh session for MySQL repositories
    persona_set_repo = MySQLPersonaSetRepository(db)

    return AgentOrchestrator(
        _inferrer,
        _guideline_repo,
        _guideline_set_repo,
        persona_set_repo,
        _persona_selector,
        _run_repo,
    )
