from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from services.energy_service import get_energy


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