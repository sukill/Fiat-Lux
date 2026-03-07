.PHONY: help install run-back run-front dev

# Variables
UV = uv
VITE = cd frontend && npm

help:
	@echo "Available commands:"
	@echo "  make install     - Install both backend and frontend dependencies using uv"
	@echo "  make run-back    - Run the Python FastAPI backend using uv run"
	@echo "  make run-front   - Run the Vite + React frontend"
	@echo "  make dev         - Run both concurrently"

install:
	@echo "Installing backend dependencies with uv..."
	cd backend && $(UV) sync
	@echo "Installing frontend dependencies..."
	$(VITE) install

run-back:
	@echo "Starting backend server with uv run..."
	cd backend && $(UV) run uvicorn api.server:app --reload --port 8000

run-front:
# ... rest of the file ...
	@echo "Starting frontend dev server..."
	$(VITE) run dev

dev:
	@echo "Starting both backend and frontend..."
	@make -j 2 run-back run-front
