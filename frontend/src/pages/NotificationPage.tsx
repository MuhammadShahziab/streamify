import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptFriendRequest,
  getNotifications,
  markNotificationsAsRead,
} from "../lib/api";
import LoadingOverLay from "../components/LoadingOverLay";
import {
  BellIcon,
  ClockIcon,
  MessageSquareIcon,
  UserCheckIcon,
} from "lucide-react";
import Button from "../components/Button";
import { getLanguageFlag } from "../utils/getLanguageFlag";
import NotUserFound from "../components/NotUserFound";
import { useNotificationStore } from "../store/useNotificationStore";
import Container from "../components/Container";

const NotificationPage = () => {
  const queryClient = useQueryClient();
  const notifications = useNotificationStore((state) => state.notifications);
  const setNotifications = useNotificationStore(
    (state) => state.setNotifications
  );
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  const { isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    onSuccess: (data) => {
      setNotifications(data.notifications);
    },
  });

  const { mutate: acceptRequestMutation, isPending } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: async (_, requestId) => {
      // Refetch updated notifications
      const updatedData = await queryClient.fetchQuery({
        queryKey: ["notifications"],
        queryFn: getNotifications,
      });

      // Remove the accepted one locally (optional)
      const filtered = updatedData.notifications.filter(
        (notification) => notification.friendRequest?._id !== requestId
      );

      // ✅ Set the final array
      setNotifications(filtered);

      // Also refetch friends list
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const { mutate: markNotificationsReadMutation } = useMutation({
    mutationFn: markNotificationsAsRead,
    onSuccess: (data) => {
      setNotifications(data.notifications);
    },
  });

  useEffect(() => {
    if (notifications.length === 0) return;
    const hasUnread = notifications.some(
      (notification) => !notification.isRead
    );
    if (hasUnread) {
      markAllAsRead();
      markNotificationsReadMutation();
    }
  }, [notifications, markAllAsRead, markNotificationsReadMutation]);

    const incomingRequests = notifications.filter(
    (notification) =>
      notification.type === "friend_request" &&
      notification.friendRequest?.status === "pending"
  );
    const acceptedRequests = notifications.filter(
    (notification) => notification.type === "friend_request_accepted"
  );

  if (isLoading) {
    return <LoadingOverLay />;
  }

  return (
    <Container>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
        Notifications
      </h1>
      {incomingRequests.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <UserCheckIcon className="h-5 w-5 text-primary" />
            Friend Requests
            <span className="badge badge-primary ml-2">
              {incomingRequests.length}
            </span>
          </h2>

          <div className="space-y-3">
            {incomingRequests.map((notification) => {
              const friendRequest = notification.friendRequest;
              const sender = friendRequest?.sender;
              return (
                <div
                  key={notification._id}
                  className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="card-body p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="avatar w-14 h-14 rounded-full bg-base-300">
                          <img
                            src={sender?.profilePic}
                            alt={sender?.fullName}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold">{sender?.fullName}</h3>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <span className="badge badge-secondary badge-lg py-2 flex items-center text-sm gap-x-2 ">
                              Native: {getLanguageFlag(sender?.nativeLanguage)}
                            </span>
                            <span className="badge badge-outline badge-lg py-2 flex items-center text-sm gap-x-2">
                              Learning:{" "}
                              {getLanguageFlag(sender?.learningLanguage)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        loading={isPending}
                        onClick={() => {
                          if (friendRequest?._id) {
                            acceptRequestMutation(friendRequest._id);
                          }
                        }}
                        className="w-32"
                        size="sm"
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      {acceptedRequests.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BellIcon className="h-5 w-5 text-success" />
            New Connections
          </h2>

          <div className="space-y-3">
            {acceptedRequests.map((notification) => {
              const recipient = notification.friendRequest?.recipient;
              return (
                <div
                  key={notification._id}
                  className="card bg-base-200 shadow-sm"
                >
                  <div className="card-body p-4">
                    <div className="flex items-start gap-3">
                      <div className="avatar mt-1 size-10 rounded-full">
                        <img
                          src={recipient?.profilePic}
                          alt={recipient?.fullName}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{recipient?.fullName}</h3>
                        <p className="text-sm my-1">
                          <span className="font-bold text-primary">
                            {recipient?.fullName}
                          </span>{" "}
                          accepted your friend request
                        </p>
                        <p className="text-xs flex items-center opacity-70">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {new Date(notification.createdAt).toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}{" "}
                        </p>
                      </div>
                      <div className="badge badge-lg py-2 badge-success">
                        <MessageSquareIcon className="h-3 w-3 mr-1" />
                        New Friend
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      {incomingRequests.length === 0 && acceptedRequests.length === 0 && (
        <NotUserFound
          title="No notifications yet"
          desc="When you receive friend requests or messages, they'll appear here."
        />
      )}
    </Container>
  );
};

export default NotificationPage;
