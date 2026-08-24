import random
from datetime import datetime


def get_cloud_metrics():

    servers = [
        {
            "id": "VM-001",
            "provider": "AWS",
            "region": "ap-south-1",
            "cpu": random.randint(35, 85),
            "memory": random.randint(40, 80),
            "network": random.randint(30, 90),
            "status": "healthy"
        },
        {
            "id": "VM-002",
            "provider": "Azure",
            "region": "Central India",
            "cpu": random.randint(20, 95),
            "memory": random.randint(30, 90),
            "network": random.randint(20, 80),
            "status": "healthy"
        },
        {
            "id": "VM-003",
            "provider": "GCP",
            "region": "asia-south1",
            "cpu": random.randint(25, 90),
            "memory": random.randint(35, 85),
            "network": random.randint(25, 95),
            "status": "healthy"
        },
        {
            "id": "VM-004",
            "provider": "AWS",
            "region": "ap-south-1",
            "cpu": random.randint(60, 98),
            "memory": random.randint(50, 95),
            "network": random.randint(50, 98),
            "status": "warning"
        }
    ]

    # Average resource usage
    avg_cpu = round(
        sum(server["cpu"] for server in servers) / len(servers)
    )

    avg_memory = round(
        sum(server["memory"] for server in servers) / len(servers)
    )

    avg_network = round(
        sum(server["network"] for server in servers) / len(servers)
    )

    # Warning servers
    warning_servers = sum(
        1 for server in servers
        if server["status"] == "warning"
    )

    # Cloud health
    cloud_health = max(
        0,
        min(
            100,
            100 - (warning_servers * 10) - max(0, avg_cpu - 70)
        )
    )

    # Security score
    security_score = max(
        0,
        100 - (warning_servers * 5)
    )

    # Energy efficiency
    energy_efficiency = max(
        0,
        min(
            100,
            100 - round(avg_cpu * 0.25)
        )
    )

    # Monthly cost
    monthly_cost = 42300 + (avg_cpu * 100)

    # Provider counts
    provider_counts = {
        "aws": 0,
        "azure": 0,
        "gcp": 0
    }

    for server in servers:

        provider = server["provider"].lower()

        if provider == "aws":
            provider_counts["aws"] += 1

        elif provider == "azure":
            provider_counts["azure"] += 1

        elif provider == "gcp":
            provider_counts["gcp"] += 1

    total_servers = len(servers)

    provider_percentages = {
        "aws": round(provider_counts["aws"] / total_servers * 100),
        "azure": round(provider_counts["azure"] / total_servers * 100),
        "gcp": round(provider_counts["gcp"] / total_servers * 100)
    }

    # Infrastructure status
    infrastructure = {
        "compute": "Warning" if warning_servers > 0 else "Healthy",

        "database": "Healthy",

        "network": "Warning" if avg_network > 80 else "Healthy",

        "security": (
            f"{warning_servers} Issues"
            if warning_servers > 0
            else "Healthy"
        )
    }

    # Final response
    return {
        "timestamp": datetime.now().isoformat(),

        "cloud_health": cloud_health,

        "monthly_cost": monthly_cost,

        "energy_efficiency": energy_efficiency,

        "security_score": security_score,

        "cpu_usage": avg_cpu,

        "memory_usage": avg_memory,

        "network_usage": avg_network,

        "total_servers": total_servers,

        "providers": provider_percentages,

        "infrastructure": infrastructure,

        "servers": servers
    }