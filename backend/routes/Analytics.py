from fastapi import APIRouter, HTTPException
from services.analytics_service import get_analytics

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/aws")
def aws_analytics(region: str = "ap-south-1", hours: int = 24):
    try:
        hours = max(1, min(168, hours))
        return get_analytics(region=region, hours=hours)
    except Exception as exc:
        print("AWS ANALYTICS ERROR:", str(exc))
        raise HTTPException(status_code=503, detail="Unable to retrieve AWS analytics.")
