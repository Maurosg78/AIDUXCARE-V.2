import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { emailActivationService } from "../services/emailActivationService";
import { DataSovereigntyBadge } from "../components/transparency/DataSovereigntyBadge";

import logger from "@/shared/utils/logger";
import styles from '@/styles/wizard.module.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      logger.info("[LOGIN] Attempting sign-in", { email });
      await login(email, password);

      const professional = await emailActivationService.getProfessional(email);

      if (!professional) {
        setError("Email not registered. Complete the onboarding process first.");
        return;
      }

      if (professional.isActive === false) {
        setError("Your account is pending activation. Check your inbox.");
        return;
      }

      await emailActivationService.updateLastLogin(email);
      navigate("/workflow", {
        replace: true,
        state: { from: "login" },
      });
    } catch (err) {
      logger.error("[LOGIN] Authentication error", err);
      setError("We couldn't validate your credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authShell}>
      <div className={styles.authPanel}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Professional Registration</span>
          <h1 className={styles.headline}>
            Welcome to <span className={styles.headlineAccent}>AiDuxCare</span>
          </h1>
          <p className={styles.subheadline}>
            Your intelligent medico-legal assistant in Canada.
          </p>
          
          {/* Data Sovereignty Badge */}
          <div className="mt-4 mb-4">
            <DataSovereigntyBadge size="md" showDescription={true} />
          </div>
        </header>

        {successMessage && <div className={styles.authSuccess}>{successMessage}</div>}
        {error && <div className={styles.authAlert}>{error}</div>}

        <form onSubmit={handleLogin} className={styles.authForm} data-testid="login-form">
          <div className={styles.authField}>
            <label htmlFor="email-address" className={styles.authLabel}>
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={styles.authInput}
              placeholder="mauricio@aiduxcare.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className={styles.authField}>
            <label htmlFor="password" className={styles.authLabel}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={styles.authInput}
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.authButton}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className={styles.authLinks}>
          <Link to="/forgot-password" className={styles.authLink}>
            Forgot your password?
          </Link>
          <p className={styles.authHint}>
            New to AiDuxCare? {" "}
            <Link to="/onboarding" className={styles.authLink}>
              Start your onboarding
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
