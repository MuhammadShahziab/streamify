import { useEffect, useState } from "react";
import OTPInput from "../components/OtpInput";
import { Loader, Mail, ShieldCheck } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useVerifyOtp } from "../hooks/useAuthUser";

const OtpPage = () => {
  const { otpExpiresAt } = useAuthStore();
  const [otp, setOtp] = useState("");
  const [counter, setCounter] = useState(() => {
    if (!otpExpiresAt) return 0;
    const diff = new Date(otpExpiresAt).getTime() - Date.now();
    return diff > 0 ? Math.floor(diff / 1000) : 0;
  });
  const { user } = useAuthStore();
  const { mutate: otpMutation, isPending } = useVerifyOtp();

  const submit = (cleanOtp = otp) => {
    const trimmed = cleanOtp.trim();
    if (trimmed.length !== 4) {
      console.warn("Blocked incomplete OTP submit");
      return;
    }
    otpMutation({ email: user?.email, otp: trimmed });
  };
  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (counter <= 0) return;
    const timer = setInterval(() => {
      setCounter((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [counter]);

  return (
    <div
      className="h-screen flex justify-center items-center p-4 sm:p-6 md:p-8"
      data-theme="night"
    >
      <div className="card bg-base-200 w-full max-w-3xl shadow-xl">
        <div className="card-body p-6 sm:p-8">
          <div className="flex flex-col items-center justify-center mb-4">
            <Mail className="size-28 text-primary" />
            <h1 className="text-2xl sm:text-3xl  text-center mb-2">
              Please check your email
            </h1>
            <p className="">{user?.email}</p>
          </div>

          <div className="flex flex-col items-center gap-y-4 justify-center">
            <OTPInput
              length={4}
              value={otp}
              onChange={setOtp}
              onComplete={(val) => {
                setOtp(val);
                submit(val); // ✅ Always use the latest value directly
              }}
              name="otp"
            />
            <div className="flex flex-col ">
              <p className="mb-1">
                Code expires in:{" "}
                <span className="font-semibold">{formatTime(counter)}</span>
              </p>
              <button className="text-primary hover:underline">
                Resend Code
              </button>
            </div>

            <div className="card-actions justify-end  w-1/3">
              <button
                className="btn btn-primary w-full"
                disabled={otp.length !== 4}
              >
                {isPending ? (
                  <>
                    <Loader className="animate-spin size-4" /> Verifying...{" "}
                  </>
                ) : (
                  <>
                    <ShieldCheck /> Verify
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpPage;
