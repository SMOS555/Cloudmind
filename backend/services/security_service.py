import os
from datetime import datetime, timezone
from dotenv import load_dotenv
import boto3
from botocore.exceptions import ClientError, NoCredentialsError, PartialCredentialsError, EndpointConnectionError

load_dotenv()


# ============================================================
# AWS SESSION CREATION HELPER
# ============================================================

def get_boto3_session(
    aws_access_key_id=None,
    aws_secret_access_key=None,
    aws_session_token=None,
    region="ap-south-1",
    role_arn=None,
    external_id=None
):
    """
    Creates a Boto3 Session honoring user-provided credentials,
    STS AssumeRole if role_arn is given, or falling back to environment variables.
    """
    # 1. Custom access key & secret key passed in
    if aws_access_key_id and aws_secret_access_key:
        session_kwargs = {
            "aws_access_key_id": aws_access_key_id.strip(),
            "aws_secret_access_key": aws_secret_access_key.strip(),
            "region_name": region.strip() if region else "ap-south-1",
        }
        if aws_session_token and aws_session_token.strip():
            session_kwargs["aws_session_token"] = aws_session_token.strip()
        return boto3.Session(**session_kwargs)

    # 2. Assume role if provided
    if role_arn:
        sts = boto3.client("sts")
        assume_params = {
            "RoleArn": role_arn.strip(),
            "RoleSessionName": "CloudMindSecuritySession",
        }
        if external_id:
            assume_params["ExternalId"] = external_id.strip()
        resp = sts.assume_role(**assume_params)
        creds = resp["Credentials"]
        return boto3.Session(
            aws_access_key_id=creds["AccessKeyId"],
            aws_secret_access_key=creds["SecretAccessKey"],
            aws_session_token=creds["SessionToken"],
            region_name=region.strip() if region else "ap-south-1",
        )

    # 3. Fallback to environment variables or default boto3 configuration
    env_key = os.getenv("AWS_ACCESS_KEY_ID")
    env_secret = os.getenv("AWS_SECRET_ACCESS_KEY")
    env_token = os.getenv("AWS_SESSION_TOKEN")

    if env_key and env_secret:
        session_kwargs = {
            "aws_access_key_id": env_key.strip(),
            "aws_secret_access_key": env_secret.strip(),
            "region_name": region.strip() if region else "ap-south-1",
        }
        if env_token:
            session_kwargs["aws_session_token"] = env_token.strip()
        return boto3.Session(**session_kwargs)

    return boto3.Session(region_name=region.strip() if region else "ap-south-1")


# ============================================================
# VALIDATE AWS CREDENTIALS (FAST STS CHECK)
# ============================================================

def validate_aws_credentials(
    aws_access_key_id=None,
    aws_secret_access_key=None,
    aws_session_token=None,
    region="ap-south-1"
):
    """
    Validates provided AWS credentials by calling STS get_caller_identity.
    Returns account ID, ARN, and connectivity status.
    """
    try:
        session = get_boto3_session(
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            aws_session_token=aws_session_token,
            region=region
        )
        sts = session.client("sts")
        identity = sts.get_caller_identity()

        return {
            "valid": True,
            "account_id": identity.get("Account"),
            "arn": identity.get("Arn"),
            "user_id": identity.get("UserId"),
            "region": region,
            "credential_source": "custom_keys" if (aws_access_key_id and aws_secret_access_key) else "server_env",
            "message": "AWS credentials verified successfully."
        }
    except (ClientError, NoCredentialsError, PartialCredentialsError, EndpointConnectionError) as e:
        return {
            "valid": False,
            "error": str(e),
            "message": "Failed to authenticate with AWS. Please verify your Access Key ID and Secret Access Key."
        }
    except Exception as e:
        return {
            "valid": False,
            "error": str(e),
            "message": "An unexpected error occurred while verifying AWS credentials."
        }


# ============================================================
# AWS SECURITY SCAN & DEEP INSTANCE ANALYTICS
# ============================================================

