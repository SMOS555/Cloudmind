import boto3

from datetime import datetime, timedelta, timezone


DEFAULT_REGION = "ap-south-1"


# ============================================================
# AWS SESSION
# ============================================================

def get_aws_session(
    role_arn=None,
    external_id=None,
    aws_access_key_id=None,
    aws_secret_access_key=None,
    aws_session_token=None,
    region=None
):
    """
    Create an AWS session.

    If custom aws_access_key_id and aws_secret_access_key are provided,
    creates a session using those credentials.

    If role_arn is supplied, CloudMind assumes that role using STS
    and returns a session for the connected/customer AWS account.

    If no custom keys or role_arn are supplied, the backend's normal AWS credentials
    from environment variables or boto3 defaults are used.
    """
    if aws_access_key_id and aws_secret_access_key:
        kwargs = {
            "aws_access_key_id": aws_access_key_id.strip(),
            "aws_secret_access_key": aws_secret_access_key.strip(),
        }
        if aws_session_token and aws_session_token.strip():
            kwargs["aws_session_token"] = aws_session_token.strip()
        if region and region.strip():
            kwargs["region_name"] = region.strip()
        return boto3.Session(**kwargs)

    if not role_arn:
        kwargs = {}
        if region and region.strip():
            kwargs["region_name"] = region.strip()
        return boto3.Session(**kwargs)

    sts = boto3.client("sts")

    assume_role_params = {
        "RoleArn": role_arn,
        "RoleSessionName": "CloudMindSession",
    }

    if external_id:
        assume_role_params["ExternalId"] = external_id

    response = sts.assume_role(**assume_role_params)

    credentials = response["Credentials"]

    kwargs = {
        "aws_access_key_id": credentials["AccessKeyId"],
        "aws_secret_access_key": credentials["SecretAccessKey"],
        "aws_session_token": credentials["SessionToken"],
    }
    if region and region.strip():
        kwargs["region_name"] = region.strip()

    return boto3.Session(**kwargs)


# ============================================================
# GET CONNECTED AWS ACCOUNT INFORMATION
# ============================================================

def get_aws_account(
    role_arn=None,
    external_id=None,
    aws_access_key_id=None,
    aws_secret_access_key=None,
    aws_session_token=None,
    region=None
):
    """
    Return the AWS account currently being inspected.

    If role_arn is provided, the identity belongs to the
    connected/customer account.
    """

    session = get_aws_session(
        role_arn=role_arn,
        external_id=external_id,
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
        aws_session_token=aws_session_token,
        region=region
    )

    sts = session.client("sts")

    identity = sts.get_caller_identity()

    return {
        "account_id": identity["Account"],
        "arn": identity["Arn"],
        "user_id": identity["UserId"],
        "connected_via_role": bool(role_arn),
        "role_arn": role_arn,
    }


# ============================================================
# GET EC2 INSTANCES
# ============================================================

def get_ec2_instances(
    region=DEFAULT_REGION,
    role_arn=None,
    external_id=None,
    aws_access_key_id=None,
    aws_secret_access_key=None,
    aws_session_token=None
):
    """
    Get EC2 instances from the selected AWS account and region.
    """

    session = get_aws_session(
        role_arn=role_arn,
        external_id=external_id,
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
        aws_session_token=aws_session_token,
        region=region
    )

    ec2 = session.client(
        "ec2",
        region_name=region
    )

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

                    "id":
                        instance["InstanceId"],

                    "type":
                        instance.get(
                            "InstanceType"
                        ),

                    "state":
                        instance["State"]["Name"],

                    "region":
                        region,

                    "private_ip":
                        instance.get(
                            "PrivateIpAddress"
                        ),

                    "public_ip":
                        instance.get(
                            "PublicIpAddress"
                        ),

                    "availability_zone":
                        instance.get(
                            "Placement",
                            {}
                        ).get(
                            "AvailabilityZone"
                        ),

                    "launch_time":
                        (
                            instance.get(
                                "LaunchTime"
                            ).isoformat()
                            if instance.get(
                                "LaunchTime"
                            )
                            else None
                        ),

                    "vpc_id":
                        instance.get(
                            "VpcId"
                        ),

                    "subnet_id":
                        instance.get(
                            "SubnetId"
                        ),
                })

    running_instances = [
        instance
        for instance in instances
        if instance["state"] == "running"
    ]

    return {

        "provider":
            "AWS",

        "region":
            region,

        "total_instances":
            len(instances),

        "running_instances":
            len(running_instances),

        "instances":
            instances,

    }


