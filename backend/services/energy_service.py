import boto3

from datetime import datetime, timedelta, timezone


# ============================================================
# ENERGY MODEL
# ============================================================
#
# AWS does not expose direct per-EC2 electricity consumption
# through normal EC2/CloudWatch CPU metrics.
#
# Therefore:
# - CPU utilization = REAL CloudWatch telemetry
# - EC2 inventory = REAL AWS data
# - Energy consumption = ESTIMATE
# - Carbon emissions = ESTIMATE
# - Potential savings = ESTIMATE
#
# These values are intended for infrastructure planning,
# not electrical-meter accuracy.
# ============================================================


# Approximate average power assumptions by instance family.
# Values are deliberately conservative planning estimates.
POWER_PROFILES = {
    "t2": 25,
    "t3": 20,
    "t3a": 20,
    "t4g": 18,
    "m5": 45,
    "m5a": 45,
    "m6i": 50,
    "m6a": 50,
    "m7i": 50,
    "m7a": 50,
    "c5": 40,
    "c5a": 40,
    "c6i": 45,
    "c6a": 45,
    "c7i": 45,
    "c7a": 45,
    "r5": 55,
    "r5a": 55,
    "r6i": 60,
    "r6a": 60,
    "r7i": 60,
    "r7a": 60,
    "x1": 100,
    "x2": 100,
}


# Planning assumption for grid carbon intensity.
#
# This is NOT AWS-reported live carbon intensity.
# It is only used to demonstrate carbon estimation.
#
# kg CO2e / kWh
DEFAULT_CARBON_INTENSITY = 0.70


# ============================================================
# HELPERS
# ============================================================


def get_power_estimate(instance_type):
    """
    Return an estimated average wattage for an EC2 instance.

    Example:
        t3.micro -> approximately 20W planning estimate

    This is NOT measured electrical consumption.
    """

    if not instance_type:
        return 30

    family = instance_type.split(".")[0].lower()

    return POWER_PROFILES.get(
        family,
        35
    )


def calculate_efficiency_score(cpu):
    """
    Convert CPU utilization into a relative efficiency score.

    The score rewards useful utilization while avoiding the
    assumption that 100% CPU is automatically ideal.
    """

    if cpu <= 0:
        return 0

    if cpu < 10:
        return 45

    if cpu < 25:
        return 65

    if cpu < 50:
        return 85

    if cpu < 75:
        return 95

    if cpu < 90:
        return 88

    return 78


def get_status(cpu):
    if cpu < 10:
        return "Very Low Utilization"

    if cpu < 25:
        return "Low Utilization"

    if cpu < 50:
        return "Efficient"

    if cpu < 75:
        return "Highly Utilized"

    if cpu < 90:
        return "Heavy Utilization"

    return "Very Heavy Utilization"


def calculate_energy_intensity(cpu):
    """
    Relative planning metric.

    Lower is generally better.

    100 represents a baseline planning intensity.
    """

    if cpu <= 0:
        return 0

    # Higher utilization spreads the estimated infrastructure
    # energy over more useful workload.
    intensity = 100 / max(cpu, 1)

    return round(
        min(intensity, 100),
        2
    )


def calculate_instance_energy(
    instance_type,
    cpu,
    hours
):
    """
    Estimate energy consumption in kWh.

    Formula:

        estimated watts
        × utilization factor
        × hours
        / 1000

    A small idle/base component is retained so that a running
    machine does not become zero-energy simply because CPU is low.
    """

    base_watts = get_power_estimate(
        instance_type
    )

    utilization_factor = (
        0.30 +
        (max(0, min(cpu, 100)) / 100) * 0.70
    )

    estimated_watts = (
        base_watts *
        utilization_factor
    )

    kwh = (
        estimated_watts *
        hours
        / 1000
    )

    return kwh


