import { Loader, MessageCircleMore, PlusCircle } from "lucide-react";
import { getLanguageFlag } from "../utils/getLanguageFlag";
import type { User } from "../types";
import type React from "react";
import { useNavigate } from "react-router";
import { useOnlineUsersStore } from "../store/useOnlineUsersStore";

type ContactCardProps = {
  user: User;
  isFriend?: boolean;
  hasRequestBeenSent?: boolean;
  onSendRequest?: (userId: string) => void;
  isLoading?: boolean;
};

const ContactCard: React.FC<ContactCardProps> = ({
  user,
  isFriend = false,
  hasRequestBeenSent = false,
  onSendRequest,
  isLoading = false,
}) => {
  const naviagte = useNavigate();

  const onlineUsers = useOnlineUsersStore((s) => s.onlineUsers);
  const handleClick = () => {
    if (isFriend) {
      naviagte(`/chat/${user?._id}`);
    } else if (!hasRequestBeenSent && onSendRequest) {
      onSendRequest(user?._id);
    }
  };

  const renderButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader className="animate-spin mr-2 size-4" />
          Send Request
        </>
      );
    }
    if (isFriend) {
      return (
        <>
          <MessageCircleMore className="mr-2 size-4" />
          Contact
        </>
      );
    }
    if (hasRequestBeenSent) return "Request Sent";
    return (
      <>
        <PlusCircle className="mr-2 size-4" />
        Send Request
      </>
    );
  };

  return (
    <div className="card bg-base-200  hover:shadow-md transition-shadow">
      <div className="card-body p-4 relative">
        {onlineUsers.includes(user?._id) && (
          <p className="text-xs text-success animate-pulse flex items-center gap-1 absolute top-2 right-4">
            <span className="size-2 rounded-full bg-success inline-block" />
            Online
          </p>
        )}

        {/* USER INFO */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="avatar size-12">
              <img src={user?.profilePic} alt={user?.fullName} />
            </div>
            <h3 className="font-semibold truncate">{user?.fullName}</h3>
          </div>
          <div></div>
        </div>
        <div className="flex flex-col 2xl:flex-row gap-1.5 mb-1 ">
          <span className="badge badge-secondary text-xs py-3 w-full">
            {getLanguageFlag(user?.nativeLanguage)}
            Native: {user?.nativeLanguage}
          </span>
          <span className="badge badge-outline text-xs py-3 w-full ">
            {getLanguageFlag(user?.learningLanguage)}
            Learning: {user?.learningLanguage}
          </span>
        </div>
        <div className="mb-3">{user.bio && <span className="text-sm">{user?.bio}</span>}</div>
        {/* CONTACT BUTTON */}
        <div>
          <button
            className="btn btn-outline  btn-sm w-full h-9"
            onClick={handleClick}
            disabled={!isFriend && hasRequestBeenSent}
          >
            {renderButtonContent()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactCard;
