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

    return {
        "timestamp": datetime.now().isoformat(),

        "total_servers": len(servers),

        "servers": servers
    }