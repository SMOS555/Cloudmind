"""
CloudMind AI - Hybrid RAG (Retrieval-Augmented Generation) Service
Authoritative Cloud Compliance, FinOps, GreenOps, and DevSecOps Knowledge Base
with high-speed in-memory semantic retrieval and vector similarity scoring.
"""

import re
import math
from typing import List, Dict, Any, Optional

CLOUD_KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    {
        "id": "CIS-AWS-5.2",
        "title": "CIS AWS Benchmark 5.2 - Security Group SSH Exposure",
        "category": "Security and Compliance",
        "standard": "CIS AWS Foundations Benchmark v3.0",
        "severity": "High",
        "keywords": ["ssh", "port 22", "security group", "0.0.0.0/0", "ingress", "open port", "insecure", "vulnerability"],
        "content": (
            "CIS AWS Benchmark 5.2 mandates: Ensure no security groups allow ingress from 0.0.0.0/0 to port 22 (SSH).\n"
            "Rationale: Unrestricted access to remote administration ports increases exposure to brute-force and remote exploit attacks.\n"
            "Audit Procedure: Run `aws ec2 describe-security-groups --filters Name=ip-permission.from-port,Values=22 Name=ip-permission.cidr,Values='0.0.0.0/0'`.\n"
            "Remediation Procedure: Revoke unrestricted ingress and restrict access to a bastion host or corporate VPN CIDR block:\n"
            "```bash\n"
            "aws ec2 revoke-security-group-ingress --group-id SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0\n"
            "aws ec2 authorize-security-group-ingress --group-id SG_ID --protocol tcp --port 22 --cidr CORP_IP/32\n"
            "```"
        )
    },
    {
        "id": "CIS-AWS-5.3",
        "title": "CIS AWS Benchmark 5.3 - Security Group RDP Exposure",
        "category": "Security and Compliance",
        "standard": "CIS AWS Foundations Benchmark v3.0",
        "severity": "High",
        "keywords": ["rdp", "port 3389", "windows", "remote desktop", "security group", "0.0.0.0/0"],
        "content": (
            "CIS AWS Benchmark 5.3 mandates: Ensure no security groups allow ingress from 0.0.0.0/0 to port 3389 (RDP).\n"
            "Rationale: Open Remote Desktop Protocol ports on public IPv4 addresses are actively scanned and targeted by automated ransomware.\n"
            "Remediation Procedure:\n"
            "```bash\n"
            "aws ec2 revoke-security-group-ingress --group-id SG_ID --protocol tcp --port 3389 --cidr 0.0.0.0/0\n"
            "```\n"
            "Best Practice: Use AWS Systems Manager (SSM) Fleet Manager or Session Manager for secure, port-less remote access."
        )
    },
    {
        "id": "CIS-AWS-2.1.1",
        "title": "CIS AWS Benchmark 2.1.1 - S3 Bucket Server-Side Encryption",
        "category": "Data Protection",
        "standard": "CIS AWS Foundations Benchmark v3.0",
        "severity": "Medium",
        "keywords": ["s3", "encryption", "bucket", "kms", "sse-s3", "unencrypted", "data protection"],
        "content": (
            "CIS AWS Benchmark 2.1.1 mandates: Ensure all S3 Buckets have Default Encryption (SSE-S3 or SSE-KMS) enabled.\n"
            "Rationale: Default encryption ensures that data stored at rest in Amazon S3 is automatically encrypted at the object level.\n"
            "Remediation Procedure:\n"
            "```bash\n"
            "aws s3api put-bucket-encryption --bucket BUCKET_NAME --server-side-encryption-configuration '{\"Rules\": [{\"ApplyServerSideEncryptionByDefault\": {\"SSEAlgorithm\": \"AES256\"}}]}'\n"
            "```"
        )
    },
    {
        "id": "CIS-AWS-2.1.5",
        "title": "CIS AWS Benchmark 2.1.5 - S3 Block Public Access (Account and Bucket)",
        "category": "Data Protection",
        "standard": "CIS AWS Foundations Benchmark v3.0",
        "severity": "Critical",
        "keywords": ["s3", "public bucket", "block public access", "data leak", "acl", "bucket policy"],
        "content": (
            "CIS AWS Benchmark 2.1.5 mandates: Ensure S3 Block Public Access is enforced at both bucket and account levels.\n"
            "Rationale: Prevents accidental data exposure through misconfigured public ACLs or bucket policies.\n"
            "Remediation Procedure:\n"
            "```bash\n"
            "aws s3control put-public-access-block --account-id ACCOUNT_ID --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true\n"
            "```"
        )
    },
    {
        "id": "CIS-AWS-1.16",
        "title": "CIS AWS Benchmark 1.16 - IAM MFA Requirement",
        "category": "Identity and Access Management",
        "standard": "CIS AWS Foundations Benchmark v3.0",
        "severity": "High",
        "keywords": ["iam", "mfa", "root", "multi-factor", "credentials", "access key", "login"],
        "content": (
            "CIS AWS Benchmark 1.16 mandates: Multi-Factor Authentication (MFA) must be enabled for all IAM users with console access, and 1.5 mandates MFA on root.\n"
            "Rationale: Single-factor passwords can be compromised via phishing or credential stuffing.\n"
            "Remediation: Enforce an IAM Policy denying all actions unless aws:MultiFactorAuthPresent is true."
        )
    },
    {
        "id": "CIS-AWS-5.6",
        "title": "CIS AWS Benchmark 5.6 - EC2 IMDSv2 Token Enforcement",
        "category": "Host Hardening",
        "standard": "CIS AWS Foundations Benchmark v3.0",
        "severity": "High",
        "keywords": ["imds", "imdsv2", "instance metadata", "ssrf", "token", "credential theft", "ec2 metadata"],
        "content": (
            "CIS AWS Benchmark 5.6 mandates: Enforce IMDSv2 (Instance Metadata Service Version 2) on all EC2 instances (HttpTokens=required).\n"
            "Rationale: IMDSv1 is vulnerable to Server-Side Request Forgery (SSRF) attacks allowing attackers to steal IAM role credentials.\n"
            "Remediation Procedure:\n"
            "```bash\n"
            "aws ec2 modify-instance-metadata-options --instance-id INSTANCE_ID --http-tokens required --http-endpoint enabled\n"
            "```"
        )
    },
    {
        "id": "FINOPS-GRAVITON",
        "title": "FinOps Modernization: AWS Graviton ARM64 Migration Guide",
        "category": "Cost and Architecture Optimization",
        "standard": "FinOps Foundation Framework",
        "severity": "Info",
        "keywords": ["graviton", "arm64", "t4g", "m6g", "c7g", "price performance", "cost reduction", "x86 migration"],
        "content": (
            "AWS Graviton3 and Graviton4 processors (ARM64 Neoverse architecture) deliver up to 40% better price-performance compared to comparable x86 (Intel/AMD) instances.\n"
            "Key Financial Benefits:\n"
            "1. 20% lower baseline hourly cost (e.g. t4g.small is $0.0168/hr vs t3.small at $0.0208/hr in ap-south-1).\n"
            "2. Up to 60% lower electrical power draw per compute unit.\n"
            "3. Seamless migration for containerized (Docker/EKS), Python, Node.js, Go, and Java workloads without code refactoring."
        )
    },
    {
        "id": "FINOPS-SPOT-FLEET",
        "title": "FinOps Purchasing Strategy: Spot Fleet and Diversified Capacity",
        "category": "Cost and Architecture Optimization",
        "standard": "FinOps Foundation Framework",
        "severity": "Info",
        "keywords": ["spot", "spot fleet", "discount", "interruption", "savings", "stateless", "kubernetes"],
        "content": (
            "AWS Spot Instances offer up to 70-90% discounts on spare cloud compute capacity.\n"
            "A Spot Fleet pools multiple instance types and Availability Zones to maintain target capacity.\n"
            "Handling the 2-Minute Warning: Catch /latest/meta-data/spot/instance-action and trigger graceful draining.\n"
            "Best Workloads: Stateless web tiers behind an ALB, Kubernetes worker nodes (EKS), CI/CD runners, and batch data processing (EMR/Spark)."
        )
    },
    {
        "id": "FINOPS-ECO-SCHEDULE",
        "title": "FinOps Automation: Automated Off-Peak Instance Scheduling",
        "category": "Cost and Architecture Optimization",
        "standard": "FinOps Foundation Framework",
        "severity": "Info",
        "keywords": ["schedule", "shutdown", "off-peak", "dev/stage", "idle instances", "business hours", "cost savings"],
        "content": (
            "Non-production environments (Dev, Test, Staging) typically sit idle for 65% of the week.\n"
            "Eco-Scheduler Strategy:\n"
            "1. 16h/day Dev Schedule: Runs 8 AM - 12 AM weekdays; saves ~33% of monthly compute bills.\n"
            "2. 10h/day Business Hours: Runs 8 AM - 6 PM weekdays; saves ~58% of monthly compute bills.\n"
            "Implementation: Use AWS Systems Manager Quick Setup or EventBridge + Lambda with tags Environment=Development."
        )
    },
    {
        "id": "GREENOPS-SCI",
        "title": "GreenOps Framework: Software Carbon Intensity (SCI) Specification",
        "category": "Sustainability and GreenOps",
        "standard": "Green Software Foundation Standard v2.1",
        "severity": "Info",
        "keywords": ["carbon", "greenops", "co2", "sustainability", "pue", "kwh", "energy efficiency", "emissions"],
        "content": (
            "Cloud computing carbon emissions are quantified using the Green Software Foundation SCI equation:\n"
            "E = (P_watts * Hours * Fleet_Size * PUE) / 1000  (kWh)\n"
            "Emissions = E * Grid_Carbon_Intensity_Factor (kg CO2e)\n"
            "Constants: AWS average Data Center PUE = 1.15. India Regional Grid factor = ~0.708 kg CO2e/kWh.\n"
            "Architectural Levers to Reduce Carbon:\n"
            "1. Migrate to Graviton ARM64 (draws ~14W vs ~20W for x86).\n"
            "2. Run workloads in green AWS regions (e.g., eu-north-1 Stockholm or us-west-2 Oregon powered by renewables)."
        )
    },
    {
        "id": "SEC-EBS-ENCRYPTION",
        "title": "Storage Security: EBS Volume Encryption at Rest",
        "category": "Data Protection",
        "standard": "CIS AWS Foundations Benchmark v3.0 - 2.2.1",
        "severity": "Medium",
        "keywords": ["ebs", "volume", "encryption", "kms", "unencrypted disk", "data security"],
        "content": (
            "CIS Benchmark 2.2.1 mandates that all EBS volumes attached to EC2 instances must be encrypted at rest.\n"
            "To remediate an unencrypted volume:\n"
            "1. Create snapshot: aws ec2 create-snapshot --volume-id VOL_ID\n"
            "2. Copy snapshot with encryption: aws ec2 copy-snapshot --source-region REGION --source-snapshot-id SNAP_ID --encrypted --kms-key-id default\n"
            "3. Create new volume from encrypted snapshot and attach to instance."
        )
    },
    {
        "id": "DEVSECOPS-ISOLATION",
        "title": "Incident Response: Compromised EC2 Instance Quarantine and Isolation",
        "category": "Incident Response and DevSecOps",
        "standard": "AWS Security Incident Response Guide",
        "severity": "Critical",
        "keywords": ["quarantine", "isolate", "breach", "compromised", "incident response", "forensics", "containment"],
        "content": (
            "When an EC2 instance is suspected of compromise (active cryptomining, backdoor, or credential leak):\n"
            "Immediate Containment Steps:\n"
            "1. Create an isolation security group with NO inbound/outbound rules.\n"
            "2. Replace the instance's existing security groups with the isolation group:\n"
            "```bash\n"
            "aws ec2 modify-instance-attribute --instance-id INST_ID --groups ISOLATION_SG_ID\n"
            "```\n"
            "3. Capture volatile memory (if needed) and snapshot all attached EBS volumes for forensics."
        )
    }
]

