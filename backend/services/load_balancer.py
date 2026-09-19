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
        server["cpu"]
        for server in servers
    )

    total_ram = sum(
        server["ram"]
        for server in servers
    )

    total_traffic = sum(
        server["traffic"]
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

        cpu = server["cpu"]
        ram = server["ram"]
        traffic = server["traffic"]


        if cpu >= 85 or ram >= 85:

            status = "Overloaded"

        elif cpu >= 70 or ram >= 70:

            status = "High Load"

        else:

            status = "Healthy"


        results.append({

            "id": server["id"],

            "cpu": cpu,

            "ram": ram,

            "traffic": traffic,

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

                key=lambda server:
                    server["cpu"]

            )


            recommendations.append({

                "from":
                    overloaded["id"],

                "to":
                    target["id"],

                "message":
                    (
                        f"Redistribute workload from "
                        f"{overloaded['id']} to "
                        f"{target['id']}"
                    ),

            })


    # ==========================================
    # OVERALL STATUS
    # ==========================================

    if average_cpu > 80:

        overall_status = "Critical"

    elif average_cpu > 65:

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
            total_traffic,

        "overall_status":
            overall_status,

        "recommendations":
            recommendations,

    }