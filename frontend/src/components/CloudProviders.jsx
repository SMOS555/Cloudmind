import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "http://127.0.0.1:8000";

function CloudProviders({ awsCredentials, updateAwsCredentials }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [awsData, setAwsData] = useState(null);
  const [awsLoading, setAwsLoading] = useState(true);
  const [awsError, setAwsError] = useState("");

  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [cloudMindAccountId, setCloudMindAccountId] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  const [form, setForm] = useState({
    provider: "AWS",
    account_name: "",
    role_arn: "",
    external_id: "",
    region: "ap-south-1",
  });

  // ==========================================
  // LOAD CLOUD ACCOUNTS
  // ==========================================

  const loadAccounts = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You are not logged in.");
      }

      const { data, error } = await supabase
        .from("cloud_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      const loadedAccounts = data || [];

      setAccounts(loadedAccounts);

      return loadedAccounts;
    } catch (err) {
      console.error("Cloud accounts error:", err);

      setError(
        err.message ||
          "Unable to load cloud accounts."
      );

      return [];
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // GET CLOUDMIND AWS ACCOUNT
  // ==========================================

  const loadCloudMindIdentity = async () => {
    try {
      setSetupLoading(true);

      let response;
      if (awsCredentials?.accessKeyId && !awsCredentials?.useServerDefaults) {
        response = await fetch(`${API_BASE_URL}/provider/aws/test`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aws_access_key_id: awsCredentials.accessKeyId.trim(),
            aws_secret_access_key: awsCredentials.secretAccessKey ? awsCredentials.secretAccessKey.trim() : "",
            aws_session_token: awsCredentials.sessionToken ? awsCredentials.sessionToken.trim() : null,
            region: awsCredentials.region || "ap-south-1",
          }),
        });
      } else {
        const reg = awsCredentials?.region || "ap-south-1";
        response = await fetch(
          `${API_BASE_URL}/provider/aws/test?region=${encodeURIComponent(reg)}`
        );
      }

      if (!response.ok) {
        throw new Error(
          "Unable to retrieve CloudMind AWS identity."
        );
      }

      const data = await response.json();

      console.log(
        "CloudMind AWS identity:",
        data
      );

      if (data.account_id) {
        setCloudMindAccountId(
          data.account_id
        );
      }

      return data;
    } catch (err) {
      console.error(
        "CloudMind identity error:",
        err
      );

      setCloudMindAccountId("");

      return null;
    } finally {
      setSetupLoading(false);
    }
  };

  // ==========================================
  // GENERATE EXTERNAL ID
  // ==========================================

  const generateExternalId = () => {
    if (
      typeof crypto !== "undefined" &&
      crypto.randomUUID
    ) {
      return `cloudmind-${crypto.randomUUID()}`;
    }

    return `cloudmind-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 12)}`;
  };

  // ==========================================
  // OPEN AWS CONNECTION MODAL
  // ==========================================

  const openConnectModal = async () => {
    setError("");
    setAwsError("");

    const externalId =
      generateExternalId();

    setForm({
      provider: "AWS",
      account_name: "",
      role_arn: "",
      external_id: externalId,
      region: "ap-south-1",
    });

    setShowModal(true);

    await loadCloudMindIdentity();
  };

  // ==========================================
  // LOAD REAL AWS DATA
  // ==========================================

  const loadAwsData = async (
    accountOverride = null
  ) => {
    setAwsLoading(true);
    setAwsError("");

    try {
      const awsAccount =
        accountOverride ||
        accounts.find(
          (account) =>
            account.provider === "AWS" &&
            account.role_arn &&
            account.external_id
        );

      let response;

      if (awsAccount) {
        const params = new URLSearchParams();
        params.set("region", awsAccount.region || "ap-south-1");
        params.set("role_arn", awsAccount.role_arn);
        params.set("external_id", awsAccount.external_id);
        params.set("history_hours", "7");
        response = await fetch(`${API_BASE_URL}/provider/aws/metrics?${params.toString()}`);
      } else if (awsCredentials?.accessKeyId && !awsCredentials?.useServerDefaults) {
        response = await fetch(`${API_BASE_URL}/provider/aws/metrics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aws_access_key_id: awsCredentials.accessKeyId.trim(),
            aws_secret_access_key: awsCredentials.secretAccessKey ? awsCredentials.secretAccessKey.trim() : "",
            aws_session_token: awsCredentials.sessionToken ? awsCredentials.sessionToken.trim() : null,
            region: awsCredentials.region || "ap-south-1",
            history_hours: 7,
          }),
        });
      } else {
        const reg = awsCredentials?.region || "ap-south-1";
        response = await fetch(
          `${API_BASE_URL}/provider/aws/metrics?region=${encodeURIComponent(reg)}&history_hours=7`
        );
      }

      if (!response.ok) {
        const body =
          await response.json().catch(
            () => null
          );

        throw new Error(
          body?.detail ||
            "Unable to retrieve AWS data."
        );
      }

      const data =
        await response.json();

      console.log(
        "Connected AWS infrastructure:",
        data
      );

      setAwsData(data);
    } catch (err) {
      console.error(
        "AWS data error:",
        err
      );

      setAwsData(null);

      setAwsError(
        err.message ||
          "Unable to retrieve AWS infrastructure data."
      );
    } finally {
      setAwsLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    const initialize = async () => {
      const loadedAccounts =
        await loadAccounts();

      await loadAwsData(
        loadedAccounts.find(
          (account) =>
            account.provider === "AWS" &&
            account.role_arn &&
            account.external_id
        )
      );
    };

    initialize();

    const refreshInterval =
      setInterval(async () => {
        const loadedAccounts =
          await loadAccounts();

        const awsAccount =
          loadedAccounts.find(
            (account) =>
              account.provider === "AWS" &&
              account.role_arn &&
              account.external_id
          );

        await loadAwsData(
          awsAccount
        );
      }, 30000);

    return () => {
      clearInterval(
        refreshInterval
      );
    };
  }, [awsCredentials]);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]:
        e.target.value,
    }));
  };

  // ==========================================
  // CONNECT AWS ACCOUNT
  // ==========================================

  const handleAddAccount = async (e) => {
    e.preventDefault();

    setError("");

    if (!form.account_name.trim()) {
      setError(
        "Please enter an account name."
      );
      return;
    }

    if (!form.role_arn.trim()) {
      setError(
        "Please enter the AWS Role ARN."
      );
      return;
    }

    if (!form.external_id.trim()) {
      setError(
        "External ID is missing. Please reopen the connection window."
      );
      return;
    }

    setSaving(true);

    try {
      // --------------------------------------
      // VERIFY WITH BACKEND
      // --------------------------------------

      const response =
        await fetch(
          `${API_BASE_URL}/provider/aws/connect`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              role_arn:
                form.role_arn.trim(),

              external_id:
                form.external_id.trim(),

              region:
                form.region.trim() ||
                "ap-south-1",
            }),
          }
        );

      const result =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.detail ||
            "AWS connection failed."
        );
      }

      console.log(
        "AWS connection verified:",
        result
      );

      // --------------------------------------
      // GET CURRENT USER
      // --------------------------------------

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Your login session has expired. Please log in again."
        );
      }

      // --------------------------------------
      // SAVE VERIFIED CONNECTION
      // --------------------------------------

      const accountId =
        result.account?.account_id ||
        result.account_id ||
        null;

      const region =
        result.region ||
        form.region ||
        "ap-south-1";

      const accountName =
        form.account_name.trim();

      const {
        data: savedAccount,
        error: saveError,
      } = await supabase
        .from("cloud_accounts")
        .insert([
          {
            user_id: user.id,

            provider: "AWS",

            account_name:
              accountName,

            account_id:
              accountId,

            region: region,

            status: "connected",

            role_arn:
              form.role_arn.trim(),

            external_id:
              form.external_id.trim(),
          },
        ])
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }

      console.log(
        "AWS account saved:",
        savedAccount
      );

      // --------------------------------------
      // CLOSE MODAL
      // --------------------------------------

      setShowModal(false);

      setForm({
        provider: "AWS",
        account_name: "",
        role_arn: "",
        external_id: "",
        region: "ap-south-1",
      });

      // --------------------------------------
      // REFRESH EVERYTHING
      // --------------------------------------

      const loadedAccounts =
        await loadAccounts();

      const connectedAccount =
        loadedAccounts.find(
          (account) =>
            account.id ===
            savedAccount.id
        );

      await loadAwsData(
        connectedAccount ||
          savedAccount
      );
    } catch (err) {
      console.error(
        "AWS connection error:",
        err
      );

      setError(
        err.message ||
          "Unable to connect AWS account."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // REMOVE ACCOUNT
  // ==========================================

  const handleRemove = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to remove this cloud account?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const { error } =
        await supabase
          .from("cloud_accounts")
          .delete()
          .eq("id", id);

      if (error) {
        throw error;
      }

      const loadedAccounts =
        await loadAccounts();

      const awsAccount =
        loadedAccounts.find(
          (account) =>
            account.provider === "AWS" &&
            account.role_arn &&
            account.external_id
        );

      await loadAwsData(
        awsAccount
      );
    } catch (err) {
      console.error(
        "Remove account error:",
        err
      );

      setError(
        err.message ||
          "Unable to remove cloud account."
      );
    }
  };

  // ==========================================
  // MANAGE ACCOUNT
  // ==========================================

  const handleManage = (
    account
  ) => {
    if (
      account.provider !== "AWS"
    ) {
      return;
    }

    setForm({
      provider: "AWS",
      account_name:
        account.account_name || "",
      role_arn:
        account.role_arn || "",
      external_id:
        account.external_id ||
        generateExternalId(),
      region:
        account.region ||
        "ap-south-1",
    });

    setError("");
    setShowModal(true);
  };

  // ==========================================
  // REFRESH
  // ==========================================

  const handleRefresh = async () => {
    setError("");

    const loadedAccounts =
      await loadAccounts();

    const awsAccount =
      loadedAccounts.find(
        (account) =>
          account.provider === "AWS" &&
          account.role_arn &&
          account.external_id
      );

    await loadAwsData(
      awsAccount
    );
  };

  // ==========================================
  // PROVIDER ICON
  // ==========================================

  const getProviderIcon =
    (provider) => {
      if (provider === "GCP") {
        return "G";
      }

      if (provider === "Azure") {
        return "M";
      }

      return "A";
    };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="providers-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="page-header">

        <div>

          <span className="eyebrow">
            CLOUD INFRASTRUCTURE
          </span>

          <h1>
            Cloud Providers
          </h1>

          <p>
            Connect and monitor your
            cloud infrastructure from
            one control plane.
          </p>

        </div>

        <div className="provider-header-actions">

          <button
            className="secondary-button"
            onClick={handleRefresh}
            disabled={
              loading ||
              awsLoading
            }
          >
            {loading ||
            awsLoading
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>

          <button
            className="primary-button"
            onClick={
              openConnectModal
            }
          >
            + Connect AWS
          </button>

        </div>

      </div>

      {/* ======================================
          ERROR
      ====================================== */}

      {error && (
        <div className="dashboard-alert">

          <span>!</span>

          <div>

            <strong>
              Cloud connection error
            </strong>

            <p>
              {error}
            </p>

          </div>

          <button
            className="secondary-button"
            onClick={
              loadAccounts
            }
          >
            Retry
          </button>

        </div>
      )}

      {/* ======================================
          LOADING
      ====================================== */}

      {loading ? (

        <div className="providers-loading">
          Loading cloud accounts...
        </div>

      ) : (

        <>

          {/* ==================================
              LIVE AWS DATA
          ================================== */}

          <div className="aws-live-card">

            <div className="aws-live-header">

              <div>

                <span className="eyebrow">
                  LIVE AWS DATA
                </span>

                <h2>
                  AWS Infrastructure
                </h2>

                <p>
                  Real EC2 and CloudWatch
                  data from the connected
                  AWS account.
                </p>

              </div>

              {awsData && (
                <span className="connected-badge">

                  <span className="status-dot"></span>

                  Live

                </span>
              )}

            </div>

            {awsLoading ? (

              <div className="aws-loading">

                <div className="loading-spinner"></div>

                <span>
                  Connecting to AWS
                  infrastructure...
                </span>

              </div>

            ) : awsData ? (

              <div className="aws-live-stats">

                {/* EC2 */}

                <div className="aws-stat">

                  <span className="aws-stat-label">
                    EC2 INSTANCES
                  </span>

                  <strong>
                    {
                      awsData.total_instances ??
                      0
                    }
                  </strong>

                  <small>
                    Total instances
                  </small>

                </div>

                {/* REGION */}

                <div className="aws-stat">

                  <span className="aws-stat-label">
                    REGION
                  </span>

                  <strong>
                    {
                      awsData.region ||
                      "Unknown"
                    }
                  </strong>

                  <small>
                    AWS region
                  </small>

                </div>

                {/* RUNNING */}

                <div className="aws-stat">

                  <span className="aws-stat-label">
                    RUNNING
                  </span>

                  <strong>
                    {
                      awsData.running_instances ??
                      0
                    }
                  </strong>

                  <small>
                    Active instances
                  </small>

                </div>

                {/* CPU */}

                <div className="aws-stat">

                  <span className="aws-stat-label">
                    CPU
                  </span>

                  <strong>
                    {awsData.cpu_usage != null
                      ? `${Number(
                          awsData.cpu_usage
                        ).toFixed(1)}%`
                      : "N/A"}
                  </strong>

                  <small>
                    CloudWatch average
                  </small>

                </div>

              </div>

            ) : (

              <div className="aws-error">

                <strong>
                  AWS data unavailable
                </strong>

                <p>
                  {awsError ||
                    "Connect an AWS account to retrieve live infrastructure data."}
                </p>

                <button
                  className="secondary-button"
                  onClick={
                    openConnectModal
                  }
                >
                  Connect AWS Account
                </button>

              </div>

            )}

          </div>

          {/* ==================================
              CONNECTED ACCOUNTS
          ================================== */}

          <div className="section-heading">

            <div>

              <span className="eyebrow">
                CONNECTED ACCOUNTS
              </span>

              <h2>
                Your Cloud Accounts
              </h2>

              <p>
                AWS accounts connected
                securely to CloudMind.
              </p>

            </div>

          </div>

          {accounts.length === 0 ? (

            <div className="providers-empty">

              <div className="providers-empty-icon">
                ☁
              </div>

              <h2>
                No cloud accounts connected
              </h2>

              <p>
                Connect an AWS account to
                start monitoring EC2,
                CloudWatch and infrastructure
                metrics.
              </p>

              <button
                className="primary-button"
                onClick={
                  openConnectModal
                }
              >
                + Connect AWS Account
              </button>

            </div>

          ) : (

            <div className="provider-accounts-grid">

              {accounts.map(
                (account) => (

                  <div
                    className="provider-account-card"
                    key={account.id}
                  >

                    <div className="provider-account-top">

                      <div
                        className={
                          `provider-logo ${
                            account.provider.toLowerCase()
                          }`
                        }
                      >
                        {getProviderIcon(
                          account.provider
                        )}
                      </div>

                      <div className="provider-title">

                        <span className="provider-name">
                          {account.provider}
                        </span>

                        <h2>
                          {account.account_name}
                        </h2>

                      </div>

                      <span className="connected-badge">

                        <span className="status-dot"></span>

                        Connected

                      </span>

                    </div>

                    <div className="provider-account-details">

                      <div>

                        <span>
                          ACCOUNT ID
                        </span>

                        <strong>
                          {account.account_id ||
                            "Not available"}
                        </strong>

                      </div>

                      <div>

                        <span>
                          REGION
                        </span>

                        <strong>
                          {account.region ||
                            "Not provided"}
                        </strong>

                      </div>

                      <div>

                        <span>
                          CONNECTION
                        </span>

                        <strong className="status-connected">
                          {account.role_arn
                            ? "Cross-account role"
                            : "Legacy"}
                        </strong>

                      </div>

                      <div>

                        <span>
                          ADDED
                        </span>

                        <strong>

                          {account.created_at
                            ? new Date(
                                account.created_at
                              ).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "—"}

                        </strong>

                      </div>

                    </div>

                    <div className="provider-account-footer">

                      <span className="connection-info">

                        <span className="status-dot"></span>

                        {account.role_arn
                          ? "Cross-account connection active"
                          : "Account record only"}

                      </span>

                      <div className="provider-actions">

                        <button
                          type="button"
                          className="manage-button"
                          onClick={() =>
                            handleManage(
                              account
                            )
                          }
                        >
                          Manage
                        </button>

                        <button
                          type="button"
                          className="remove-button"
                          onClick={() =>
                            handleRemove(
                              account.id
                            )
                          }
                        >
                          Remove
                        </button>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

          {/* ==================================
              MULTI-CLOUD ROADMAP
          ================================== */}

          <div className="connect-provider-banner">

            <div className="connect-provider-icon">
              +
            </div>

            <div className="connect-provider-content">

              <h3>
                Multi-cloud support
              </h3>

              <p>
                AWS is currently active.
                Azure and Google Cloud
                connectors can be added
                next using the same
                account architecture.
              </p>

            </div>

            <span className="secondary-button">
              Coming Soon
            </span>

          </div>

        </>

      )}

      {/* ======================================
          AWS CONNECTION MODAL
      ====================================== */}

      {showModal && (

        <div
          className="modal-overlay"
          onClick={() => {
            if (!saving) {
              setShowModal(false);
            }
          }}
        >

          <div
            className="cloud-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span className="eyebrow">
                  AWS CONNECTION
                </span>

                <h2>
                  Connect AWS Account
                </h2>

                <p>
                  Connect an AWS account
                  using a secure cross-account
                  IAM role.
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setShowModal(false)
                }
                disabled={saving}
              >
                ×
              </button>

            </div>

            {/* --------------------------------
                SETUP INSTRUCTIONS
            -------------------------------- */}

            <div className="aws-setup-panel">

              <div className="setup-step">

                <span className="setup-number">
                  1
                </span>

                <div>

                  <strong>
                    CloudMind AWS Account
                  </strong>

                  <p>
                    Enter this account as
                    the trusted AWS account
                    when creating your IAM role.
                  </p>

                  <div className="copy-field">

                    <code>
                      {setupLoading
                        ? "Loading..."
                        : cloudMindAccountId ||
                          "Unavailable"}
                    </code>

                    {cloudMindAccountId && (
                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            cloudMindAccountId
                          )
                        }
                      >
                        Copy
                      </button>
                    )}

                  </div>

                </div>

              </div>

              <div className="setup-step">

                <span className="setup-number">
                  2
                </span>

                <div>

                  <strong>
                    External ID
                  </strong>

                  <p>
                    Add this exact value
                    to the IAM role trust
                    policy.
                  </p>

                  <div className="copy-field">

                    <code>
                      {form.external_id}
                    </code>

                    <button
                      type="button"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          form.external_id
                        )
                      }
                    >
                      Copy
                    </button>

                  </div>

                </div>

              </div>

              <div className="setup-step">

                <span className="setup-number">
                  3
                </span>

                <div>

                  <strong>
                    Create an IAM Role
                  </strong>

                  <p>
                    In the customer's AWS
                    account, create a role
                    trusted by CloudMind and
                    give it the read permissions
                    required by CloudMind.
                  </p>

                  <a
                    href="https://console.aws.amazon.com/iam/home#/roles"
                    target="_blank"
                    rel="noreferrer"
                    className="aws-console-link"
                  >
                    Open AWS IAM →
                  </a>

                </div>

              </div>

              <div className="setup-step">

                <span className="setup-number">
                  4
                </span>

                <div>

                  <strong>
                    Paste the Role ARN
                  </strong>

                  <p>
                    After creating the role,
                    copy its ARN and enter
                    it below.
                  </p>

                </div>

              </div>

            </div>

            <form
              onSubmit={
                handleAddAccount
              }
            >

              {/* ACCOUNT NAME */}

              <div className="form-group">

                <label>
                  Account Name
                </label>

                <input
                  type="text"
                  name="account_name"
                  placeholder="e.g. Production AWS"
                  value={
                    form.account_name
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

              {/* ROLE ARN */}

              <div className="form-group">

                <label>
                  AWS Role ARN
                </label>

                <input
                  type="text"
                  name="role_arn"
                  placeholder="arn:aws:iam::123456789012:role/CloudMindReadOnly"
                  value={
                    form.role_arn
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

                <small>
                  Example:
                  {" "}
                  arn:aws:iam::123456789012:role/CloudMindReadOnly
                </small>

              </div>

              {/* EXTERNAL ID */}

              <div className="form-group">

                <label>
                  External ID
                </label>

                <input
                  type="text"
                  value={
                    form.external_id
                  }
                  readOnly
                />

                <small>
                  Generated by CloudMind and
                  locked for this connection.
                </small>

              </div>

              {/* REGION */}

              <div className="form-group">

                <label>
                  AWS Region
                </label>

                <select
                  name="region"
                  value={
                    form.region
                  }
                  onChange={
                    handleChange
                  }
                >

                  <option value="ap-south-1">
                    Asia Pacific
                    (Mumbai)
                  </option>

                  <option value="ap-southeast-1">
                    Asia Pacific
                    (Singapore)
                  </option>

                  <option value="us-east-1">
                    US East
                    (N. Virginia)
                  </option>

                  <option value="us-east-2">
                    US East
                    (Ohio)
                  </option>

                  <option value="us-west-2">
                    US West
                    (Oregon)
                  </option>

                  <option value="eu-west-1">
                    Europe
                    (Ireland)
                  </option>

                  <option value="eu-central-1">
                    Europe
                    (Frankfurt)
                  </option>

                </select>

              </div>

              {/* ACTIONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    saving ||
                    setupLoading
                  }
                >

                  {saving
                    ? "Verifying AWS..."
                    : "Connect AWS Account"}

                </button>

              </div>

            </form>

            <div className="modal-note">

              <span>
                🔒
              </span>

              <div>

                <strong>
                  Secure connection
                </strong>

                <p>
                  CloudMind uses AWS STS
                  AssumeRole to obtain
                  temporary credentials.
                  Your AWS access keys are
                  never requested or stored.
                </p>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default CloudProviders;