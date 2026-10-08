from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from services.energy_service import get_energy, simulate_architecture_savings, INSTANCE_CATALOG


router = APIRouter(
    prefix="/energy",
    tags=["Energy"]
)


class EnergyRequest(BaseModel):
    region: Optional[str] = "ap-south-1"
    hours: Optional[int] = 24
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_session_token: Optional[str] = None


@router.post("/aws")
def aws_energy_post(payload: EnergyRequest):
    try:
        hours = max(1, min(168, payload.hours or 24))
        return get_energy(
            region=payload.region or "ap-south-1",
            hours=hours,
            aws_access_key_id=payload.aws_access_key_id,
            aws_secret_access_key=payload.aws_secret_access_key,
            aws_session_token=payload.aws_session_token
        )
    except Exception as exc:
        print("AWS ENERGY ERROR:", str(exc))
        raise HTTPException(
            status_code=503,
            detail="Unable to calculate AWS energy efficiency."
        )


@router.get("/aws")
def aws_energy(
    region: str = Query("ap-south-1"),
    hours: int = Query(24),
    access_key_id: Optional[str] = None,
    secret_access_key: Optional[str] = None,
    session_token: Optional[str] = None
):
    try:
        hours = max(1, min(168, hours))
        return get_energy(
            region=region,
            hours=hours,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            aws_session_token=session_token
        )
    except Exception as exc:
        print("AWS ENERGY ERROR:", str(exc))
        raise HTTPException(
            status_code=503,
            detail="Unable to calculate AWS energy efficiency."
        )


# ============================================================
# "WHAT-IF" ARCHITECTURE DIGITAL TWIN SIMULATOR ENDPOINTS
# ============================================================

class SimulationRequest(BaseModel):
    current_instance_type: Optional[str] = "t3.small"
    target_instance_type: Optional[str] = "t4g.small"
    instance_count: Optional[int] = 1
    pricing_model: Optional[str] = "on-demand"
    schedule_hours_per_day: Optional[int] = 24
    region: Optional[str] = "ap-south-1"


@router.post("/simulator/calculate")
def simulate_architecture_endpoint(payload: SimulationRequest):
    """
    Simulates FinOps cost savings and GreenOps environmental impact
    for migrating compute architecture (e.g. x86 to Graviton ARM)
    and applying automated scheduling.
    """
    try:
        return simulate_architecture_savings(
            current_instance_type=payload.current_instance_type or "t3.small",
            target_instance_type=payload.target_instance_type or "t4g.small",
            instance_count=payload.instance_count or 1,
            pricing_model=payload.pricing_model or "on-demand",
            schedule_hours_per_day=payload.schedule_hours_per_day or 24,
            region=payload.region or "ap-south-1"
        )
    except Exception as exc:
        print("SIMULATION ERROR:", str(exc))
        raise HTTPException(
            status_code=500,
            detail=f"Simulation error: {str(exc)}"
        )


@router.get("/simulator/catalog")
def get_simulator_catalog():
    """
    Returns supported instance types and specifications for simulation.
    """
    return {
        "catalog": INSTANCE_CATALOG
    }