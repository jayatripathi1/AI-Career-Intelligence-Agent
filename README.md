# CareerPilot

AI-powered career intelligence assistant for understanding resume fit against job descriptions.

## Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Python, FastAPI
- **Agent:** LangGraph-compatible multi-step analysis pipeline
- **Persistence:** PostgreSQL via SQLAlchemy (with an in-memory fallback for local demos)

## Run locally

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL` if the API is not running on `http://localhost:8000`.
