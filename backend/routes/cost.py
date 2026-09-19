from fastapi import APIRouter, HTTPException

from services.cost_service import (
    get_aws_cost_data
)


router = APIRouter(
    prefix="/api/cost",
    tags=["Cost Optimization"]
)


@router.get("")
def get_cost():

    try:

        return get_aws_cost_data()

    except Exception as e:

        print(
            "AWS COST ERROR:",
            str(e)
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "Unable to retrieve "
                "AWS Cost Explorer data."
            )
        )