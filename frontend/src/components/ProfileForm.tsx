import { Loader, LoaderIcon, ShipWheelIcon, ShuffleIcon } from 'lucide-react';
import { COUNTRIES, LANGUAGES } from '../constants';
import type { OnboardingData } from '../types';
import { use, useState } from 'react';
import { useAuthUser } from '../hooks/useAuthUser';

interface ProfileFormProps {
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  formState: OnboardingData;
  setFormState: React.Dispatch<React.SetStateAction<OnboardingData>>;
  isOnBoarded: boolean;
}


const ProfileForm = ({ handleSubmit,isPending,formState, setFormState, isOnBoarded=true }: ProfileFormProps) => {
   const [loading, setLoading] = useState<boolean>(false);
   const [imageLoaded, setImageLoaded] = useState<boolean>(true); // for fade-in
  const { authUser } = useAuthUser();
  const handleRandomAvatar = () => {
    setLoading(true);
    setImageLoaded(false);
    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    // ✅ Preload image before setting it
    const img = new Image();
    img.src = randomAvatar;
    img.onload = () => {
      setFormState((prev) => ({ ...prev, profilePic: randomAvatar }));
      setLoading(false);
    };
    img.onerror = () => {
      console.error("Failed to load random avatar");
      setLoading(false);
      setImageLoaded(true);
    };
  };
    return (
      <div className="card bg-base-200 w-full  shadow-xl">
        <div className="card-body p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">
            Complete Your Profile
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col justify-center items-center space-y-3">
                <div className="size-28 rounded-full bg-base-200 overflow-hidden">
                  <img
                    key={formState.profilePic} // helps re-trigger animation when avatar changes
                    src={formState.profilePic}
                    alt="Profile-preview"
                    className={`w-full h-full object-cover transition-opacity duration-500 ${
                      imageLoaded ? "opacity-100" : "opacity-20"
                    }`}
                    onLoad={() => setImageLoaded(true)}
                  />
                </div>
                {/* Generate Random Avatar BTN */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRandomAvatar}
                    type="button"
                    className="btn btn-accent"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader className="size-4 mr-2 animate-spin" />
                    ) : (
                      <ShuffleIcon className="size-4 mr-2" />
                    )}
                    Generate Random Avatar
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="text"
                    name="email"
                    value={authUser?.email}
                    className="input input-bordered w-full cursor-not-allowed bg-base-300"
                    placeholder="Your full name"
                  />
                </div>
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
                 {isOnBoarded ? "Complete Onboarding" : "Save Profile"} 
                </>
              ) : (
                <>
                  <LoaderIcon className="animate-spin size-5 mr-2" />
                {isOnBoarded ? "Completing Onboarding..." : "Saving Profile..."}
                </>
              )}
            </button>
          </form>
        </div>
      </div>  )
}

export default ProfileForm