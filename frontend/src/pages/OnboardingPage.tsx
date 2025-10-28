import { LoaderIcon, ShipWheelIcon, ShuffleIcon } from "lucide-react";
import { useState } from "react";
import { useAuthUser } from "../hooks/useAuthUser";
import { COUNTRIES, LANGUAGES } from "../constants";
import type { OnboardingData } from "../types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeOnboarding } from "../lib/api";
import toast from "react-hot-toast";
import type { AxiosError } from "axios";
import { useNavigate } from "react-router";

const OnboardingPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [formState, setFormState] = useState<OnboardingData>({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    profilePic: authUser?.profilePic || "",
    nativeLanguage: authUser?.nativeLanguage || "",
    learningLanguage: authUser?.learningLanguage || "",
    country: authUser?.country || "",
  });

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profile onboarded successfully");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      navigate("/");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message: string }>;
      console.log(err, "ONBOARDED RESPONSE ERROR");
      const msg = err.response?.data?.message || "Something went wrong";
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onboardingMutation(formState);
  };

  const handleRanddomAvatar = () => {
    const idx = Math.floor(Math.random() * 100) + 1; // 1-100 include
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;
    setFormState({ ...formState, profilePic: randomAvatar });
  };

  return (
    <div
      className="h-screen overflow-auto flex justify-center items-center p-4 sm:p-6 md:p-8"
      data-theme="night"
    >
      <div className="card bg-base-200 w-full max-w-3xl shadow-xl">
        <div className="card-body p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">
            Complete Your Profile
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col justify-center items-center space-y-3">
              <div className=" size-28 rounded-full bg-base-200 overflow-hidden">
                <img
                  src={formState.profilePic}
                  alt="Profile-preview"
                  className="w-full h-full object-cover"
                ></img>
              </div>
              {/* Generate Random Avatar BTN */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRanddomAvatar}
                  type="button"
                  className="btn btn-accent"
                >
                  <ShuffleIcon className="size-4 mr-2" />
                  Generate Random Avatar
                </button>
              </div>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Full Name</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formState.fullName}
                onChange={(e) =>
                  setFormState({ ...formState, fullName: e.target.value })
                }
                className="input input-bordered w-full"
                placeholder="Your full name"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Bio</span>
              </label>
              <textarea
                name="bio"
                value={formState.bio}
                onChange={(e) =>
                  setFormState({ ...formState, bio: e.target.value })
                }
                className="textarea textarea-bordered h-24"
                placeholder="Tell others about yourself and your language learning goals"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* NATIVE LANGUAGE */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Native Language</span>
                </label>
                <select
                  name="nativeLanguage"
                  value={formState.nativeLanguage}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      nativeLanguage: e.target.value,
                    })
                  }
                  className="select select-bordered w-full"
                >
                  <option value="">Select your native language</option>
                  {LANGUAGES.map((lang) => (
                    <option key={`native-${lang}`} value={lang.toLowerCase()}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Learning Language</span>
                </label>
                <select
                  name="learningLanguage"
                  value={formState.learningLanguage}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      learningLanguage: e.target.value,
                    })
                  }
                  className="select select-bordered w-full"
                >
                  <option value="">Select language you're learning</option>
                  {LANGUAGES.map((lang) => (
                    <option key={`learning-${lang}`} value={lang.toLowerCase()}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* COUNTRY */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Country</span>
              </label>
              <select
                name="country"
                value={formState.country}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    country: e.target.value,
                  })
                }
                className="select select-bordered w-full"
              >
                <option value="">Select your Country</option>
                {COUNTRIES.map((country) => (
                  <option
                    key={`native-${country}`}
                    value={country.toLowerCase()}
                  >
                    {country}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary w-full" type="submit">
              {!isPending ? (
                <>
                  <ShipWheelIcon className="size-5 mr-2" />
                  Complete Onboarding
                </>
              ) : (
                <>
                  <LoaderIcon className="animate-spin size-5 mr-2" />
                  Onboarding...
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
