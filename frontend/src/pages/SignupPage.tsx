import { ShipWheelIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import type { SignUpData } from "../types";
import { useSignUp } from "../hooks/useAuthUser";
import Button from "../components/Button";

const SignupPage = () => {
  const [formData, setFormData] = useState<SignUpData>({
    fullName: "",
    email: "",
    password: "",
  });
  const { isPending, signupMutation } = useSignUp();
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    signupMutation(formData);
  };
  return (
    <div
      className="h-screen flex justify-center items-center p-4 sm:p-6 md:p-8"
    >
      <div className="border border-primary/25 flex flex-col lg:flex-row w-full max-w-5xl mx-auto bg-base-100 shadow-lg rounded-xl overflow-hidden">
        <div className="w-full lg:w-1/2 p-4 sm:p-6 flex flex-col">
          <div className="flex items-center gap-2  justify-start mb-4">
            <ShipWheelIcon className="size-9 text-primary animate-spin" />
            <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
              Streamify
            </span>
          </div>

          <div className="w-full">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Create an Account</h2>
                  <p className="text-sm opacity-70">
                    Join Streamify and start your language learning adventure!
                  </p>
                </div>
                <div className="space-y-1">
                  {/* FULLNAME */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text">Full Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="input input-bordered rounded-full w-full"
                      required
                    />
                  </div>
                  {/* Email */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text">Email</span>
                    </label>
                    <input
                      type="email"
                      placeholder="JohnDoe@gmail"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="input input-bordered rounded-full w-full"
                      required
                    />
                  </div>
                  {/* Password */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text">Pasword</span>
                    </label>
                    <input
                      type="password"
                      placeholder="********"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="input input-bordered rounded-full w-full"
                      required
                    />
                    <p className="text-xs opacity-70 mt-1">
                      Password must be at least 6 characters long
                    </p>
                  </div>
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        // checked={formData.agreeToTerms}
                        // onChange={(e)=>setFormData({...formData,agreeToTerms:e.target.checked})}
                        required
                      />
                      <span className="text-xs leading-tight">
                        I agree to the{" "}
                        <span className="text-primary hover:underline">
                          terms of service
                        </span>{" "}
                        and{" "}
                        <span className="text-primary hover:underline">
                          privacy policy
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  className="rounded-full"
                  loading={isPending}
                  loadingText="Creating Account..."
                >
                  Create Account
                </Button>
                <div className="text-center">
                  <p className="text-sm">
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
        <div className="hidden lg:flex w-1/2 bg-primary/10 items-center justify-center">
          <div className="max-w-md p-8">
            {/* Illustration */}
            <div className="relative aspect-square max-w-sm mx-auto">
              <img
                src="/i.png"
                alt="Language connection illustration"
                className="w-full h-full"
              />
            </div>

            <div className="text-center space-y-3 mt-6">
              <h2 className="text-xl font-semibold">
                Connect with language partners worldwide
              </h2>
              <p className="opacity-70">
                Practice conversations, make friends, and improve your language
                skills together
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
