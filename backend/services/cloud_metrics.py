from datetime import datetime, timezone

from services.aws_services import get_ec2_cpu_metrics


# ==========================================
# REAL CLOUD METRICS
# ==========================================

def get_cloud_metrics(region="ap-south-1"):

    # ==========================================
    # GET REAL AWS EC2 + CLOUDWATCH DATA
    # ==========================================

    aws_data = get_ec2_cpu_metrics(
        region=region,
        history_hours=7
    )

    total_servers = aws_data["total_instances"]

    running_servers = aws_data["running_instances"]

    cpu_usage = aws_data["cpu_usage"]

    cpu_history = aws_data["cpu_history"]

    # ==========================================
    # CLOUD HEALTH
    # ==========================================

    if total_servers == 0:

        cloud_health = 100

    else:

        cloud_health = max(
            0,
            min(
                100,
                round(
                    100
                    - max(0, cpu_usage - 70)
                )
            )
        )

    # ==========================================
    # SECURITY
    #
    # Security cannot be calculated from EC2
    # CPU metrics alone.
    # ==========================================

    security_score = None

    # ==========================================
    # ENERGY EFFICIENCY
    #
    # This is an estimate based on CPU usage.
    # ==========================================

    energy_efficiency = max(
        0,
        min(
            100,
            round(100 - (cpu_usage * 0.25), 2)
        )
    )

    # ==========================================
    # MONTHLY COST
    #
    # Actual AWS billing requires Cost Explorer.
    # Until that is connected, don't pretend this
    # number is real.
    # ==========================================

    monthly_cost = None

    # ==========================================
    # PROVIDER DISTRIBUTION
    #
    # These are REAL AWS EC2 resources.
    # Azure/GCP aren't queried yet.
    # ==========================================

    if total_servers > 0:

        providers = {
            "aws": 100,
            "azure": 0,
            "gcp": 0,
        }

    else:

        providers = {
            "aws": 0,
            "azure": 0,
            "gcp": 0,
        }

    # ==========================================
    # INFRASTRUCTURE STATUS
    # ==========================================

    if total_servers == 0:

        compute_status = "No Instances"

    elif cpu_usage >= 90:

        compute_status = "Critical"

    elif cpu_usage >= 75:

        compute_status = "Warning"

    else:

        compute_status = "Healthy"

    infrastructure = {

        "compute": compute_status,

        # These cannot be determined from EC2
        # CPU metrics alone.

        "database": "Not Monitored",

        "network": "Not Monitored",

        "security": "Not Monitored",
    }

    # ==========================================
    # FINAL RESPONSE
    # ==========================================

    return {

        "timestamp":
            datetime.now(
                timezone.utc
            ).isoformat(),

        "source": "AWS EC2 + CloudWatch",

        "region": region,

        "cloud_health": cloud_health,

        "monthly_cost": monthly_cost,

        "energy_efficiency":
            energy_efficiency,

        "security_score":
            security_score,

        "cpu_usage":
            cpu_usage,

        "memory_usage":
            None,

        "network_usage":
            None,

        "total_servers":
            total_servers,

        "running_servers":
            running_servers,

        "providers":
            providers,

        "infrastructure":
            infrastructure,

        "servers":
            aws_data["instances"],

        # ======================================
        # REAL CLOUDWATCH HISTORY
        # ======================================

        "history": {

            "cpu":
                cpu_history,

            "memory":
                [],

            "network":
                [],
        },

        # ======================================
        # AWS INFORMATION
        # ======================================

        "aws": {

            "region":
                aws_data["region"],

            "total_instances":
                aws_data["total_instances"],

            "running_instances":
                aws_data["running_instances"],

            "instances":
                aws_data["instances"],
        }
    }