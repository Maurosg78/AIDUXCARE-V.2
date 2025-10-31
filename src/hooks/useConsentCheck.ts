import { useEffect, useState } from "react";
import { logConsentAction } from "../services/ConsentAuditService";

interface ConsentState {
  isReady: boolean;
  hasConsent: boolean;
}

/**
 * Hook to manage consent status according to PIPEDA/PHIPA rules.
 * Reads from localStorage and provides state to gate access to protected pages.
 */
export function useConsentCheck(): ConsentState {
  const [isReady, setIsReady] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const storedConsent = localStorage.getItem("aidux_patient_consent");

    if (storedConsent) {
      try {
        const parsed = JSON.parse(storedConsent);

        if (parsed.accepted === true) {
          setHasConsent(true);
          try {
            logConsentAction({
              userId: parsed.userId || "anonymous",
              action: "accept",
              version: parsed.version || "1.1",
            });
          } catch (err) {
            console.error("Consent audit failed:", err);
          }
        } else if (parsed.withdrawn === true) {
          setHasConsent(false);
          try {
            logConsentAction({
              userId: parsed.userId || "anonymous",
              action: "withdraw",
              version: parsed.version || "1.1",
            });
          } catch (err) {
            console.error("Withdrawal audit failed:", err);
          }
        }
      } catch (parseErr) {
        console.warn("Invalid consent JSON in localStorage:", parseErr);
      }
    }

    setIsReady(true);
  }, []);

  return { isReady, hasConsent };
}
