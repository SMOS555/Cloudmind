from typing import Optional, Union, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from services.security_service import (
    scan_aws_security,
    validate_aws_credentials,
    remediate_security_finding,
    rollback_security_remediation,
    get_remediation_audit_log,
    scan_aws_account_identity,
    remediate_account_security
)


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


# ============================================================
# SELF-HEALING CLOUD: 1-CLICK REMEDIATION SCHEMAS & ENDPOINTS
# ============================================================

class RemediateFindingRequest(BaseModel):
    finding_id: str
    remediation_type: str
    resource_id: Optional[str] = None
    region: Optional[str] = "ap-south-1"
    security_group_id: Optional[str] = None
    protocol: Optional[str] = "tcp"
    port: Optional[Any] = None
    cidr: Optional[str] = "0.0.0.0/0"
    instance_id: Optional[str] = None
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_session_token: Optional[str] = None
    role_arn: Optional[str] = None
    external_id: Optional[str] = None
    actor: Optional[str] = "DevSecOps Auto-Remediator"


class RollbackFindingRequest(BaseModel):
    rollback_token: Optional[str] = None
    action_id: Optional[str] = None
    finding_id: Optional[str] = None
    region: Optional[str] = "ap-south-1"
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_session_token: Optional[str] = None
    actor: Optional[str] = "DevSecOps Rollback Controller"


@router.post("/aws/remediate")
def aws_remediate_finding_endpoint(payload: RemediateFindingRequest):
    """
    Executes 1-click self-healing remediation on an identified security vulnerability.
    Quarantines or revokes unrestricted ingress rules and enforces IMDSv2 metadata protection.
    """
    try:
        result = remediate_security_finding(
            finding_id=payload.finding_id,
            remediation_type=payload.remediation_type,
            resource_id=payload.resource_id,
            region=payload.region or "ap-south-1",
            security_group_id=payload.security_group_id,
            protocol=payload.protocol or "tcp",
            port=payload.port,
            cidr=payload.cidr or "0.0.0.0/0",
            instance_id=payload.instance_id,
            aws_access_key_id=payload.aws_access_key_id,
            aws_secret_access_key=payload.aws_secret_access_key,
            aws_session_token=payload.aws_session_token,
            role_arn=payload.role_arn,
            external_id=payload.external_id,
            actor=payload.actor or "DevSecOps Auto-Remediator"
        )
        return result
    except Exception as e:
        error_msg = str(e)
        print("REMEDIATION ERROR:", error_msg)
        raise HTTPException(
            status_code=500,
            detail=f"Remediation execution failed: {error_msg}"
        )


@router.post("/aws/remediate/rollback")
def aws_rollback_finding_endpoint(payload: RollbackFindingRequest):
    """
    Safely rolls back a remediation action using its cryptographic rollback token.
    """
    try:
        result = rollback_security_remediation(
            rollback_token=payload.rollback_token,
            action_id=payload.action_id,
            finding_id=payload.finding_id,
            region=payload.region or "ap-south-1",
            aws_access_key_id=payload.aws_access_key_id,
            aws_secret_access_key=payload.aws_secret_access_key,
            aws_session_token=payload.aws_session_token,
            actor=payload.actor or "DevSecOps Rollback Controller"
        )
        if not result.get("success"):
            raise HTTPException(status_code=404, detail=result.get("message", "Rollback target not found."))
        return result
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print("ROLLBACK ERROR:", error_msg)
        raise HTTPException(
            status_code=500,
            detail=f"Rollback execution failed: {error_msg}"
        )


@router.get("/aws/audit-log")
def aws_security_audit_log_endpoint():
    """
    Returns the real-time DevSecOps audit log of all self-healing actions and rollbacks.
    """
    return get_remediation_audit_log()


# ============================================================
# AWS ACCOUNT & ACCESS KEY AUDIT ENDPOINTS
# ============================================================

class AccountAuditRequest(BaseModel):
    region: Optional[str] = "ap-south-1"
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_session_token: Optional[str] = None
    role_arn: Optional[str] = None
    external_id: Optional[str] = None


class AccountRemediateRequest(BaseModel):
    action_type: str
    target_key_id: Optional[str] = None
    target_user: Optional[str] = None
    region: Optional[str] = "ap-south-1"
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_session_token: Optional[str] = None
    actor: Optional[str] = "DevSecOps Account Hardener"


@router.post("/aws/account-audit")
def aws_account_audit_endpoint(payload: AccountAuditRequest):
    """
    Audits AWS Account identity: access key age, root MFA, and CloudTrail access events.
    """
    try:
        return scan_aws_account_identity(
            region=payload.region or "ap-south-1",
            aws_access_key_id=payload.aws_access_key_id,
            aws_secret_access_key=payload.aws_secret_access_key,
            aws_session_token=payload.aws_session_token,
            role_arn=payload.role_arn,
            external_id=payload.external_id
        )
    except Exception as exc:
        print("ACCOUNT AUDIT ERROR:", str(exc))
        raise HTTPException(
            status_code=500,
            detail=f"Unable to complete account audit: {str(exc)}"
        )


@router.get("/aws/account-audit")
def aws_account_audit_get(region: Optional[str] = Query("ap-south-1")):
    """
    GET endpoint for rapid account identity auditing.
    """
    try:
        return scan_aws_account_identity(region=region)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/aws/account-remediate")
def aws_account_remediate_endpoint(payload: AccountRemediateRequest):
    """
    1-Click account remediation: deactivates stale keys, enforces MFA, or blocks anomalous IPs.
    """
    try:
        return remediate_account_security(
            action_type=payload.action_type,
            target_key_id=payload.target_key_id,
            target_user=payload.target_user,
            region=payload.region or "ap-south-1",
            aws_access_key_id=payload.aws_access_key_id,
            aws_secret_access_key=payload.aws_secret_access_key,
            aws_session_token=payload.aws_session_token,
            actor=payload.actor or "DevSecOps Account Hardener"
        )
    except Exception as exc:
        print("ACCOUNT REMEDIATION ERROR:", str(exc))
        raise HTTPException(
            status_code=500,
            detail=f"Account remediation failed: {str(exc)}"
        )