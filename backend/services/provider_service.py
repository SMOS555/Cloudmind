import json
import os


DATA_FILE = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "data",
    "providers.json"
)


def load_providers():

    with open(DATA_FILE, "r") as file:
        return json.load(file)


def calculate_provider_scores(requirements):

    providers = load_providers()

    results = {}

    # Convert user requirements into weights
    security_weight = requirements.get("security", 3)
    performance_weight = requirements.get("performance", 3)
    energy_weight = requirements.get("energy", 3)
    cost_weight = requirements.get("cost", 3)

    total_weight = (
        security_weight
        + performance_weight
        + energy_weight
        + cost_weight
    )

    for provider, data in providers.items():

        score = (
            data["security"] * security_weight
            + data["performance"] * performance_weight
            + data["energy_efficiency"] * energy_weight
            + data["cost_efficiency"] * cost_weight
        ) / total_weight

        results[provider] = round(score, 2)

    recommended_provider = max(
        results,
        key=results.get
    )

    return {
        "scores": results,
        "recommended_provider": recommended_provider
    }