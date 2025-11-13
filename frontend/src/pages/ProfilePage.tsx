import { Loader, LoaderIcon, ShipWheelIcon, ShuffleIcon } from "lucide-react";
import { COUNTRIES, LANGUAGES } from "../constants";
import { useAuthUser } from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { OnboardingData } from "../types";
import { completeOnboarding } from "../lib/api";
import toast from "react-hot-toast";
import type { AxiosError } from "axios";
import ProfileForm from "../components/ProfileForm";
import Container from "../components/Container";

const ProfilePage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
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
      toast.success("Profile update successfully");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
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

  return (
    <Container>
      <ProfileForm
        handleSubmit={handleSubmit}
        formState={formState}
        setFormState={setFormState}
        isPending={isPending}
        isOnBoarded={false}
      />
    </Container>
  );
};

export default ProfilePage;
