from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import re

from services.provider_service import calculate_provider_scores

from services.aws_services import (
    get_aws_account,
    get_ec2_instances,
    get_ec2_cpu_metrics,
)


router = APIRouter(
    prefix="/provider",
    tags=["Cloud Provider"]
)


# ============================================================
# PROVIDER REQUIREMENTS
# ============================================================

class ProviderRequirements(BaseModel):

    security: int = 3
    performance: int = 3
    energy: int = 3
    cost: int = 3


# ============================================================
# AWS CONNECTION REQUEST
# ============================================================

class AWSConnectionRequest(BaseModel):

    role_arn: str
    external_id: str
    region: str = "ap-south-1"


class AWSCredentialsPayload(BaseModel):
    role_arn: str | None = None
    external_id: str | None = None
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    aws_session_token: str | None = None
    region: str | None = "ap-south-1"


class AWSMetricsPayload(BaseModel):
    region: str | None = "ap-south-1"
    history_hours: int = 7
    role_arn: str | None = None
    external_id: str | None = None
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    aws_session_token: str | None = None


# ============================================================
# VALIDATE AWS ROLE ARN
# ============================================================

def validate_role_arn(role_arn: str):

    pattern = (
        r"^arn:aws:iam::"
        r"\d{12}:role\/.+$"
    )

    return bool(
        re.match(
            pattern,
            role_arn.strip()
        )
    )


# ============================================================
# PROVIDER RECOMMENDATION
# ============================================================

@router.post("/recommend")
def recommend_provider(
    requirements: ProviderRequirements
):

    result = calculate_provider_scores(
        requirements.model_dump()
    )

    return result


# ============================================================
# CONNECT AWS ACCOUNT
# ============================================================

@router.post("/aws/connect")
def connect_aws_account(
    request: AWSConnectionRequest
):

    role_arn = request.role_arn.strip()
    external_id = request.external_id.strip()
    region = request.region.strip()

    # --------------------------------------------------------
    # Validate role ARN
    # --------------------------------------------------------

    if not validate_role_arn(role_arn):

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid AWS Role ARN. "
                "Expected format: "
                "arn:aws:iam::123456789012:role/CloudMindReadOnly"
            )
        )

    # --------------------------------------------------------
    # Validate external ID
    # --------------------------------------------------------

    if len(external_id) < 2:

        raise HTTPException(
            status_code=400,
            detail="External ID must contain at least 2 characters."
        )

    try:

        # ----------------------------------------------------
        # Attempt STS AssumeRole
        # ----------------------------------------------------

        account = get_aws_account(
            role_arn=role_arn,
            external_id=external_id
        )

        # ----------------------------------------------------
        # Verify EC2 access as well
        # ----------------------------------------------------

        ec2 = get_ec2_instances(
            region=region,
            role_arn=role_arn,
            external_id=external_id
        )

        return {

            "success": True,

            "message":
                "AWS account connected successfully.",

            "account": {

                "account_id":
                    account["account_id"],

                "arn":
                    account["arn"],

                "user_id":
                    account["user_id"],

            },

            "role_arn":
                role_arn,

            "region":
                region,

            "connected_via_role":
                True,

            "infrastructure": {

                "total_instances":
                    ec2["total_instances"],

                "running_instances":
                    ec2["running_instances"],

            },

            "status":
                "connected",

        }

    except Exception as e:

        print(
            "AWS ROLE CONNECTION ERROR:",
            str(e)
        )

        raise HTTPException(

            status_code=403,

            detail=(
                "Unable to assume the AWS role. "
                "Check the Role ARN, External ID, "
                "trust policy, and CloudMind permissions."
            )

        )


# ============================================================
# AWS CONNECTION TEST
# ============================================================

@router.get("/aws/test")
def test_aws_connection(
    role_arn: str | None = None,
    external_id: str | None = None,
    aws_access_key_id: str | None = None,
    aws_secret_access_key: str | None = None,
    aws_session_token: str | None = None,
    region: str | None = None
):

    try:

        if aws_access_key_id and aws_secret_access_key:
            return get_aws_account(
                aws_access_key_id=aws_access_key_id,
                aws_secret_access_key=aws_secret_access_key,
                aws_session_token=aws_session_token,
                region=region
            )

        # ----------------------------------------------------
        # Customer account via AssumeRole
        # ----------------------------------------------------

        if role_arn:

            if not external_id:

                raise HTTPException(
                    status_code=400,
                    detail="External ID is required."
                )

            return get_aws_account(
                role_arn=role_arn,
                external_id=external_id,
                region=region
            )

        # ----------------------------------------------------
        # Backend's default AWS account
        # Used only for development/fallback.
        # ----------------------------------------------------

        return get_aws_account(region=region)

    except HTTPException:

        raise

    except Exception as e:

        print(
            "AWS CONNECTION ERROR:",
            str(e)
        )

        raise HTTPException(

            status_code=503,

            detail=(
                "Unable to connect to AWS. "
                "Verify the role configuration."
            )

        )


