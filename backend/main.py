import os

from typing import Optional
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Query

from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
from services.analytics_service import get_advanced_analytics

from groq import Groq

from routes.provider import router as provider_router
from routes.security import router as security_router
from routes.cost import router as cost_router
from routes.energy import router as energy_router
from routes.load_balancing import router as load_balancing_router

from services.aws_services import (
    get_ec2_cpu_metrics,
)

from services.analytics_service import (
    get_advanced_analytics
)

from services.rag_service import (
    retrieve_cloud_knowledge,
    get_rag_knowledge_catalog
)

# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# ============================================================
# GROQ CLIENT (GRACEFUL LAZY INIT)
# ============================================================

client = None
if GROQ_API_KEY:
    try:
        client = Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        print("Warning: Could not initialize Groq client on startup:", e)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(

    title="CloudMind AI API",

    description=(
        "AI-powered cloud management "
        "and infrastructure monitoring platform"
    ),

    version="1.0.0"
)


# ============================================================
# PROVIDER ROUTES
# ============================================================

app.include_router(
    provider_router
)

app.include_router(
    cost_router
)

app.include_router(
    security_router
)

app.include_router(
    energy_router
)

app.include_router(
    load_balancing_router
)

# ============================================================
# CORS
# ============================================================

cors_origins_env = os.getenv("CORS_ORIGINS", "")
allowed_origins = [
    "https://cloudmind-frontend.onrender.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if cors_origins_env:
    allowed_origins.extend([o.strip() for o in cors_origins_env.split(",") if o.strip()])

allow_all_cors = os.getenv("ALLOW_ALL_CORS", "true").lower() in ("true", "1", "yes")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all_cors else allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST MODEL
# ============================================================

class ChatRequest(BaseModel):
    message: str
    use_rag: Optional[bool] = True
    use_cag: Optional[bool] = True
    region: Optional[str] = "ap-south-1"
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_session_token: Optional[str] = None


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {

        "message":
            "CloudMind AI backend is running",

        "status":
            "online",

        "version":
            "1.0.0",

    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {

        "status":
            "healthy",

        "ai":
            "connected",

    }


# ============================================================
# REAL AWS CLOUD METRICS
# ============================================================

class MetricsRequest(BaseModel):
    region: Optional[str] = "ap-south-1"
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_session_token: Optional[str] = None


def compute_cloud_metrics(
    region="ap-south-1",
    aws_access_key_id=None,
    aws_secret_access_key=None,
    aws_session_token=None
):

    try:

        # ----------------------------------------------------
        # GET REAL AWS DATA
        # ----------------------------------------------------

        aws_data = get_ec2_cpu_metrics(
            region=region or "ap-south-1",
            history_hours=7,
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            aws_session_token=aws_session_token
        )


        # ----------------------------------------------------
        # BASIC AWS INFORMATION
        # ----------------------------------------------------

        region = aws_data.get(
            "region",
            "ap-south-1"
        )

        total_instances = aws_data.get(
            "total_instances",
            0
        )

        running_instances = aws_data.get(
            "running_instances",
            0
        )

        cpu_usage = aws_data.get(
            "cpu_usage"
        )

        cpu_history = aws_data.get(
            "cpu_history",
            []
        )

        instances = aws_data.get(
            "instances",
            []
        )


        # ----------------------------------------------------
        # CLOUD HEALTH
        # ----------------------------------------------------

        if total_instances == 0:

            cloud_health = 100

        else:

            cloud_health = 100


            # No running instances
            if running_instances == 0:

                cloud_health -= 20


            # High CPU
            if (
                cpu_usage is not None
                and cpu_usage > 80
            ):

                cloud_health -= 15


            # Medium-high CPU
            elif (
                cpu_usage is not None
                and cpu_usage > 60
            ):

                cloud_health -= 5


            cloud_health = max(
                0,
                min(
                    100,
                    cloud_health
                )
            )


        # ----------------------------------------------------
        # SECURITY SCORE
        #
        # This is currently a PLACEHOLDER score.
        # Real security analysis will be implemented
        # in the Security Center.
        # ----------------------------------------------------

        if total_instances == 0:

            security_score = None

        else:

            security_score = 95


        # ----------------------------------------------------
        # ENERGY EFFICIENCY
        #
        # Estimated from CPU utilization.
        # This is NOT direct AWS energy telemetry.
        # ----------------------------------------------------

        if cpu_usage is None:

            energy_efficiency = None

        else:

            energy_efficiency = round(

                max(
                    0,
                    min(
                        100,
                        100 - (
                            cpu_usage * 0.25
                        )
                    )
                ),

                1
            )


        # ----------------------------------------------------
        # COMPUTE STATUS
        # ----------------------------------------------------

        if total_instances == 0:

            compute_status = "No Instances"

        elif running_instances == 0:

            compute_status = "Stopped"

        elif (
            cpu_usage is not None
            and cpu_usage > 80
        ):

            compute_status = "Warning"

        else:

            compute_status = "Healthy"


        # ----------------------------------------------------
        # CLOUDWATCH STATUS
        # ----------------------------------------------------

        if total_instances == 0:

            cloudwatch_status = (
                "No running EC2 instances"
            )

            data_status = (
                "No running EC2 instances are "
                "available for CloudWatch CPU monitoring."
            )

        elif cpu_usage is None:

            cloudwatch_status = (
                "Connected but no CPU datapoint"
            )

            data_status = (
                "EC2 instances were found, "
                "but CloudWatch has not returned "
                "a CPU datapoint yet."
            )

        else:

            cloudwatch_status = "Connected"

            data_status = (
                "Live EC2 CPU utilization "
                "retrieved from AWS CloudWatch."
            )


        # ----------------------------------------------------
        # FINAL RESPONSE
        # ----------------------------------------------------

        return {

            # =================================================
            # PROVIDER
            # =================================================

            "provider":
                "AWS",

            "region":
                region,


            # =================================================
            # HEALTH
            # =================================================

            "cloud_health":
                cloud_health,

            "security_score":
                security_score,

            "energy_efficiency":
                energy_efficiency,


            # =================================================
            # COST
            #
            # AWS Cost Explorer is not connected yet.
            # =================================================

            "monthly_cost":
                None,


            # =================================================
            # RESOURCE UTILIZATION
            # =================================================

            "cpu_usage":
                cpu_usage,

            "memory_usage":
                None,

            "network_usage":
                None,


            # =================================================
            # EC2 INFRASTRUCTURE
            # =================================================

            "total_instances":
                total_instances,

            "running_instances":
                running_instances,

            "servers":
                instances,


            # =================================================
            # CLOUD PROVIDERS
            #
            # Only AWS is connected currently.
            # =================================================

            "providers": {

                "aws":
                    100 if total_instances > 0 else 0,

                "azure":
                    0,

                "gcp":
                    0,

            },


            # =================================================
            # INFRASTRUCTURE STATUS
            # =================================================

            "infrastructure": {

                "compute":
                    compute_status,

                "database":
                    "Not Monitored",

                "network":
                    "Not Monitored",

                "security":
                    "Not Monitored",

            },


            # =================================================
            # CPU HISTORY
            # =================================================

            "history": {

                "cpu":
                    cpu_history,

                "memory":
                    [],

                "network":
                    [],

            },


            # =================================================
            # RAW AWS INSTANCE DATA
            # =================================================

            "aws": {

                "region":
                    region,

                "total_instances":
                    total_instances,

                "running_instances":
                    running_instances,

                "instances":
                    instances,

            },


            # =================================================
            # CLOUDWATCH INFORMATION
            # =================================================

            "cloudwatch_status":
                cloudwatch_status,

            "data_status":
                data_status,

        }


    except Exception as e:

        print(
            "CLOUD METRICS ERROR:",
            str(e)
        )


        raise HTTPException(

            status_code=503,

            detail=(
                "Unable to retrieve AWS "
                "infrastructure metrics."
            )

        )


@app.post("/api/metrics")
def metrics_post(payload: MetricsRequest):
    return compute_cloud_metrics(
        region=payload.region or "ap-south-1",
        aws_access_key_id=payload.aws_access_key_id,
        aws_secret_access_key=payload.aws_secret_access_key,
        aws_session_token=payload.aws_session_token
    )


@app.get("/api/metrics")
def metrics(
    region: Optional[str] = Query("ap-south-1"),
    aws_access_key_id: Optional[str] = None,
    aws_secret_access_key: Optional[str] = None,
    aws_session_token: Optional[str] = None
):
    return compute_cloud_metrics(
        region=region or "ap-south-1",
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
        aws_session_token=aws_session_token
    )


# ==========================================
# ADVANCED ANALYTICS
# ==========================================

@app.get("/api/analytics")
def analytics():

    try:

        return get_advanced_analytics()

    except Exception as e:

        print(
            "ANALYTICS ERROR:",
            str(e)
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "Unable to retrieve "
                "AWS analytics data."
            )
        )
# ============================================================
# HYBRID RAG + CAG AI CHAT
# ============================================================

@app.post("/api/chat")
def chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )

    # 1. CAG TIER: Live Cloud Telemetry Context Ingestion
    cag_telemetry = None
    cag_prompt_block = ""
    if request.use_cag:
        try:
            telemetry_data = get_ec2_cpu_metrics(
                region=request.region or "ap-south-1",
                history_hours=7,
                aws_access_key_id=request.aws_access_key_id,
                aws_secret_access_key=request.aws_secret_access_key,
                aws_session_token=request.aws_session_token
            )
            cag_telemetry = {
                "region": telemetry_data.get("region", request.region or "ap-south-1"),
                "total_instances": telemetry_data.get("total_instances", 0),
                "running_instances": telemetry_data.get("running_instances", 0),
                "cpu_usage": telemetry_data.get("cpu_usage"),
                "instances": [
                    {
                        "id": inst.get("id"),
                        "type": inst.get("type"),
                        "state": inst.get("state"),
                        "public_ip": inst.get("public_ip"),
                    }
                    for inst in telemetry_data.get("instances", [])[:5]
                ]
            }
            cag_prompt_block = f"""
### [CAG LIVE CLOUD TELEMETRY CACHE]
The user's live infrastructure state is currently active:
- Inspected AWS Region: {cag_telemetry['region']}
- Total EC2 Instances: {cag_telemetry['total_instances']} (Running: {cag_telemetry['running_instances']})
- CPU Utilization: {cag_telemetry['cpu_usage'] if cag_telemetry['cpu_usage'] is not None else 'No active CloudWatch data'}%
- Sample Instances in Fleet: {[i['id'] + ' (' + str(i['type']) + ', ' + str(i['state']) + ')' for i in cag_telemetry['instances']]}
Use this live infrastructure state when advising on the user's specific servers or fleet.
"""
        except Exception as cag_err:
            print("Notice: CAG telemetry cache skipped:", str(cag_err))
            cag_telemetry = {"status": "Fallback simulation", "region": request.region or "ap-south-1"}

    # 2. RAG TIER: Authoritative Cloud Knowledge Semantic Retrieval
    rag_sources = []
    rag_prompt_block = ""
    if request.use_rag:
        try:
            rag_sources = retrieve_cloud_knowledge(request.message, top_k=3)
            if rag_sources:
                rag_passages = []
                for s in rag_sources:
                    rag_passages.append(
                        f"--- [REFERENCE: {s['standard']} ({s['id']}) - Relevance: {s['relevance_percent']}%] ---\n"
                        f"{s['content']}"
                    )
                rag_prompt_block = f"""
### [RAG AUTHORITATIVE KNOWLEDGE BASE RETRIEVALS]
The following authoritative compliance standards, FinOps guides, and remediation runbooks were retrieved for this query:
{chr(10).join(rag_passages)}

GROUNDING RULES:
1. Ground your technical guidance in the retrieved reference documents above.
2. Explicitly cite the standard in your response using markdown bold, e.g. **[{rag_sources[0]['standard']} ({rag_sources[0]['id']})]**.
3. Include the exact copyable AWS CLI commands provided in the runbook where relevant.
"""
        except Exception as rag_err:
            print("Notice: RAG retrieval error:", str(rag_err))

    # 3. CONSTRUCT AUGMENTED SYSTEM PROMPT
    base_prompt = """You are CloudMind AI, an expert enterprise Cloud Governance, DevSecOps, FinOps, and GreenOps Assistant.
You represent the CloudMind AI Platform created by Safwaan Mohamed S (25BCE1188).
Your mission is to provide accurate, grounded, authoritative cloud engineering advice with zero hallucinations.

Style & Formatting:
- Use ## headings for major sections.
- Use bullet points for clear readability.
- When referencing standards or rules, cite the official CIS Benchmark or FinOps specification.
- Provide copyable AWS CLI code blocks for remediation procedures.
- Keep answers professional, precise, and practical for cloud engineers.
"""
    augmented_system_prompt = base_prompt + "\n" + cag_prompt_block + "\n" + rag_prompt_block

    # 4. EXECUTE MODEL INFERENCE VIA GROQ
    global client
    if client is None:
        key = os.getenv("GROQ_API_KEY")
        if not key:
            raise HTTPException(
                status_code=503,
                detail="AI service unavailable: GROQ_API_KEY is not configured on the server."
            )
        try:
            client = Groq(api_key=key)
        except Exception as init_err:
            raise HTTPException(
                status_code=500,
                detail=f"Could not initialize AI service: {str(init_err)}"
            )

    try:
        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content": augmented_system_prompt
                },
                {
                    "role": "user",
                    "content": request.message
                }
            ],
            temperature=0.3,
            max_completion_tokens=850
        )

        answer = completion.choices[0].message.content

        return {
            "success": True,
            "answer": answer,
            "rag_enabled": bool(request.use_rag),
            "cag_enabled": bool(request.use_cag),
            "rag_sources": rag_sources,
            "cag_telemetry": cag_telemetry,
        }

    except Exception as e:
        print("AI ERROR:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"AI service failed: {str(e)}"
        )


# ============================================================
# RAG KNOWLEDGE BASE CATALOG ENDPOINT
# ============================================================

@app.get("/api/rag/knowledge-base")
def get_knowledge_base_endpoint():
    """
    Returns full catalog of indexed CIS benchmarks, FinOps frameworks,
    and remediation runbooks for the UI Knowledge Base Inspector.
    """
    catalog = get_rag_knowledge_catalog()
    return {
        "success": True,
        "total_documents": len(catalog),
        "standards": [
            "CIS AWS Foundations Benchmark v3.0",
            "FinOps Foundation Framework",
            "Green Software Foundation Standard v2.1",
            "AWS Security Incident Response Guide"
        ],
        "catalog": catalog
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)