# ============================================================
# GET REAL AWS CPU + CLOUDWATCH DATA
# ============================================================

def get_ec2_cpu_metrics(
    region=DEFAULT_REGION,
    history_hours=7,
    role_arn=None,
    external_id=None,
    aws_access_key_id=None,
    aws_secret_access_key=None,
    aws_session_token=None
):

    """
    Get real EC2 CPU utilization from CloudWatch.

    Works against either:
    - Custom AWS credentials passed from user
    - CloudMind's own AWS credentials from environment
    - A customer's AWS account through STS AssumeRole
    """

    session = get_aws_session(
        role_arn=role_arn,
        external_id=external_id,
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
        aws_session_token=aws_session_token,
        region=region
    )

    ec2 = session.client(
        "ec2",
        region_name=region
    )

    cloudwatch = session.client(
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

                    "id":
                        instance["InstanceId"],

                    "type":
                        instance.get(
                            "InstanceType"
                        ),

                    "state":
                        instance["State"]["Name"],

                    "region":
                        region,

                    "private_ip":
                        instance.get(
                            "PrivateIpAddress"
                        ),

                    "public_ip":
                        instance.get(
                            "PublicIpAddress"
                        ),

                    "availability_zone":
                        instance.get(
                            "Placement",
                            {}
                        ).get(
                            "AvailabilityZone"
                        ),

                    "launch_time":
                        (
                            instance.get(
                                "LaunchTime"
                            ).isoformat()
                            if instance.get(
                                "LaunchTime"
                            )
                            else None
                        ),

                    "vpc_id":
                        instance.get(
                            "VpcId"
                        ),

                    "subnet_id":
                        instance.get(
                            "SubnetId"
                        ),
                })

    running_instances = [
        instance
        for instance in instances
        if instance["state"] == "running"
    ]

    total_instances = len(instances)

    running_count = len(
        running_instances
    )

    # ========================================================
    # NO RUNNING INSTANCES
    # ========================================================

    if not running_instances:

        return {

            "provider":
                "AWS",

            "region":
                region,

            "total_instances":
                total_instances,

            "running_instances":
                0,

            "cpu_usage":
                None,

            "cpu_history":
                [],

            "instances":
                [
                    {
                        **instance,
                        "cpu_utilization":
                            None,
                    }

                    for instance in instances
                ],

            "cloudwatch_status":
                "No running EC2 instances",

            "data_status":
                "No running EC2 instances are available for CloudWatch CPU monitoring.",

        }

    # ========================================================
    # CURRENT CPU DATA
    #
    # Last 30 minutes
    # 5 minute periods
    # ========================================================

    now = datetime.now(
        timezone.utc
    )

    current_start = (
        now - timedelta(
            minutes=30
        )
    )

    current_queries = []

    for index, instance in enumerate(
        running_instances
    ):

        current_queries.append({

            "Id":
                f"cpu{index}",

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
                                instance["id"],
                        }

                    ],
                },

                "Period":
                    300,

                "Stat":
                    "Average",

            },

            "ReturnData":
                True,

        })

    current_response = (
        cloudwatch.get_metric_data(

            MetricDataQueries=
                current_queries,

            StartTime=
                current_start,

            EndTime=
                now,

            ScanBy=
                "TimestampDescending",

        )
    )

    # ========================================================
    # CURRENT CPU VALUES
    # ========================================================

    current_cpu_by_instance = {}

    current_cpu_values = []

    for result in current_response.get(
        "MetricDataResults",
        []
    ):

        timestamps = result.get(
            "Timestamps",
            []
        )

        values = result.get(
            "Values",
            []
        )

        if not timestamps or not values:
            continue

        latest_index = max(
            range(len(timestamps)),
            key=lambda i:
                timestamps[i]
        )

        value = round(
            float(
                values[latest_index]
            ),
            2
        )

        current_cpu_values.append(
            value
        )

        query_id = result.get(
            "Id",
            ""
        )

        try:

            index = int(
                query_id.replace(
                    "cpu",
                    ""
                )
            )

            instance_id = (
                running_instances[index]["id"]
            )

            current_cpu_by_instance[
                instance_id
            ] = value

        except (
            ValueError,
            IndexError
        ):

            continue

    # ========================================================
    # HISTORICAL CPU DATA
    #
    # Last N hours
    # 1 hour periods
    # ========================================================

    history_start = (
        now - timedelta(
            hours=history_hours
        )
    )

    history_queries = []

    for index, instance in enumerate(
        running_instances
    ):

        history_queries.append({

            "Id":
                f"hist{index}",

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
                                instance["id"],
                        }

                    ],
                },

                "Period":
                    3600,

                "Stat":
                    "Average",

            },

            "ReturnData":
                True,

        })

    history_response = (
        cloudwatch.get_metric_data(

            MetricDataQueries=
                history_queries,

            StartTime=
                history_start,

            EndTime=
                now,

            ScanBy=
                "TimestampAscending",

        )
    )

    # ========================================================
    # BUILD HISTORY
    # ========================================================

    history_points = {}

    for result in history_response.get(
        "MetricDataResults",
        []
    ):

        timestamps = result.get(
            "Timestamps",
            []
        )

        values = result.get(
            "Values",
            []
        )

        for timestamp, value in zip(
            timestamps,
            values
        ):

            timestamp_key = (
                timestamp
                .replace(
                    minute=0,
                    second=0,
                    microsecond=0
                )
                .isoformat()
            )

            if timestamp_key not in history_points:

                history_points[
                    timestamp_key
                ] = []

            history_points[
                timestamp_key
            ].append(
                float(value)
            )

    sorted_history = []

    for timestamp in sorted(
        history_points.keys()
    ):

        values = history_points[
            timestamp
        ]

        if values:

            average = (
                sum(values)
                / len(values)
            )

            sorted_history.append(
                round(
                    average,
                    2
                )
            )

    # ========================================================
    # FALLBACK HISTORY
    # ========================================================

    if (
        not sorted_history
        and current_cpu_values
    ):

        sorted_history = [
            round(
                sum(
                    current_cpu_values
                )
                / len(
                    current_cpu_values
                ),
                2
            )
        ]

    # ========================================================
    # CURRENT AVERAGE CPU
    # ========================================================

    if current_cpu_values:

        average_cpu = round(
            sum(
                current_cpu_values
            )
            / len(
                current_cpu_values
            ),
            2
        )

    elif sorted_history:

        average_cpu = (
            sorted_history[-1]
        )

    else:

        average_cpu = None

    # ========================================================
    # ADD CPU TO EACH INSTANCE
    # ========================================================

    enriched_instances = []

    for instance in instances:

        enriched_instances.append({

            **instance,

            "cpu_utilization":
                current_cpu_by_instance.get(
                    instance["id"]
                )
                if instance["state"]
                == "running"
                else None,

        })

    # ========================================================
    # CLOUDWATCH STATUS
    # ========================================================

    if current_cpu_values:

        cloudwatch_status = "Connected"

        data_status = (
            "Live EC2 CPU metrics retrieved "
            "from AWS CloudWatch."
        )

    else:

        cloudwatch_status = (
            "Connected - no recent data"
        )

        data_status = (
            "EC2 instances are running, "
            "but CloudWatch has no recent "
            "CPU datapoints."
        )

    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return {

        "provider":
            "AWS",

        "region":
            region,

        "total_instances":
            total_instances,

        "running_instances":
            running_count,

        "cpu_usage":
            average_cpu,

        "cpu_history":
            sorted_history,

        "cloudwatch_status":
            cloudwatch_status,

        "data_status":
            data_status,

        "instances":
            enriched_instances,

        "connected_via_role":
            bool(role_arn),

        "role_arn":
            role_arn,

    }