@router.post("/aws/test")
def test_aws_connection_post(payload: AWSCredentialsPayload):
    return test_aws_connection(
        role_arn=payload.role_arn,
        external_id=payload.external_id,
        aws_access_key_id=payload.aws_access_key_id,
        aws_secret_access_key=payload.aws_secret_access_key,
        aws_session_token=payload.aws_session_token,
        region=payload.region
    )


# ============================================================
# AWS EC2 INSTANCES
# ============================================================

@router.get("/aws/instances")
def aws_instances(
    region: str = "ap-south-1",
    role_arn: str | None = None,
    external_id: str | None = None,
    aws_access_key_id: str | None = None,
    aws_secret_access_key: str | None = None,
    aws_session_token: str | None = None
):

    try:

        if aws_access_key_id and aws_secret_access_key:
            return get_ec2_instances(
                region=region,
                aws_access_key_id=aws_access_key_id,
                aws_secret_access_key=aws_secret_access_key,
                aws_session_token=aws_session_token
            )

        # ----------------------------------------------------
        # Customer account
        # ----------------------------------------------------

        if role_arn:

            if not external_id:

                raise HTTPException(
                    status_code=400,
                    detail="External ID is required."
                )

            return get_ec2_instances(
                region=region,
                role_arn=role_arn,
                external_id=external_id,
            )

        # ----------------------------------------------------
        # Default backend AWS account
        # ----------------------------------------------------

        return get_ec2_instances(
            region=region
        )

    except HTTPException:

        raise

    except Exception as e:

        print(
            "AWS EC2 ERROR:",
            str(e)
        )

        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve AWS EC2 instances."
        )


@router.post("/aws/instances")
def aws_instances_post(payload: AWSCredentialsPayload):
    return aws_instances(
        region=payload.region or "ap-south-1",
        role_arn=payload.role_arn,
        external_id=payload.external_id,
        aws_access_key_id=payload.aws_access_key_id,
        aws_secret_access_key=payload.aws_secret_access_key,
        aws_session_token=payload.aws_session_token
    )


# ============================================================
# AWS REAL CPU METRICS
# ============================================================

@router.get("/aws/metrics")
def aws_metrics(
    region: str = "ap-south-1",
    history_hours: int = 7,
    role_arn: str | None = None,
    external_id: str | None = None,
    aws_access_key_id: str | None = None,
    aws_secret_access_key: str | None = None,
    aws_session_token: str | None = None
):

    try:

        if aws_access_key_id and aws_secret_access_key:
            return get_ec2_cpu_metrics(
                region=region,
                history_hours=history_hours,
                aws_access_key_id=aws_access_key_id,
                aws_secret_access_key=aws_secret_access_key,
                aws_session_token=aws_session_token
            )

        # ----------------------------------------------------
        # Customer account
        # ----------------------------------------------------

        if role_arn:

            if not external_id:

                raise HTTPException(
                    status_code=400,
                    detail="External ID is required."
                )

            return get_ec2_cpu_metrics(
                region=region,
                history_hours=history_hours,
                role_arn=role_arn,
                external_id=external_id,
            )

        # ----------------------------------------------------
        # Default backend AWS account
        # ----------------------------------------------------

        return get_ec2_cpu_metrics(
            region=region,
            history_hours=history_hours,
        )

    except HTTPException:

        raise

    except Exception as e:

        print(
            "AWS METRICS ERROR:",
            str(e)
        )

        raise HTTPException(

            status_code=503,

            detail=(
                "Unable to retrieve "
                "AWS CloudWatch metrics."
            )

        )


@router.post("/aws/metrics")
def aws_metrics_post(payload: AWSMetricsPayload):
    return aws_metrics(
        region=payload.region or "ap-south-1",
        history_hours=payload.history_hours,
        role_arn=payload.role_arn,
        external_id=payload.external_id,
        aws_access_key_id=payload.aws_access_key_id,
        aws_secret_access_key=payload.aws_secret_access_key,
        aws_session_token=payload.aws_session_token
    )