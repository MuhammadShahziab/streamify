import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, Mail, RefreshCw, ShieldCheck } from "lucide-react";

import Button from "../components/Button";
import OTPInput from "../components/OtpInput";
import { useAuthStore } from "../store/useAuthStore";
import { useResendOtp, useVerifyOtp } from "../hooks/useAuthUser";

const computeSecondsRemaining = (timestamp?: string | null) => {
  if (!timestamp) return 0;
  const target = new Date(timestamp).getTime();
  if (Number.isNaN(target)) return 0;
  const diff = Math.floor((target - Date.now()) / 1000);
  return diff > 0 ? diff : 0;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

const OtpPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const verificationMeta = useAuthStore((state) => state.verificationMeta);
  const verificationRetryAt = useAuthStore((state) => state.verificationRetryAt);
  const pendingVerificationEmail = useAuthStore(
    (state) => state.pendingVerificationEmail
  );

  const email = pendingVerificationEmail ?? user?.email ?? "";

  const [otp, setOtp] = useState("");

  const expiresAt = verificationMeta?.expiresAt ?? null;
  const [expirySeconds, setExpirySeconds] = useState(() =>
    computeSecondsRemaining(expiresAt)
  );

  const resendTarget = useMemo(() => {
    const timestamps = [
      verificationMeta?.resendAvailableAt,
      verificationRetryAt,
    ].filter(Boolean) as string[];

    if (!timestamps.length) return null;

    const latest = timestamps.reduce((acc, current) => {
      const currentTime = new Date(current).getTime();
      return currentTime > acc ? currentTime : acc;
    }, 0);

    if (!latest) return null;
    return new Date(latest).toISOString();
  }, [verificationMeta?.resendAvailableAt, verificationRetryAt]);

  const [resendSeconds, setResendSeconds] = useState(() =>
    computeSecondsRemaining(resendTarget)
  );

  useEffect(() => {
    setExpirySeconds(computeSecondsRemaining(expiresAt));
  }, [expiresAt]);

  useEffect(() => {
    if (expirySeconds <= 0) return;
    const interval = window.setInterval(() => {
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [expirySeconds]);

  useEffect(() => {
    setResendSeconds(computeSecondsRemaining(resendTarget));
  }, [resendTarget]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const interval = window.setInterval(() => {
      setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [resendSeconds]);

  useEffect(() => {
    if (user?.isVerified) {
      navigate(user.isOnBoarded ? "/" : "/onboarding", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!email) {
      navigate("/login", { replace: true });
    }
  }, [email, navigate]);

  const { verifyOtpMutation, isPending: isVerifying } = useVerifyOtp();
  const { resendOtpMutation, isPending: isResending } = useResendOtp();

  const attemptsRemaining = verificationMeta?.attemptsRemaining ?? null;
  const maxAttempts = verificationMeta?.maxAttempts ?? null;

  const canResend = resendSeconds <= 0 && !isResending;

  const handleSubmit = (value = otp) => {
    const normalizedOtp = value.trim();
    if (!email || normalizedOtp.length !== 4 || isVerifying) return;
    verifyOtpMutation({ email, otp: normalizedOtp });
  };

  const handleResend = () => {
    if (!email || !canResend) return;
    resendOtpMutation({ email });
    setOtp("");
  };

  const isVerifyDisabled =
    otp.trim().length !== 4 || isVerifying || attemptsRemaining === 0;

  if (!email) {
    return null;
  }

  return (
    <div
      className="h-screen flex items-center justify-center p-4 sm:p-6 md:p-8"
      data-theme="night"
    >
      <div className="card w-full max-w-3xl bg-base-200 shadow-xl">
        <div className="card-body p-6 sm:p-8">
          <div className="flex flex-col items-center gap-2 mb-6 text-center">
            <Mail className="size-20 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-semibold">
              Verify your email
            </h1>
            <p className="text-sm opacity-80">
              We sent a 4-digit verification code to{" "}
              <span className="font-semibold">{email}</span>
            </p>
          </div>

          <form
            className="flex flex-col items-center gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
            <OTPInput
              length={4}
              value={otp}
              onChange={setOtp}
              onComplete={(value) => {
                setOtp(value);
                handleSubmit(value);
              }}
              name="otp"
            />

            <div className="flex flex-col items-center gap-2 text-sm">
              <p className="opacity-80">
                Code expires in{" "}
                <span className="font-semibold">
                  {formatTime(expirySeconds)}
                </span>
              </p>

              {attemptsRemaining !== null && maxAttempts !== null && (
                <div className="flex items-center gap-2 text-warning">
                  <AlertCircle className="size-4" />
                  <span>
                    {attemptsRemaining} of {maxAttempts} attempts remaining
                  </span>
                </div>
              )}

              <Button
                type="button"
                variant="link"
                size="sm"
                className="px-0 gap-2"
                onClick={handleResend}
                disabled={!canResend}
                loading={isResending}
                loadingText="Resending…"
                leftIcon={<RefreshCw className="size-4" />}
              >
                {canResend
                  ? "Resend code"
                  : `Resend available in ${formatTime(resendSeconds)}`}
              </Button>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              className="max-w-xs"
              loading={isVerifying}
              loadingText="Verifying…"
              disabled={isVerifyDisabled}
              leftIcon={<ShieldCheck className="size-4" />}
            >
              Verify
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OtpPage;
