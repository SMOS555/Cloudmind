import { useState } from "react";
import { supabase } from "../utils/supabase";

function Login() {
  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    // ==============================
    // SIGN UP
    // ==============================

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(
          "Account created successfully! Check your email to verify your account."
        );

        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }

      setLoading(false);
      return;
    }

    // ==============================
    // LOGIN
    // ==============================

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        {/* LOGO */}

        <div className="auth-logo">
          ☁
        </div>

        <span className="eyebrow">
          CLOUD INTELLIGENCE
        </span>

        {/* TITLE */}

        <h1>
          {isSignUp
            ? "Create your account"
            : "Welcome to CloudMind"}
        </h1>

        <p>
          {isSignUp
            ? "Create your CloudMind account and start managing your cloud infrastructure."
            : "Sign in to access your cloud intelligence platform."}
        </p>

        {/* FORM */}

        <form onSubmit={handleSubmit}>

          {/* EMAIL */}

          <label>
            Email
          </label>

          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* PASSWORD */}

          <label>
            Password
          </label>

          <input
            type="password"
            placeholder={
              isSignUp
                ? "Create a password"
                : "Enter your password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* CONFIRM PASSWORD */}

          {isSignUp && (
            <>
              <label>
                Confirm Password
              </label>

              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                required
              />
            </>
          )}

          {/* ERROR */}

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="auth-success">
              {success}
            </div>
          )}

          {/* SUBMIT */}

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading
              ? isSignUp
                ? "Creating account..."
                : "Signing in..."
              : isSignUp
                ? "Create Account"
                : "Sign In"}
          </button>

        </form>

        {/* SWITCH LOGIN / SIGNUP */}

        <div className="auth-switch">

          <span>
            {isSignUp
              ? "Already have an account?"
              : "Don't have an account?"}
          </span>

          <button
            type="button"
            onClick={switchMode}
          >
            {isSignUp
              ? "Sign In"
              : "Create Account"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default Login;