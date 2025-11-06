import { BellIcon, LogOutIcon, ShipWheelIcon } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useAuthUser, useLogout } from "../hooks/useAuthUser";
import ThemeSelector from "./ThemeSelector";
import Button from "./Button";
import GradientText from "./GradientText";
import { MusicIcon } from "lucide-react";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");

  const { logoutMutation } = useLogout();
  return (
    <nav className="bg-base-200 sticky top-0 z-30 h-16 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end gap-4 w-full">
          {/* LOGO - ONLY IN THE CHAT PAGE */}
          {isChatPage && (
            <div className="pl-5">
             <GradientText icon={ShipWheelIcon} to="/" spin title="Streamify" />
            </div>
          )}

          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            <Link to={"/notifications"}>
              <button className="btn btn-ghost btn-circle">
                <BellIcon className="h-6 w-6 text-base-content opacity-70" />
              </button>
            </Link>
          </div>

          {/* TODO */}
          <ThemeSelector />

          <div className="avatar">
            <div className="w-9 rounded-full">
              <img
                src={authUser?.profilePic}
                alt="User Avatar"
                rel="noreferrer"
              />
            </div>
          </div>

          {/* Logout button */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Log out"
            className="rounded-full"
            onClick={() => logoutMutation()}
            leftIcon={<LogOutIcon className="h-5 w-5 text-base-content opacity-80" />}
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
