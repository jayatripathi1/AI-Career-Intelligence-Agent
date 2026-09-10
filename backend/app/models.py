from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    resume: str = Field(min_length=40)
    job_description: str = Field(min_length=40)
    target_role: str = Field(default="Target role")


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=200)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=200)
    password: str = Field(min_length=8, max_length=128)


class AuthResponse(BaseModel):
    token: str
    user: dict[str, str]


class AnalysisResponse(BaseModel):
    id: str
    target_role: str
    score: int
    summary: str
    strengths: list[str]
    gaps: list[str]
    recommendations: list[str]
    interview_questions: list[str]
    keywords: list[str]
    created_at: datetime
    processing_ms: int


class HealthResponse(BaseModel):
    status: str
    database: str
    agent: str


AnalysisDict = dict[str, Any]
