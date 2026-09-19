from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from services.security_service import scan_aws_security, validate_aws_credentials


router = APIRouter(
    prefix="/security",
    tags=["Security"]
)


# ============================================================
# REQUEST SCHEMAS
# ============================================================

class SecurityScanRequest(BaseModel):
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_session_token: Optional[str] = None
    region: Optional[str] = "ap-south-1"
    role_arn: Optional[str] = None
    external_id: Optional[str] = None


class CredentialsValidateRequest(BaseModel):
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_session_token: Optional[str] = None
    region: Optional[str] = "ap-south-1"


# ============================================================
# TEST / VALIDATE AWS CREDENTIALS
# ============================================================

@router.post("/aws/validate-credentials")
def validate_credentials_endpoint(payload: CredentialsValidateRequest):
    """
    Validates provided AWS credentials against AWS STS.
    """
    result = validate_aws_credentials(
        aws_access_key_id=payload.aws_access_key_id,
        aws_secret_access_key=payload.aws_secret_access_key,
        aws_session_token=payload.aws_session_token,
        region=payload.region or "ap-south-1"
    )
    if not result.get("valid"):
        raise HTTPException(
            status_code=400,
            detail=result.get("message", "Invalid AWS credentials.")
        )
    return result


# ============================================================
# AWS SECURITY SCAN (POST)
# ============================================================

@router.post("/aws/scan")
def aws_security_scan_post(payload: SecurityScanRequest):
    """
    Scans AWS infrastructure using custom or server-configured credentials.
    Gathers all EC2 instances, security groups, EBS volumes, and outputs security analytics.
    """
    try:
        return scan_aws_security(
            region=payload.region or "ap-south-1",
            aws_access_key_id=payload.aws_access_key_id,
            aws_secret_access_key=payload.aws_secret_access_key,
            aws_session_token=payload.aws_session_token,
            role_arn=payload.role_arn,
            external_id=payload.external_id
        )
    except Exception as e:
        error_msg = str(e)
        print("AWS SECURITY SCAN ERROR:", error_msg)
        raise HTTPException(
            status_code=502 if "describe_instances" in error_msg else 500,
            detail=error_msg or "Unable to perform AWS security scan."
        )


# ============================================================
# AWS SECURITY SCAN (GET - Backwards Compatibility)
# ============================================================

@router.get("/aws/scan")
def aws_security_scan_get(
    region: Optional[str] = Query("ap-south-1"),
    access_key_id: Optional[str] = None,
    secret_access_key: Optional[str] = None,
    session_token: Optional[str] = None
):
    try:
        return scan_aws_security(
            region=region,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            aws_session_token=session_token
        )
    except Exception as e:
        error_msg = str(e)
        print("AWS SECURITY SCAN ERROR (GET):", error_msg)
        raise HTTPException(
            status_code=500,
            detail=error_msg or "Unable to perform AWS security scan."
        )