from services.aws_services import get_ec2_cpu_metrics


# ==========================================
# ANALYZE CPU TREND
# ==========================================

def analyze_cpu_trend(history):

    if not history or len(history) < 2:
        return "Insufficient data for trend analysis."

    first = history[0]
    last = history[-1]

    difference = last - first

    if difference > 10:
        return (
            f"CPU utilization is increasing. "
            f"It increased by approximately "
            f"{round(difference, 2)} percentage points."
        )

    if difference < -10:
        return (
            f"CPU utilization is decreasing. "
            f"It decreased by approximately "
            f"{round(abs(difference), 2)} percentage points."
        )

    return (
        "CPU utilization is relatively stable "
        "over the observed period."
    )


# ==========================================
# CPU PREDICTION
# ==========================================

def predict_cpu(history):

    if not history:
        return "Insufficient data for prediction."

    if len(history) < 3:
        return "More CloudWatch history is required."

    recent = history[-3:]

    average_recent = (
        sum(recent) / len(recent)
    )

    if average_recent >= 80:
        return (
            "CPU utilization is currently high. "
            "The workload may require scaling "
            "or optimization if this continues."
        )

    if average_recent >= 60:
        return (
            "CPU utilization is moderately high. "
            "Continue monitoring the workload "
            "for sustained increases."
        )

    return (
        "CPU utilization is currently within "
        "a relatively healthy range."
    )


# ==========================================
# RECOMMENDATION ENGINE
# ==========================================

def generate_recommendation(
    cpu_usage,
    running_instances,
    total_instances
):

    if total_instances == 0:

        return (
            "No EC2 instances are currently "
            "available. Add or start an instance "
            "before performing workload analysis."
        )

    if running_instances == 0:

        return (
            "There are no running EC2 instances. "
            "Review stopped resources and determine "
            "whether they are still required."
        )

    if cpu_usage is None:

        return (
            "CPU utilization data is unavailable. "
            "Verify that CloudWatch monitoring "
            "data is being collected."
        )

    if cpu_usage >= 80:

        return (
            "CPU utilization is high. Consider "
            "investigating the workload and using "
            "Auto Scaling or a larger instance type "
            "if high utilization is sustained."
        )

    if cpu_usage <= 20:

        return (
            "CPU utilization is low. Consider "
            "reviewing instance sizing and workload "
            "requirements to identify potential "
            "optimization opportunities."
        )

    return (
        "Current CPU utilization appears healthy. "
        "Continue monitoring the workload for "
        "significant changes."
    )


# ==========================================
# GET ADVANCED ANALYTICS
# ==========================================

def get_advanced_analytics(
    region="ap-south-1"
):

    # ------------------------------------------
    # GET REAL AWS DATA
    # ------------------------------------------

    aws_data = get_ec2_cpu_metrics(
        region=region
    )

    total_instances = aws_data.get(
        "total_instances",
        0
    )

    running_instances = aws_data.get(
        "running_instances",
        0
    )

    cpu_usage = aws_data.get(
        "cpu_usage"
    )

    cpu_history = aws_data.get(
        "cpu_history",
        []
    )

    instances = aws_data.get(
        "instances",
        []
    )

    # ------------------------------------------
    # ANALYSIS
    # ------------------------------------------

    trend = analyze_cpu_trend(
        cpu_history
    )

    prediction = predict_cpu(
        cpu_history
    )

    recommendation = generate_recommendation(
        cpu_usage,
        running_instances,
        total_instances
    )

    # ------------------------------------------
    # CPU STATUS
    # ------------------------------------------

    if cpu_usage is None:

        cpu_status = "No Data"

    elif cpu_usage >= 80:

        cpu_status = "High"

    elif cpu_usage >= 50:

        cpu_status = "Moderate"

    else:

        cpu_status = "Healthy"

    # ------------------------------------------
    # RETURN ANALYTICS
    # ------------------------------------------

    return {

        "provider": "AWS",

        "region": aws_data.get(
            "region",
            region
        ),

        "cpu_usage": cpu_usage,

        "cpu_history": cpu_history,

        "total_instances":
            total_instances,

        "running_instances":
            running_instances,

        "cpu_status":
            cpu_status,

        "instances":
            instances,

        "analysis": {

            "trend":
                trend,

            "prediction":
                prediction,

            "recommendation":
                recommendation
        },

        "data_source":
            "AWS CloudWatch"
    }