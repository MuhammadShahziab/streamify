import { useState } from "react";
import { Link } from "react-router";
import { LogIn, ShipWheelIcon } from "lucide-react";

import type { LoginData } from "../types";
import { useLogin } from "../hooks/useAuthUser";
import Button from "../components/Button";
import GradientText from "../components/GradientText";

const LoginPage = () => {
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  });
  const { loginMutation, isPending } = useLogin();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation(formData);
  };

  return (
    <div className="flex h-screen items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="flex w-full max-w-4xl flex-col-reverse overflow-hidden rounded-xl border border-primary/25 bg-base-100 shadow-lg lg:flex-row">
        <div className="w-full p-6 sm:p-8 lg:w-1/2">
          <div className="mb-6 ">
          <GradientText icon={ShipWheelIcon} to="/" spin title="Streamify" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Welcome back</h2>
              <p className="text-sm opacity-70">
                Sign in to continue your language learning journey.
              </p>
            </div>

            <div className="space-y-4">
              <label className="form-control w-full">
                <span className="label-text mb-2 ml-1">Email</span>
                <input
                  type="email"
                  className="input input-bordered w-full max-2xl:h-11 rounded-full"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className="form-control w-full">
                <span className="label-text mb-2 ml-1">Password</span>
                <input
                  type="password"
                  className="input input-bordered w-full max-2xl:h-11 rounded-full"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  required
                  minLength={6}
                />
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              className="rounded-full"
              loading={isPending}
              loadingText="Signing in…"
              leftIcon={<LogIn className="size-4" />}
            >
              Sign in
            </Button>

            <p className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline">
                Create one
              </Link>
            </p>
          </form>
        </div>

        <div className="flex w-full items-center justify-center bg-primary/10 p-8 lg:w-1/2">
          <div className="max-w-md space-y-4 text-center">
              <img
                src="/Video_call.svg"
                alt="Language learning illustration"
                className="mx-auto w-64"
              />
            <h2 className="text-lg font-semibold">
              Join conversations with native speakers
            </h2>
            <p className="text-sm opacity-70">
              Practice real-time dialogues, make friends worldwide, and unlock
              new cultures through language.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