def recommendation_for_instance(
    instance,
    cpu
):
    recommendations = []

    instance_id = instance["id"]
    instance_type = instance.get("type") or "unknown"

    if cpu < 10:

        recommendations.append({
            "title": f"Review {instance_id}",
            "description": (
                f"{instance_type} is averaging only "
                f"{round(cpu, 2)}% CPU utilization."
            ),
            "action": (
                "Consider right-sizing the instance or "
                "using scheduled start/stop policies."
            ),
            "priority": "high",
        })

    elif cpu < 25:

        recommendations.append({
            "title": f"Right-size {instance_id}",
            "description": (
                f"Average CPU utilization is "
                f"{round(cpu, 2)}%."
            ),
            "action": (
                "Review whether a smaller instance type "
                "could handle the workload."
            ),
            "priority": "medium",
        })

    elif cpu >= 90:

        recommendations.append({
            "title": f"Review capacity for {instance_id}",
            "description": (
                f"Average CPU utilization is "
                f"{round(cpu, 2)}%."
            ),
            "action": (
                "Consider horizontal scaling or a larger "
                "instance to avoid sustained saturation."
            ),
            "priority": "high",
        })

    elif cpu >= 75:

        recommendations.append({
            "title": f"Monitor {instance_id}",
            "description": (
                f"Average CPU utilization is "
                f"{round(cpu, 2)}%."
            ),
            "action": (
                "Monitor workload growth and scaling thresholds."
            ),
            "priority": "medium",
        })

    else:

        recommendations.append({
            "title": f"{instance_id} is efficiently utilized",
            "description": (
                f"Average CPU utilization is "
                f"{round(cpu, 2)}%."
            ),
            "action": (
                "Continue monitoring utilization for "
                "long-term right-sizing opportunities."
            ),
            "priority": "low",
        })

    return recommendations


# ============================================================
# MAIN ENERGY ANALYSIS
# ============================================================


