from fastapi import APIRouter
from pydantic import BaseModel

from services.load_balancer import analyze_load


router = APIRouter(
    prefix="/load-balancing",
    tags=["Load Balancing"]
)


class Server(BaseModel):

    id: str
    cpu: float
    ram: float = 0.0
    traffic: float = 0.0
    type: str | None = None
    ram_source: str | None = None


class LoadBalancingRequest(BaseModel):

    servers: list[Server]


@router.post("/analyze")
def analyze_load_balancing(
    request: LoadBalancingRequest
):

    servers = [
        server.model_dump()
        for server in request.servers
    ]

    return analyze_load(servers)