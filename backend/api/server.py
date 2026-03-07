from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.agent.routes import workflow, persona, guideline
from dotenv import load_dotenv

# Load .env file (looked up from backend/ as root or current file location)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


app = FastAPI(
    title="Fiat-Lux Unified API",
    description="비개발자를 위한 Cursor(Agentic Workflow) 시스템 통합 API",
    version="1.0.0",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 단계에서는 모든 origin 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 도메인별 라우터 등록
app.include_router(workflow.router)
app.include_router(persona.router)
app.include_router(guideline.router)


@app.get("/")
async def root():
    return {"message": "Welcome to Fiat-Lux Unified API"}