def get_energy(
    region: str = "ap-south-1",
    hours: int = 24,
    aws_access_key_id: str | None = None,
    aws_secret_access_key: str | None = None,
    aws_session_token: str | None = None
):

    # Keep API input safe.
    hours = max(
        1,
        min(168, int(hours))
    )

    # ========================================================
    # AWS CLIENTS
    # ========================================================

    if aws_access_key_id and aws_secret_access_key:
        session_kwargs = {
            "aws_access_key_id": aws_access_key_id.strip(),
            "aws_secret_access_key": aws_secret_access_key.strip(),
            "region_name": region.strip() if region else "ap-south-1",
        }
        if aws_session_token and aws_session_token.strip():
            session_kwargs["aws_session_token"] = aws_session_token.strip()
        session = boto3.Session(**session_kwargs)
        ec2 = session.client("ec2", region_name=region)
        cloudwatch = session.client("cloudwatch", region_name=region)
    else:
        ec2 = boto3.client(
            "ec2",
            region_name=region
        )

        cloudwatch = boto3.client(
            "cloudwatch",
            region_name=region
        )

    # ========================================================
    # GET ALL EC2 INSTANCES
    # ========================================================

    instances = []

    paginator = ec2.get_paginator(
        "describe_instances"
    )

    for page in paginator.paginate():

        for reservation in page.get(
            "Reservations",
            []
        ):

            for instance in reservation.get(
                "Instances",
                []
            ):

                instances.append({
                    "id": instance["InstanceId"],

                    "type": instance.get(
                        "InstanceType"
                    ),

                    "state": instance.get(
                        "State",
                        {}
                    ).get(
                        "Name",
                        "unknown"
                    ),

                    "region": region,
                })

    running_instances = [
        instance
        for instance in instances
        if instance["state"] == "running"
    ]

    # ========================================================
    # NO RUNNING INSTANCES
    # ========================================================

    if not running_instances:

        return {
            "provider": "AWS",
            "region": region,

            "hours_analyzed": hours,

            "total_instances": len(
                instances
            ),

            "running_instances": 0,

            "average_cpu": None,

            "energy_efficiency": None,
            "efficiency_score": None,

            "energy_intensity_index": None,

            "estimated_status":
                "No running EC2 instances",

            "measurement": (
                "AWS EC2 inventory was checked successfully, "
                "but there are no running instances available "
                "for workload-based energy analysis."
            ),

            "energy_consumption": {
                "value": 0,
                "unit": "kWh",
                "estimated": True,
            },

            "potential_savings": {
                "value": 0,
                "unit": "kWh",
                "estimated": True,
            },

            "carbon": {
                "emissions": 0,
                "reduction": 0,
                "unit": "kg CO₂e",
                "estimated": True,
            },

            "recommendations": [
                {
                    "title": "Start an EC2 workload",
                    "description": (
                        "No running EC2 instances were detected "
                        "in the selected AWS region."
                    ),
                    "action": (
                        "Start a workload to begin collecting "
                        "CloudWatch utilization data."
                    ),
                    "priority": "low",
                }
            ],

            "instances": [],

            "trend": [],

            "data_status": (
                "Real AWS EC2 inventory. "
                "No running compute is currently available."
            ),

            "data_source": [
                "AWS EC2",
                "AWS CloudWatch"
            ],

            "estimates": [
                "Energy consumption",
                "Carbon emissions",
                "Potential savings"
            ],
        }

    # ========================================================
    # TIME RANGE
    # ========================================================

    now = datetime.now(
        timezone.utc
    )

    start_time = (
        now -
        timedelta(hours=hours)
    )

    # ========================================================
    # CLOUDWATCH QUERIES
    # ========================================================

    queries = []

    for index, instance in enumerate(
        running_instances
    ):

        queries.append({

            "Id": f"cpu{index}",

            "MetricStat": {

                "Metric": {

                    "Namespace":
                        "AWS/EC2",

                    "MetricName":
                        "CPUUtilization",

                    "Dimensions": [

                        {
                            "Name":
                                "InstanceId",

                            "Value":
                                instance["id"]
                        }

                    ]
                },

                "Period": 3600,

                "Stat": "Average",
            },

            "ReturnData": True,
        })

    # ========================================================
    # CLOUDWATCH DATA
    # ========================================================

    metric_response = (
        cloudwatch.get_metric_data(

            MetricDataQueries=queries,

            StartTime=start_time,

            EndTime=now,

            ScanBy="TimestampAscending",
        )
    )

    results = metric_response.get(
        "MetricDataResults",
        []
    )

    # ========================================================
    # PROCESS INSTANCE DATA
    # ========================================================

    cpu_values = []

    instance_analysis = []

    hourly_cpu = {}

    for result in results:

        values = result.get(
            "Values",
            []
        )

        timestamps = result.get(
            "Timestamps",
            []
        )

        if not values:
            continue

        numeric_values = [
            float(value)
            for value in values
        ]

        average_instance_cpu = round(
            sum(numeric_values)
            / len(numeric_values),
            2
        )

        cpu_values.extend(
            numeric_values
        )

        # ----------------------------------------------------
        # Identify instance
        # ----------------------------------------------------

        try:

            index = int(
                result["Id"].replace(
                    "cpu",
                    ""
                )
            )

            instance = running_instances[
                index
            ]

        except (
            ValueError,
            IndexError
        ):

            continue

        # ----------------------------------------------------
        # Per-instance energy estimate
        # ----------------------------------------------------

        estimated_kwh = calculate_instance_energy(
            instance.get("type"),
            average_instance_cpu,
            hours
        )

        instance_analysis.append({

            "instance_id":
                instance["id"],

            "instance_type":
                instance.get("type"),

            "average_cpu":
                average_instance_cpu,

            "estimated_power_watts":
                get_power_estimate(
                    instance.get("type")
                ),

            "estimated_energy_kwh":
                round(
                    estimated_kwh,
                    4
                ),

            "efficiency_score":
                calculate_efficiency_score(
                    average_instance_cpu
                ),

            "status":
                get_status(
                    average_instance_cpu
                ),
        })

        # ----------------------------------------------------
        # Build hourly trend
        # ----------------------------------------------------

        for timestamp, value in zip(
            timestamps,
            numeric_values
        ):

            try:

                timestamp_dt = timestamp

                if isinstance(
                    timestamp_dt,
                    str
                ):

                    timestamp_dt = (
                        datetime.fromisoformat(
                            timestamp_dt.replace(
                                "Z",
                                "+00:00"
                            )
                        )
                    )

                label = timestamp_dt.strftime(
                    "%H:%M"
                )

                if label not in hourly_cpu:
                    hourly_cpu[label] = []

                hourly_cpu[label].append(
                    value
                )

            except Exception:
                continue

    # ========================================================
    # NO CLOUDWATCH DATA
    # ========================================================

    if not cpu_values:

        return {
            "provider": "AWS",
            "region": region,

            "hours_analyzed": hours,

            "total_instances":
                len(instances),

            "running_instances":
                len(running_instances),

            "average_cpu": None,

            "energy_efficiency": None,
            "efficiency_score": None,

            "energy_intensity_index": None,

            "estimated_status":
                "Waiting for CloudWatch data",

            "measurement": (
                "Running EC2 instances were detected, "
                "but CloudWatch has not returned CPU "
                "utilization samples for the selected period yet."
            ),

            "energy_consumption": {
                "value": None,
                "unit": "kWh",
                "estimated": True,
            },

            "potential_savings": {
                "value": None,
                "unit": "kWh",
                "estimated": True,
            },

            "carbon": {
                "emissions": None,
                "reduction": None,
                "unit": "kg CO₂e",
                "estimated": True,
            },

            "recommendations": [
                {
                    "title": "Waiting for CloudWatch samples",
                    "description": (
                        "AWS EC2 instances are running, but "
                        "CPU utilization data is not available yet."
                    ),
                    "action": (
                        "Keep the instance running and refresh "
                        "after CloudWatch has collected samples."
                    ),
                    "priority": "medium",
                }
            ],

            "instances":
                instance_analysis,

            "trend": [],

            "data_status": (
                "Real AWS EC2 inventory was detected, "
                "but no CloudWatch CPU samples were returned."
            ),

            "data_source": [
                "AWS EC2",
                "AWS CloudWatch"
            ],

            "estimates": [
                "Energy consumption",
                "Carbon emissions",
                "Potential savings"
            ],
        }

    # ========================================================
    # GLOBAL CPU
    # ========================================================

    average_cpu = round(
        sum(cpu_values)
        / len(cpu_values),
        2
    )

    # ========================================================
    # EFFICIENCY
    # ========================================================

    efficiency_score = (
        calculate_efficiency_score(
            average_cpu
        )
    )

    status = get_status(
        average_cpu
    )

    intensity_index = (
        calculate_energy_intensity(
            average_cpu
        )
    )

    # ========================================================
    # ESTIMATED ENERGY CONSUMPTION
    # ========================================================

    total_energy_kwh = 0

    for instance in instance_analysis:

        total_energy_kwh += (
            instance[
                "estimated_energy_kwh"
            ]
        )

    total_energy_kwh = round(
        total_energy_kwh,
        4
    )

    # ========================================================
    # POTENTIAL ENERGY SAVINGS
    # ========================================================
    #
    # We estimate that reducing avoidable underutilization
    # could save a portion of the estimated energy.
    #
    # This is deliberately conservative.
    # ========================================================

    if average_cpu < 10:

        savings_percentage = 0.30

    elif average_cpu < 25:

        savings_percentage = 0.20

    elif average_cpu < 40:

        savings_percentage = 0.10

    else:

        savings_percentage = 0.03

    potential_savings_kwh = round(
        total_energy_kwh *
        savings_percentage,
        4
    )

    # ========================================================
    # CARBON ESTIMATE
    # ========================================================

    carbon_emissions = round(
        total_energy_kwh *
        DEFAULT_CARBON_INTENSITY,
        4
    )

    potential_carbon_reduction = round(
        potential_savings_kwh *
        DEFAULT_CARBON_INTENSITY,
        4
    )

    # ========================================================
    # TREND
    # ========================================================

    trend = []

    for label, values in hourly_cpu.items():

        hourly_average = (
            sum(values)
            / len(values)
        )

        hourly_score = (
            calculate_efficiency_score(
                hourly_average
            )
        )

        trend.append({

            "label": label,

            "average_cpu": round(
                hourly_average,
                2
            ),

            "efficiency": hourly_score,

            "value": hourly_score,
        })

    # ========================================================
    # GLOBAL RECOMMENDATIONS
    # ========================================================

    recommendations = []

    for instance in instance_analysis:

        recommendations.extend(
            recommendation_for_instance(
                {
                    "id":
                        instance["instance_id"],

                    "type":
                        instance["instance_type"],
                },
                instance["average_cpu"]
            )
        )

    # --------------------------------------------------------
    # Overall recommendations
    # --------------------------------------------------------

    if average_cpu < 10:

        recommendations.append({

            "title":
                "High idle capacity detected",

            "description":
                "The infrastructure is spending most of its time at very low CPU utilization.",

            "action":
                "Evaluate right-sizing, scheduled scaling, or automatic start/stop policies.",

            "priority":
                "high",
        })

    elif average_cpu < 25:

        recommendations.append({

            "title":
                "Review compute sizing",

            "description":
                "Average utilization suggests that some allocated capacity may not be required.",

            "action":
                "Compare workload requirements against the current EC2 instance sizes.",

            "priority":
                "medium",
        })

    elif average_cpu < 75:

        recommendations.append({

            "title":
                "Maintain current utilization",

            "description":
                "The observed workload is operating within a generally efficient utilization range.",

            "action":
                "Continue monitoring utilization before making infrastructure changes.",

            "priority":
                "low",
        })

    else:

        recommendations.append({

            "title":
                "Monitor capacity pressure",

            "description":
                "CPU utilization is high enough that workload growth could affect performance.",

            "action":
                "Review autoscaling thresholds and consider additional capacity if demand increases.",

            "priority":
                "medium",
        })

    # Remove duplicate recommendation titles.
    unique_recommendations = []

    seen_titles = set()

    for recommendation in recommendations:

        title = recommendation["title"]

        if title not in seen_titles:

            seen_titles.add(title)

            unique_recommendations.append(
                recommendation
            )

    # Keep the UI manageable.
    unique_recommendations = (
        unique_recommendations[:8]
    )

    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return {

        "provider":
            "AWS",

        "region":
            region,

        "hours_analyzed":
            hours,

        "total_instances":
            len(instances),

        "running_instances":
            len(running_instances),

        # ----------------------------------------------------
        # Core metrics
        # ----------------------------------------------------

        "average_cpu":
            average_cpu,

        "energy_efficiency":
            efficiency_score,

        "efficiency_score":
            efficiency_score,

        "energy_intensity_index":
            intensity_index,

        "estimated_status":
            status,

        # ----------------------------------------------------
        # Energy
        # ----------------------------------------------------

        "energy_consumption": {

            "value":
                total_energy_kwh,

            "unit":
                "kWh",

            "estimated":
                True,
        },

        "estimated_energy_kwh":
            total_energy_kwh,

        "potential_savings": {

            "value":
                potential_savings_kwh,

            "unit":
                "kWh",

            "estimated":
                True,
        },

        "potential_energy_savings":
            potential_savings_kwh,

        # ----------------------------------------------------
        # Carbon
        # ----------------------------------------------------

        "carbon": {

            "emissions":
                carbon_emissions,

            "reduction":
                potential_carbon_reduction,

            "unit":
                "kg CO₂e",

            "estimated":
                True,

            "carbon_intensity":
                DEFAULT_CARBON_INTENSITY,
        },

        "estimated_carbon_kg":
            carbon_emissions,

        "potential_carbon_reduction":
            potential_carbon_reduction,

        # ----------------------------------------------------
        # Workload data
        # ----------------------------------------------------

        "instances":
            instance_analysis,

        "trend":
            trend,

        # ----------------------------------------------------
        # Recommendations
        # ----------------------------------------------------

        "recommendations":
            unique_recommendations,

        # ----------------------------------------------------
        # Transparency
        # ----------------------------------------------------

        "measurement": (
            "CPU utilization and EC2 inventory are real AWS "
            "telemetry. Energy consumption, carbon emissions "
            "and savings are derived planning estimates because "
            "standard EC2/CloudWatch metrics do not directly "
            "measure physical electricity usage."
        ),

        "data_status": (
            "Energy efficiency calculated from real AWS "
            "CloudWatch CPU utilization."
        ),

        "data_source": [
            "AWS EC2",
            "AWS CloudWatch"
        ],

        "estimates": [
            "Energy consumption",
            "Carbon emissions",
            "Potential savings"
        ],

        "carbon_method": (
            "Estimated energy consumption multiplied by a "
            "planning carbon-intensity assumption."
        ),

        "carbon_intensity_assumption":
            DEFAULT_CARBON_INTENSITY,
    }