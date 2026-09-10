"""Career analysis graph.

The graph deliberately keeps each reasoning stage small and observable. If
LangGraph is installed, StateGraph is used; the pure-Python runner remains a
safe fallback for lightweight local development.
"""

from typing import TypedDict

try:
    from langgraph.graph import END, START, StateGraph
except ImportError:  # Allows the pure-Python runner to work before dependencies are installed.
    StateGraph = None
    START = END = None


class CareerState(TypedDict, total=False):
    resume: str
    job_description: str
    target_role: str
    profile: dict
    match: dict
    recommendations: list[str]
    interview_questions: list[str]
    result: dict


def extract_profile(state: CareerState) -> CareerState:
    resume = state["resume"]
    sections = {
        "skills": _find_terms(resume, [
            "python", "javascript", "typescript", "react", "fastapi", "sql",
            "postgresql", "aws", "azure", "docker", "kubernetes", "langchain",
            "leadership", "analytics", "product", "machine learning",
        ]),
        "signals": _find_signals(resume),
    }
    return {**state, "profile": sections}


def retrieve_and_match(state: CareerState) -> CareerState:
    # Lightweight lexical retrieval keeps the demo deterministic. In
    # production, this node maps to embeddings -> pgvector -> retriever.
    resume = state["resume"].lower()
    job = state["job_description"].lower()
    job_terms = _find_terms(job, _CAREER_TERMS)
    matched = [term for term in job_terms if term in resume]
    missing = [term for term in job_terms if term not in resume]
    score = min(98, max(32, round((len(matched) / max(len(job_terms), 1)) * 100)))
    return {
        **state,
        "match": {
            "score": score,
            "matched": matched[:8],
            "missing": missing[:8],
            "job_terms": job_terms,
        },
    }


def generate_recommendations(state: CareerState) -> CareerState:
    missing = state["match"]["missing"]
    role = state["target_role"]
    recs = [
        f"Lead with a 2-line impact summary tailored to {role}.",
        "Move quantified outcomes into the first bullet of each relevant experience.",
        "Mirror the job description's language naturally in your skills and project bullets.",
    ]
    if missing:
        recs.insert(1, f"Build evidence for {', '.join(missing[:3])} through a focused project or course.")
    questions = [
        f"Walk me through the project most relevant to this {role} role.",
        "Tell me about a time you improved a measurable business or engineering outcome.",
        "Which requirement in this role would you ramp up on first, and how?",
    ]
    return {**state, "recommendations": recs, "interview_questions": questions}


def synthesize(state: CareerState) -> CareerState:
    score = state["match"]["score"]
    matched = state["match"]["matched"]
    missing = state["match"]["missing"]
    summary = (
        f"Your profile is a {score}% match for {state['target_role']}. "
        f"You already show strong evidence across {', '.join(matched[:3]) or 'core experience'}. "
        f"Prioritize closing the top gaps before applying."
    )
    return {
        **state,
        "result": {
            "score": score,
            "summary": summary,
            "strengths": [f"Evidence of {term} in your experience" for term in matched[:5]],
            "gaps": [f"Add clearer proof of {term}" for term in missing[:5]],
            "recommendations": state["recommendations"],
            "interview_questions": state["interview_questions"],
            "keywords": state["match"]["job_terms"][:10],
        },
    }


def run_analysis(resume: str, job_description: str, target_role: str) -> dict:
    state: CareerState = {
        "resume": resume,
        "job_description": job_description,
        "target_role": target_role,
    }
    if StateGraph is not None:
        graph = StateGraph(CareerState)
        graph.add_node("extract_profile", extract_profile)
        graph.add_node("retrieve_and_match", retrieve_and_match)
        graph.add_node("generate_recommendations", generate_recommendations)
        graph.add_node("synthesize", synthesize)
        graph.add_edge(START, "extract_profile")
        graph.add_edge("extract_profile", "retrieve_and_match")
        graph.add_edge("retrieve_and_match", "generate_recommendations")
        graph.add_edge("generate_recommendations", "synthesize")
        graph.add_edge("synthesize", END)
        return graph.compile().invoke(state)["result"]
    for node in (extract_profile, retrieve_and_match, generate_recommendations, synthesize):
        state = node(state)
    return state["result"]


def _find_terms(text: str, terms: list[str]) -> list[str]:
    lowered = text.lower()
    return [term for term in terms if term in lowered]


def _find_signals(text: str) -> list[str]:
    return [line.strip() for line in text.splitlines() if any(char.isdigit() for char in line)][:4]


_CAREER_TERMS = [
    "python", "javascript", "typescript", "react", "fastapi", "sql",
    "postgresql", "aws", "azure", "docker", "kubernetes", "langgraph",
    "langchain", "api", "analytics", "leadership", "machine learning",
    "stakeholder", "agile", "communication",
]
