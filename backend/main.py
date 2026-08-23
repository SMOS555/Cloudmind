import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq

from services.cloud_metrics import get_cloud_metrics


# ==========================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY is missing. "
        "Make sure the GROQ_API_KEY environment variable is set."
    )


# ==========================================
# GROQ CLIENT
# ==========================================

client = Groq(api_key=GROQ_API_KEY)


# ==========================================
# FASTAPI APP
# ==========================================

app = FastAPI(
    title="CloudMind AI API",
    description="AI-powered cloud management platform",
    version="1.0.0"
)


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "https://cloudmind-backend.onrender.com/api/chat",
        "http://localhost:5173",
    ],

    allow_credentials=False,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ==========================================
# REQUEST MODEL
# ==========================================

class ChatRequest(BaseModel):
    message: str


# ==========================================
# ROOT
# ==========================================

@app.get("/")
def root():
    return {
        "message": "CloudMind AI backend is running"
    }


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "ai": "connected"
    }


# ==========================================
# CLOUD METRICS
# ==========================================

@app.get("/api/metrics")
def metrics():
    return get_cloud_metrics()


# ==========================================
# AI CHAT
# ==========================================

@app.post("/api/chat")
def chat(request: ChatRequest):

    if not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )

    system_prompt = """
You are CloudMind AI, an expert cloud computing
and cloud infrastructure assistant.

You are part of an advanced AI-powered cloud
management platform.

Your expertise includes:

- Cloud computing
- AWS
- Microsoft Azure
- Google Cloud
- Cloud architecture
- Virtual machines
- Containers
- Kubernetes
- Load balancing
- Auto scaling
- Cloud security
- IAM
- Encryption
- Network security
- Cloud cost optimization
- Energy-efficient computing
- Cloud monitoring
- DevOps
- Serverless computing
- Databases
- Cloud networking
- Disaster recovery
- High availability
- Performance optimization
- Cloud migration
- Multi-cloud architecture
- AI/ML infrastructure

Answer the user's question clearly and accurately.

If the question is technical:
explain the concept first and then give an example.

If the question involves choosing between cloud
providers, compare relevant factors such as cost,
performance, security, scalability and workload.

If the user asks about the CloudMind project,
explain how the concept can be implemented in
this project.

Do not pretend that simulated project data is
real cloud infrastructure.

Keep answers useful for a college student building
an advanced cloud management project.

Use headings and bullet points when they improve
clarity.
"""

    try:

        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",

            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": request.message
                }
            ],

            temperature=0.4,
            max_completion_tokens=1200
        )

        answer = completion.choices[0].message.content

        return {
            "success": True,
            "answer": answer
        }

    except Exception as e:

        print("AI ERROR:", str(e))

        raise HTTPException(
            status_code=500,
            detail="AI service failed."
        )