def _tokenize(text: str) -> List[str]:
    return re.findall(r"\b[a-z0-9_.-]+\b", text.lower())

class CloudRAGRetriever:
    def __init__(self, corpus: List[Dict[str, Any]]):
        self.corpus = corpus
        self.doc_tokens = []
        self.vocab = set()
        self.doc_freq = {}
        self.total_docs = len(corpus)

        for doc in corpus:
            full_text = f"{doc['title']} {doc['category']} {doc['standard']} {' '.join(doc['keywords'])} {doc['content']}"
            tokens = _tokenize(full_text)
            self.doc_tokens.append(tokens)
            unique_tokens = set(tokens)
            for t in unique_tokens:
                self.vocab.add(t)
                self.doc_freq[t] = self.doc_freq.get(t, 0) + 1

    def retrieve(self, query: str, top_k: int = 3, min_score: float = 0.15) -> List[Dict[str, Any]]:
        query_tokens = _tokenize(query)
        if not query_tokens:
            return []

        scores = []
        for idx, (doc, tokens) in enumerate(zip(self.corpus, self.doc_tokens)):
            score = 0.0
            doc_len = len(tokens)
            token_counts = {}
            for t in tokens:
                token_counts[t] = token_counts.get(t, 0) + 1

            for q in query_tokens:
                if q in token_counts:
                    tf = token_counts[q] / max(1, doc_len)
                    df = self.doc_freq.get(q, 1)
                    idf = math.log((self.total_docs + 1) / (df + 0.5)) + 1.0
                    score += tf * idf * 10.0

                if any(q == kw.lower() or q in kw.lower() for kw in doc.get("keywords", [])):
                    score += 0.85

                if q in doc["id"].lower():
                    score += 2.5

            if score > 0:
                normalized_score = min(0.98, round(score / (score + 2.0), 2))
                if normalized_score >= min_score:
                    scores.append({
                        "id": doc["id"],
                        "title": doc["title"],
                        "category": doc["category"],
                        "standard": doc["standard"],
                        "severity": doc.get("severity", "Info"),
                        "relevance_score": normalized_score,
                        "relevance_percent": int(normalized_score * 100),
                        "content": doc["content"],
                        "source_badge": f"{doc['standard']} ({doc['id']})"
                    })

        scores.sort(key=lambda x: x["relevance_score"], reverse=True)
        return scores[:top_k]

    def get_catalog(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": doc["id"],
                "title": doc["title"],
                "category": doc["category"],
                "standard": doc["standard"],
                "severity": doc.get("severity", "Info"),
                "keywords": doc.get("keywords", []),
                "summary": doc["content"].split("\n")[0]
            }
            for doc in self.corpus
        ]

rag_retriever = CloudRAGRetriever(CLOUD_KNOWLEDGE_BASE)

def retrieve_cloud_knowledge(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    return rag_retriever.retrieve(query, top_k=top_k)

def get_rag_knowledge_catalog() -> List[Dict[str, Any]]:
    return rag_retriever.get_catalog()