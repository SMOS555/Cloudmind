import boto3

from datetime import datetime, timedelta, timezone


def get_aws_cost_data(
    region="ap-south-1",
    history_days=30
):
    """
    Retrieve AWS cost data using Cost Explorer.

    Cost Explorer is a global AWS service, so
    region is only included in the response for
    CloudMind display purposes.
    """

    ce = boto3.client("ce", region_name="us-east-1")

    end_date = datetime.now(
        timezone.utc
    ).date()

    start_date = (
        end_date -
        timedelta(days=history_days)
    )

    response = ce.get_cost_and_usage(
        TimePeriod={
            "Start": start_date.isoformat(),
            "End": end_date.isoformat(),
        },
        Granularity="MONTHLY",
        Metrics=[
            "UnblendedCost"
        ],
        GroupBy=[
            {
                "Type": "DIMENSION",
                "Key": "SERVICE",
            }
        ],
    )

    monthly_cost = 0
    services = []

    results = response.get(
        "ResultsByTime",
        []
    )

    for period in results:

        groups = period.get(
            "Groups",
            []
        )

        for group in groups:

            service_name = (
                group["Keys"][0]
                if group.get("Keys")
                else "Unknown"
            )

            amount = float(
                group["Metrics"]
                ["UnblendedCost"]
                ["Amount"]
            )

            monthly_cost += amount

            if amount > 0:

                services.append({
                    "name": service_name,
                    "cost": round(
                        amount,
                        2
                    )
                })

    services.sort(
        key=lambda item: item["cost"],
        reverse=True
    )

    # Simple optimization estimate.
    # This is an estimate, NOT an actual AWS
    # savings figure.

    estimated_savings = round(
        monthly_cost * 0.10,
        2
    )

    return {
        "provider": "AWS",

        "region": region,

        "status": "Connected",

        "currency": "USD",

        "monthly_cost": round(
            monthly_cost,
            2
        ),

        "estimated_savings": estimated_savings,

        "services": services,

        "data_status":
            "Real AWS Cost Explorer data"
    }