def scan_aws_security(
    region="ap-south-1",
    aws_access_key_id=None,
    aws_secret_access_key=None,
    aws_session_token=None,
    role_arn=None,
    external_id=None
):
    """
    Comprehensive AWS EC2 infrastructure security scan.
    Gathers all instances, security groups, EBS volumes, IAM configuration,
    and metadata settings to compute deep security analytics.
    """
    region = region.strip() if region else "ap-south-1"
    session = get_boto3_session(
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
        aws_session_token=aws_session_token,
        region=region,
        role_arn=role_arn,
        external_id=external_id
    )

    # 1. Identity Check
    account_id = "Unknown"
    user_arn = "Unknown"
    try:
        sts = session.client("sts")
        ident = sts.get_caller_identity()
        account_id = ident.get("Account", "Unknown")
        user_arn = ident.get("Arn", "Unknown")
    except Exception as e:
        print("Warning: STS identity lookup failed:", str(e))

    ec2 = session.client("ec2", region_name=region)

    findings = []
    security_score = 100

    # 2. Fetch All EC2 Instances
    raw_instances = []
    try:
        paginator = ec2.get_paginator("describe_instances")
        for page in paginator.paginate():
            for reservation in page.get("Reservations", []):
                for inst in reservation.get("Instances", []):
                    raw_instances.append(inst)
    except (NoCredentialsError, PartialCredentialsError):
        raise RuntimeError("AWS credentials not found or incomplete. Please provide a valid AWS Access Key ID and Secret Access Key.")
    except EndpointConnectionError:
        raise RuntimeError(f"Could not connect to AWS endpoint in region '{region}'. Please check your network connection and region code.")
    except ClientError as ce:
        error_code = ce.response.get("Error", {}).get("Code", "ClientError")
        error_msg = ce.response.get("Error", {}).get("Message", str(ce))
        raise RuntimeError(f"AWS error ({error_code}): {error_msg}")

    # 3. Fetch All Security Groups in Region for Network Risk Matrix
    security_groups_map = {}
    risky_security_groups = {}
    try:
        sg_response = ec2.describe_security_groups()
        for sg in sg_response.get("SecurityGroups", []):
            sg_id = sg.get("GroupId")
            security_groups_map[sg_id] = sg
    except Exception as e:
        print("Warning: describe_security_groups failed:", str(e))

    # 4. Fetch All EBS Volumes to verify encryption
    volume_encryption_map = {}
    all_volume_ids = []
    for inst in raw_instances:
        for bdm in inst.get("BlockDeviceMappings", []):
            ebs = bdm.get("Ebs", {})
            vol_id = ebs.get("VolumeId")
            if vol_id:
                all_volume_ids.append(vol_id)

    if all_volume_ids:
        for i in range(0, len(all_volume_ids), 100):
            chunk = all_volume_ids[i:i + 100]
            try:
                vols_resp = ec2.describe_volumes(VolumeIds=chunk)
                for vol in vols_resp.get("Volumes", []):
                    volume_encryption_map[vol["VolumeId"]] = {
                        "encrypted": vol.get("Encrypted", False),
                        "kms_key_id": vol.get("KmsKeyId"),
                        "size_gb": vol.get("Size"),
                        "type": vol.get("VolumeType")
                    }
            except Exception as e:
                print("Warning: describe_volumes check failed:", str(e))

    # 5. Analyze Security Groups Rules for Unrestricted Ingress
    for sg_id, sg in security_groups_map.items():
        sg_name = sg.get("GroupName", sg_id)
        rules_risks = []

        for permission in sg.get("IpPermissions", []):
            from_port = permission.get("FromPort")
            to_port = permission.get("ToPort")
            protocol = permission.get("IpProtocol")

            for ip_range in permission.get("IpRanges", []):
                cidr = ip_range.get("CidrIp")

                # Check for 0.0.0.0/0 (Open to the World)
                if cidr == "0.0.0.0/0":
                    # SSH (Port 22)
                    if (from_port == 22 or to_port == 22) or (from_port is None and protocol == "-1"):
                        rules_risks.append({
                            "type": "SSH_OPEN",
                            "severity": "High",
                            "port": 22,
                            "protocol": protocol,
                            "desc": f"SSH (port 22) is open to 0.0.0.0/0 on {sg_name} ({sg_id})"
                        })
                    # RDP (Port 3389)
                    if (from_port == 3389 or to_port == 3389) or (from_port is None and protocol == "-1"):
                        rules_risks.append({
                            "type": "RDP_OPEN",
                            "severity": "High",
                            "port": 3389,
                            "protocol": protocol,
                            "desc": f"RDP (port 3389) is open to 0.0.0.0/0 on {sg_name} ({sg_id})"
                        })
                    # All Traffic (-1)
                    if protocol == "-1":
                        rules_risks.append({
                            "type": "ALL_TRAFFIC_OPEN",
                            "severity": "Critical",
                            "port": "All",
                            "protocol": "All",
                            "desc": f"All inbound traffic is open to 0.0.0.0/0 on {sg_name} ({sg_id})"
                        })
                    # Database ports (MySQL 3306, Postgres 5432, MSSQL 1433, Mongo 27017, Redis 6379)
                    db_ports = [3306, 5432, 1433, 27017, 6379]
                    for db_p in db_ports:
                        if from_port is not None and to_port is not None:
                            if from_port <= db_p <= to_port:
                                rules_risks.append({
                                    "type": "DATABASE_OPEN",
                                    "severity": "Critical",
                                    "port": db_p,
                                    "protocol": protocol,
                                    "desc": f"Database port {db_p} is open to 0.0.0.0/0 on {sg_name} ({sg_id})"
                                })

        if rules_risks:
            risky_security_groups[sg_id] = {
                "group_id": sg_id,
                "group_name": sg_name,
                "risks": rules_risks
            }

    # 6. Parse and Enrich ALL EC2 Instances
    enriched_instances = []
    finding_id_counter = 1

    for inst in raw_instances:
        inst_id = inst.get("InstanceId")
        tags = {t.get("Key"): t.get("Value") for t in inst.get("Tags", [])}
        inst_name = tags.get("Name", inst_id)

        state = (inst.get("State") or {}).get("Name", "unknown")
        inst_type = inst.get("InstanceType")
        public_ip = inst.get("PublicIpAddress")
        private_ip = inst.get("PrivateIpAddress")
        vpc_id = inst.get("VpcId")
        subnet_id = inst.get("SubnetId")
        az = (inst.get("Placement") or {}).get("AvailabilityZone")
        architecture = inst.get("Architecture", "x86_64")
        platform = inst.get("Platform") or ("windows" if "windows" in (inst.get("PlatformDetails") or "").lower() else "linux")
        key_name = inst.get("KeyName")
        launch_time = inst.get("LaunchTime").isoformat() if inst.get("LaunchTime") else None
        monitoring_state = (inst.get("Monitoring") or {}).get("State", "disabled")
        iam_profile = (inst.get("IamInstanceProfile") or {}).get("Arn")

        # Metadata options (IMDSv2)
        meta_opts = inst.get("MetadataOptions") or {}
        http_tokens = meta_opts.get("HttpTokens")
        imdsv2_enforced = (http_tokens == "required")

        # Attached Security Groups
        inst_sgs = []
        inst_has_risky_sg = False
        inst_sg_risks = []
        for sg_item in inst.get("SecurityGroups", []):
            sg_id = sg_item.get("GroupId")
            sg_name = sg_item.get("GroupName")
            is_risky = sg_id in risky_security_groups
            if is_risky:
                inst_has_risky_sg = True
                inst_sg_risks.extend(risky_security_groups[sg_id]["risks"])
            inst_sgs.append({
                "id": sg_id,
                "name": sg_name,
                "is_risky": is_risky,
                "risks": risky_security_groups.get(sg_id, {}).get("risks", [])
            })

        # Attached EBS Volumes Encryption
        attached_volumes = []
        unencrypted_vols_count = 0
        encrypted_vols_count = 0
        for bdm in inst.get("BlockDeviceMappings", []):
            device_name = bdm.get("DeviceName")
            ebs = bdm.get("Ebs", {})
            vol_id = ebs.get("VolumeId")
            vol_meta = volume_encryption_map.get(vol_id, {})
            is_enc = vol_meta.get("encrypted", False)
            if is_enc:
                encrypted_vols_count += 1
            else:
                unencrypted_vols_count += 1

            attached_volumes.append({
                "volume_id": vol_id,
                "device_name": device_name,
                "encrypted": is_enc,
                "size_gb": vol_meta.get("size_gb"),
                "type": vol_meta.get("type")
            })

        # Per-instance security assessment
        instance_findings = []
        instance_risk_score = 100

        # Check A: Public IP Exposure
        if public_ip:
            finding_item = {
                "id": f"FINDING-{finding_id_counter:03d}",
                "severity": "Medium",
                "category": "Network Security",
                "title": "Instance Directly Exposed to Public Internet",
                "resource_type": "EC2 Instance",
                "resource": inst_id,
                "resource_name": inst_name,
                "description": f"Instance {inst_name} ({inst_id}) has a public IP address ({public_ip}). Direct public exposure increases the attack surface for automated bots and zero-day exploits.",
                "recommendation": "Deploy instances in private subnets behind an Application Load Balancer or NAT Gateway. Use AWS SSM Session Manager instead of public IP access.",
                "remediation_cli": f"aws ec2 modify-subnet-attribute --subnet-id {subnet_id or '<subnet-id>'} --no-map-public-ip-on-launch"
            }
            findings.append(finding_item)
            instance_findings.append(finding_item)
            security_score -= 10
            instance_risk_score -= 15
            finding_id_counter += 1

        # Check B: Unrestricted Security Groups
        for risk in inst_sg_risks:
            sev = risk["severity"]
            title = "Unrestricted Port Open to Internet"
            if risk["type"] == "SSH_OPEN":
                title = "SSH (Port 22) Unrestricted to 0.0.0.0/0"
                rem_cmd = f"aws ec2 revoke-security-group-ingress --group-id <group-id> --protocol tcp --port 22 --cidr 0.0.0.0/0"
            elif risk["type"] == "RDP_OPEN":
                title = "RDP (Port 3389) Unrestricted to 0.0.0.0/0"
                rem_cmd = f"aws ec2 revoke-security-group-ingress --group-id <group-id> --protocol tcp --port 3389 --cidr 0.0.0.0/0"
            elif risk["type"] == "ALL_TRAFFIC_OPEN":
                title = "All Inbound Traffic Open to 0.0.0.0/0"
                rem_cmd = f"aws ec2 revoke-security-group-ingress --group-id <group-id> --protocol -1 --cidr 0.0.0.0/0"
            elif risk["type"] == "DATABASE_OPEN":
                title = f"Database Port {risk['port']} Open to 0.0.0.0/0"
                rem_cmd = f"aws ec2 revoke-security-group-ingress --group-id <group-id> --protocol tcp --port {risk['port']} --cidr 0.0.0.0/0"
            else:
                rem_cmd = "aws ec2 describe-security-groups --group-ids <group-id>"

            finding_item = {
                "id": f"FINDING-{finding_id_counter:03d}",
                "severity": sev,
                "category": "Network Security",
                "title": title,
                "resource_type": "Security Group",
                "resource": inst_id,
                "resource_name": inst_name,
                "description": f"{risk['desc']} attached to instance {inst_name} ({inst_id}).",
                "recommendation": "Restrict inbound traffic to known CIDR ranges (e.g., your corporate VPN IP /32) rather than 0.0.0.0/0.",
                "remediation_cli": rem_cmd
            }
            findings.append(finding_item)
            instance_findings.append(finding_item)
            security_score -= (20 if sev == "High" else 25 if sev == "Critical" else 10)
            instance_risk_score -= (25 if sev == "High" else 35 if sev == "Critical" else 15)
            finding_id_counter += 1

        # Check C: Unencrypted EBS Volumes
        if unencrypted_vols_count > 0:
            finding_item = {
                "id": f"FINDING-{finding_id_counter:03d}",
                "severity": "High",
                "category": "Data Protection",
                "title": "Unencrypted EBS Storage Volume(s) Attached",
                "resource_type": "EBS Volume",
                "resource": inst_id,
                "resource_name": inst_name,
                "description": f"Instance {inst_name} has {unencrypted_vols_count} unencrypted EBS volume(s). Unencrypted storage exposes data-at-rest to unauthorized inspection if snapshots or volumes are detached.",
                "recommendation": "Enable AWS KMS default encryption for EBS volumes in this region and create encrypted snapshot copies for existing volumes.",
                "remediation_cli": f"aws ec2 enable-ebs-encryption-by-default --region {region}"
            }
            findings.append(finding_item)
            instance_findings.append(finding_item)
            security_score -= 15
            instance_risk_score -= 20
            finding_id_counter += 1

        # Check D: IMDSv2 Metadata Hardening
        if not imdsv2_enforced:
            finding_item = {
                "id": f"FINDING-{finding_id_counter:03d}",
                "severity": "Medium",
                "category": "Host Hardening",
                "title": "IMDSv2 Not Enforced (Vulnerable to SSRF)",
                "resource_type": "EC2 Metadata",
                "resource": inst_id,
                "resource_name": inst_name,
                "description": f"Instance {inst_name} allows IMDSv1 tokenless metadata access. If an application running on this instance suffers from SSRF, attackers can extract temporary IAM credentials.",
                "recommendation": "Require IMDSv2 by setting HttpTokens to 'required' on the instance metadata configuration.",
                "remediation_cli": f"aws ec2 modify-instance-metadata-options --instance-id {inst_id} --http-tokens required --http-endpoint enabled --region {region}"
            }
            findings.append(finding_item)
            instance_findings.append(finding_item)
            security_score -= 10
            instance_risk_score -= 15
            finding_id_counter += 1

        # Check E: IAM Instance Profile Missing
        if not iam_profile:
            finding_item = {
                "id": f"FINDING-{finding_id_counter:03d}",
                "severity": "Low",
                "category": "Identity & Access",
                "title": "No IAM Instance Profile Attached",
                "resource_type": "IAM Profile",
                "resource": inst_id,
                "resource_name": inst_name,
                "description": f"Instance {inst_name} does not have an IAM role attached. Applications requiring AWS API access might inadvertently rely on hardcoded static credentials.",
                "recommendation": "Attach a least-privilege IAM instance role to allow AWS SDKs to use automatic temporary STS credentials.",
                "remediation_cli": f"aws ec2 associate-iam-instance-profile --instance-id {inst_id} --iam-instance-profile Name=<RoleName>"
            }
            findings.append(finding_item)
            instance_findings.append(finding_item)
            security_score -= 5
            instance_risk_score -= 10
            finding_id_counter += 1

        # Determine instance risk rating
        instance_risk_score = max(0, min(100, instance_risk_score))
        if instance_risk_score >= 85:
            inst_risk_level = "Low"
        elif instance_risk_score >= 65:
            inst_risk_level = "Medium"
        elif instance_risk_score >= 45:
            inst_risk_level = "High"
        else:
            inst_risk_level = "Critical"

        enriched_instances.append({
            "id": inst_id,
            "name": inst_name,
            "state": state,
            "instance_type": inst_type,
            "public_ip": public_ip,
            "private_ip": private_ip,
            "vpc_id": vpc_id,
            "subnet_id": subnet_id,
            "availability_zone": az,
            "architecture": architecture,
            "platform": platform,
            "key_name": key_name,
            "launch_time": launch_time,
            "monitoring_state": monitoring_state,
            "iam_profile": iam_profile,
            "imdsv2_enforced": imdsv2_enforced,
            "http_tokens": http_tokens,
            "security_groups": inst_sgs,
            "volumes": attached_volumes,
            "unencrypted_volumes_count": unencrypted_vols_count,
            "encrypted_volumes_count": encrypted_vols_count,
            "risk_score": instance_risk_score,
            "risk_level": inst_risk_level,
            "findings_count": len(instance_findings),
            "findings": instance_findings
        })

    # 7. Clamp Security Score
    security_score = max(0, min(100, security_score))

    # Determine Risk Level
    if security_score >= 90:
        overall_risk = "Low"
    elif security_score >= 70:
        overall_risk = "Medium"
    elif security_score >= 50:
        overall_risk = "High"
    else:
        overall_risk = "Critical"

    # 8. Compute Pillar Compliance Scores (0 - 100%)
    total_inst = len(enriched_instances)
    if total_inst == 0:
        net_comp = 100
        data_comp = 100
        iam_comp = 100
        host_comp = 100
    else:
        net_ok = sum(1 for i in enriched_instances if not i["public_ip"] and not any(sg["is_risky"] for sg in i["security_groups"]))
        net_comp = round((net_ok / total_inst) * 100)

        data_ok = sum(1 for i in enriched_instances if i["unencrypted_volumes_count"] == 0)
        data_comp = round((data_ok / total_inst) * 100)

        iam_ok = sum(1 for i in enriched_instances if i["iam_profile"])
        iam_comp = round((iam_ok / total_inst) * 100)

        host_ok = sum(1 for i in enriched_instances if i["imdsv2_enforced"])
        host_comp = round((host_ok / total_inst) * 100)

    # 9. Summary Counts
    critical_count = sum(1 for f in findings if f["severity"] == "Critical")
    high_count = sum(1 for f in findings if f["severity"] == "High")
    medium_count = sum(1 for f in findings if f["severity"] == "Medium")
    low_count = sum(1 for f in findings if f["severity"] == "Low")

    public_instances_count = sum(1 for i in enriched_instances if i["public_ip"])
    running_instances_count = sum(1 for i in enriched_instances if i["state"] == "running")
    stopped_instances_count = sum(1 for i in enriched_instances if i["state"] == "stopped")
    unencrypted_volumes_total = sum(i["unencrypted_volumes_count"] for i in enriched_instances)
    imdsv1_vulnerable_count = sum(1 for i in enriched_instances if not i["imdsv2_enforced"])
    missing_iam_count = sum(1 for i in enriched_instances if not i["iam_profile"])

    # 10. Attack Surface Port Radar
    port_exposure = {
        "ssh_22": sum(1 for i in enriched_instances if any(r["type"] == "SSH_OPEN" for sg in i["security_groups"] for r in sg.get("risks", []))),
        "rdp_3389": sum(1 for i in enriched_instances if any(r["type"] == "RDP_OPEN" for sg in i["security_groups"] for r in sg.get("risks", []))),
        "all_traffic": sum(1 for i in enriched_instances if any(r["type"] == "ALL_TRAFFIC_OPEN" for sg in i["security_groups"] for r in sg.get("risks", []))),
        "databases": sum(1 for i in enriched_instances if any(r["type"] == "DATABASE_OPEN" for sg in i["security_groups"] for r in sg.get("risks", []))),
    }

    # Summary text
    if not raw_instances:
        summary_text = f"No EC2 instances were found in region {region}. Your account infrastructure is clean or located in a different AWS region."
    elif not findings:
        summary_text = f"Analyzed {total_inst} EC2 instances across {len(security_groups_map)} security groups. No security vulnerabilities were detected."
    else:
        summary_text = f"Identified {len(findings)} security findings across {total_inst} EC2 instances in {region} ({critical_count} Critical, {high_count} High, {medium_count} Medium)."

    return {
        "provider": "AWS",
        "account_id": account_id,
        "user_arn": user_arn,
        "region": region,
        "scan_timestamp": datetime.now(timezone.utc).isoformat(),
        "security_score": security_score,
        "risk_level": overall_risk,
        "summary": summary_text,
        "total_instances": total_inst,
        "running_instances": running_instances_count,
        "stopped_instances": stopped_instances_count,
        "public_instances": public_instances_count,
        "private_instances": total_inst - public_instances_count,
        "unencrypted_volumes_count": unencrypted_volumes_total,
        "imdsv1_vulnerable_count": imdsv1_vulnerable_count,
        "missing_iam_count": missing_iam_count,
        "findings_count": len(findings),
        "severity_breakdown": {
            "critical": critical_count,
            "high": high_count,
            "medium": medium_count,
            "low": low_count
        },
        "compliance_pillars": {
            "network_security": net_comp,
            "data_protection": data_comp,
            "identity_access": iam_comp,
            "host_hardening": host_comp,
            "overall_average": round((net_comp + data_comp + iam_comp + host_comp) / 4)
        },
        "port_exposure": port_exposure,
        "findings": findings,
        "instances": enriched_instances,
        "security_groups_count": len(security_groups_map),
        "risky_security_groups_count": len(risky_security_groups),
        "security_groups": [
            {
                "group_id": sg_id,
                "group_name": sg.get("GroupName"),
                "description": sg.get("Description"),
                "vpc_id": sg.get("VpcId"),
                "inbound_rules_count": len(sg.get("IpPermissions", [])),
                "is_risky": sg_id in risky_security_groups,
                "risks": risky_security_groups.get(sg_id, {}).get("risks", []),
                "ip_permissions": [
                    {
                        "protocol": p.get("IpProtocol"),
                        "from_port": p.get("FromPort"),
                        "to_port": p.get("ToPort"),
                        "ip_ranges": [r.get("CidrIp") for r in p.get("IpRanges", []) if r.get("CidrIp")]
                    }
                    for p in sg.get("IpPermissions", [])
                ]
            }
            for sg_id, sg in security_groups_map.items()
        ]
    }