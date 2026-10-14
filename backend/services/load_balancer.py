def analyze_load(servers):

    # ==========================================
    # EMPTY SERVER CHECK
    # ==========================================

    if not servers:

        return {
            "servers": [],
            "average_cpu": 0,
            "average_ram": 0,
            "total_traffic": 0,
            "overall_status": "No Servers",
            "recommendations": [],
        }


    # ==========================================
    # TOTALS
    # ==========================================

    total_cpu = sum(
        float(server.get("cpu", 0.0))
        for server in servers
    )

    total_ram = sum(
        float(server.get("ram", 0.0))
        for server in servers
    )

    total_traffic = sum(
        float(server.get("traffic", 0.0))
        for server in servers
    )


    # ==========================================
    # AVERAGES
    # ==========================================

    average_cpu = (
        total_cpu / len(servers)
    )

    average_ram = (
        total_ram / len(servers)
    )


    # ==========================================
    # ANALYZE EACH SERVER
    # ==========================================

    results = []

    for server in servers:

        cpu = round(float(server.get("cpu", 0.0)), 1)
        ram = round(float(server.get("ram", 0.0)), 1)
        traffic = round(float(server.get("traffic", 0.0)), 2)

        if cpu >= 85 or ram >= 85:

            status = "Overloaded"

        elif cpu >= 70 or ram >= 70:

            status = "High Load"

        else:

            status = "Healthy"


        results.append({

            "id": server["id"],
            "type": server.get("type") or server.get("instance_type", "ec2"),
            "cpu": cpu,
            "ram": ram,
            "traffic": traffic,
            "ram_source": server.get("ram_source", "Connected"),
            "status": status,

        })


    # ==========================================
    # FIND SERVER GROUPS
    # ==========================================

    overloaded_servers = [

        server
        for server in results

        if server["status"] == "Overloaded"

    ]


    healthy_servers = [

        server
        for server in results

        if server["status"] == "Healthy"

    ]


    # ==========================================
    # LOAD BALANCING RECOMMENDATIONS
    # ==========================================

    recommendations = []


    for overloaded in overloaded_servers:

        if healthy_servers:

            target = min(

                healthy_servers,

                key=lambda s: (s["cpu"] * 0.5 + s["ram"] * 0.5)

            )


            recommendations.append({

                "from":
                    overloaded["id"],

                "to":
                    target["id"],

                "message":
                    (
                        f"Redistribute workload from {overloaded['id']} "
                        f"(CPU {overloaded['cpu']}%, RAM {overloaded['ram']}%) "
                        f"to target node {target['id']} "
                        f"(CPU {target['cpu']}%, RAM {target['ram']}%)"
                    ),

            })


    # ==========================================
    # OVERALL STATUS
    # ==========================================

    if average_cpu > 80 or average_ram > 80:

        overall_status = "Critical"

    elif average_cpu > 65 or average_ram > 65:

        overall_status = "High Load"

    else:

        overall_status = "Balanced"


    # ==========================================
    # FINAL RESULT
    # ==========================================

    return {

        "servers":
            results,

        "average_cpu":
            round(average_cpu, 2),

        "average_ram":
            round(average_ram, 2),

        "total_traffic":
            round(total_traffic, 2),

        "overall_status":
            overall_status,

        "recommendations":
            recommendations,

    }