import { useState, useEffect, useRef, useCallback } from "react";
import {
  verifyRegisterOtp,
  verifyForgotOtp,
  requestRegisterOtp,
  requestForgotOtp,
} from "../../api/authApi";
import { showError, showSuccess } from "../../utils/toast";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function VerifyOtpModal({ email, purpose, onClose }) {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [isOtpExpired, setIsOtpExpired] = useState(false);

  const submittedRef = useRef(false);

  /* -------------------- OTP INPUT -------------------- */
  const handleChange = (i, value) => {
    if (!/^\d?$/.test(value)) return;

    setOtp((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });

    if (value && i < OTP_LENGTH - 1) {
      document.getElementById(`otp-${i + 1}`)?.focus();
    }
  };

  /* -------------------- VERIFY OTP -------------------- */
  const handleVerify = useCallback(async (code) => {
    if (loading) return;

    setLoading(true);

    try {
      if (purpose === "REGISTER") {
        await verifyRegisterOtp(email, code);
      } else {
        await verifyForgotOtp(email, code);
      }

      showSuccess("OTP verified successfully");
      onClose(true);
    } catch (err) {
      showError(err?.response?.data?.message || "Invalid OTP");

      setOtp(Array(OTP_LENGTH).fill(""));
      submittedRef.current = false;

      setTimeout(() => {
        document.getElementById("otp-0")?.focus();
      }, 0);
    } finally {
      setLoading(false);
    }
  }, [email, loading, onClose, purpose]);

  /* -------------------- AUTO SUBMIT -------------------- */
  useEffect(() => {
    const code = otp.join("");

    if (
      code.length === OTP_LENGTH &&
      !loading &&
      !isOtpExpired &&
      !submittedRef.current
    ) {
      submittedRef.current = true;
      handleVerify(code);
    }
  }, [otp, loading, isOtpExpired, handleVerify]);

  /* -------------------- RESEND OTP TIMER -------------------- */
  useEffect(() => {
    if (secondsLeft === 0) {
      setIsOtpExpired(true);
      return;
    }

    const timer = setTimeout(
      () => setSecondsLeft((s) => s - 1),
      1000
    );

    return () => clearTimeout(timer);
  }, [secondsLeft]);

  /* -------------------- RESEND OTP -------------------- */
  const handleResend = async () => {
    if (resendLoading) return;

    setResendLoading(true);

    try {
      if (purpose === "REGISTER") {
        await requestRegisterOtp(email);
      } else {
        await requestForgotOtp(email);
      }

      showSuccess("New OTP sent to your email");

      setSecondsLeft(RESEND_SECONDS);
      setIsOtpExpired(false);
      setOtp(Array(OTP_LENGTH).fill(""));
      submittedRef.current = false;
    } catch {
      showError("Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="otp-overlay">
      <div className="otp-card">
        <h2 className="text-lg font-semibold">Verify Email</h2>

        <p className="text-sm text-gray-600 mt-1">
          Enter the 6-digit code sent to <b>{email}</b>
        </p>

        <div className="otp-inputs">
          {otp.map((v, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              maxLength="1"
              value={v}
              disabled={loading}
              onChange={(e) => handleChange(i, e.target.value)}
            />
          ))}
        </div>

        {/* Resend */}
        {isOtpExpired ? (
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="w-full text-blue-600 font-medium flex justify-center gap-2"
          >
            {resendLoading && (
              <span className="h-4 w-4 border-2 border-blue-500/50 border-t-blue-600 rounded-full animate-spin" />
            )}
            {resendLoading ? "Sending..." : "Resend OTP"}
          </button>
        ) : (
          <p className="text-sm text-gray-500">
            Resend OTP in {secondsLeft}s
          </p>
        )}

        {/* Verify Button */}
        <button
          onClick={() => handleVerify(otp.join(""))}
          disabled={otp.join("").length !== OTP_LENGTH || loading}
          className={`
            w-full
            flex items-center justify-center gap-2
            py-2
            rounded-lg
            mt-3
            text-white
            transition
            ${loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"}
          `}
        >
          {loading && (
            <span className="h-4 w-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
          )}
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <button
          onClick={() => onClose(false)}
          disabled={loading}
          className="mt-2 text-sm text-gray-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
