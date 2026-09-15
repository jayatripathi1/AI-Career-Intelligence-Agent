import time
import hashlib
import hmac
import secrets
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from fastapi import FastAPI, Header, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from .db import fetch_recent, persist
from .graph import run_analysis
from .models import (
    AnalysisResponse,
    AnalyzeRequest,
    AuthResponse,
    HealthResponse,
    LoginRequest,
    RegisterRequest,
)

app = FastAPI(title="CareerPilot API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

history: list[AnalysisResponse] = []
users: dict[str, dict[str, str]] = {}
sessions: dict[str, str] = {}


def _password_hash(password: str, salt: Optional[bytes] = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return f"{salt.hex()}:{digest.hex()}"


def _password_matches(password: str, stored: str) -> bool:
    salt_hex, digest_hex = stored.split(":", 1)
    candidate = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), bytes.fromhex(salt_hex), 120_000
    )
    return hmac.compare_digest(candidate.hex(), digest_hex)


def _create_session(user: dict[str, str]) -> AuthResponse:
    token = secrets.token_urlsafe(32)
    sessions[token] = user["email"]
    return AuthResponse(token=token, user={"name": user["name"], "email": user["email"]})


def _require_user(authorization: Optional[str]) -> dict[str, str]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    email = sessions.get(authorization.removeprefix("Bearer ").strip())
    if not email or email not in users:
        raise HTTPException(status_code=401, detail="Session expired")
    return users[email]


@app.post("/api/auth/register", response_model=AuthResponse, status_code=201)
def register(request: RegisterRequest) -> AuthResponse:
    email = request.email.strip().lower()
    if email in users:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = {"name": request.name.strip(), "email": email, "password_hash": _password_hash(request.password)}
    users[email] = user
    return _create_session(user)


@app.post("/api/auth/login", response_model=AuthResponse)
def login(request: LoginRequest) -> AuthResponse:
    email = request.email.strip().lower()
    user = users.get(email)
    if not user or not _password_matches(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return _create_session(user)


@app.get("/api/auth/me", response_model=AuthResponse)
def current_user(authorization: Optional[str] = Header(default=None)) -> AuthResponse:
    user = _require_user(authorization)
    return AuthResponse(token="", user={"name": user["name"], "email": user["email"]})


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        database="postgresql" if fetch_recent() is not None else "in-memory (set DATABASE_URL for PostgreSQL)",
        agent="ready",
    )


@app.post("/api/analyze", response_model=AnalysisResponse)
def analyze(
    request: AnalyzeRequest, authorization: Optional[str] = Header(default=None)
) -> AnalysisResponse:
    _require_user(authorization)
    started = time.perf_counter()
    result = run_analysis(request.resume, request.job_description, request.target_role)
    response = AnalysisResponse(
        id=str(uuid4()),
        target_role=request.target_role,
        created_at=datetime.now(timezone.utc),
        processing_ms=round((time.perf_counter() - started) * 1000),
        **result,
    )
    history.insert(0, response)
    persist(response.model_dump())
    return response


@app.post("/api/resume/upload")
async def upload_resume(
    resume_file: UploadFile = File(...),
    authorization: Optional[str] = Header(default=None),
) -> dict[str, str]:
    _require_user(authorization)

    filename = (resume_file.filename or "").lower()
    if not filename.endswith((".pdf", ".txt")):
        raise HTTPException(status_code=400, detail="Upload a PDF or TXT resume")

    contents = await resume_file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="The uploaded resume is empty")
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Resume must be smaller than 5 MB")

    if filename.endswith(".txt"):
        text = contents.decode("utf-8", errors="replace").strip()
    else:
        try:
            from pypdf import PdfReader
            from io import BytesIO

            reader = PdfReader(BytesIO(contents))
            text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
        except Exception as error:
            raise HTTPException(status_code=400, detail="Unable to read this PDF resume") from error

    if len(text) < 40:
        raise HTTPException(status_code=400, detail="Could not extract enough text from this resume")
    return {"text": text}


@app.get("/api/analyses", response_model=list[AnalysisResponse])
def list_analyses() -> list[AnalysisResponse]:
    stored = fetch_recent()
    return [AnalysisResponse(**item) for item in stored] if stored is not None else history[:10]
