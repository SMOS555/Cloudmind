from fastapi import APIRouter
from pydantic import BaseModel

from services.provider_service import calculate_provider_scores


router = APIRouter(
    prefix="/provider",
    tags=["Cloud Provider"]
)


class ProviderRequirements(BaseModel):

    security: int = 3
    performance: int = 3
    energy: int = 3
    cost: int = 3


@router.post("/recommend")
def recommend_provider(
    requirements: ProviderRequirements
):

    result = calculate_provider_scores(
        requirements.model_dump()
    )

    return result