import { ChevronRight, Loader, UsersIcon } from "lucide-react";
import { Link } from "react-router";
import ContactCard from "../components/ContactCard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFriends,
  getOutGoingFriendReqs,
  getRecommendedUsers,
  sendFriendReq,
} from "../lib/api";
import NotUserFound from "../components/NotUserFound";
import { useEffect, useState } from "react";
import Button from "../components/Button";
import Container from "../components/Container";

const HomePage = () => {
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState<Set<string>>(
    new Set()
  );
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  // Get OutGoingFriendsReqs
  const { data: outGoingFriendReqs = [] } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutGoingFriendReqs,
  });

  // Get Friends
  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getFriends,
  });
  // Get recommended users
  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getRecommendedUsers,
  });
  //Send friend Request
  const { mutate: sendRequestMutation, isPending: pendingSendReq } =
    useMutation({
      mutationFn: async (userId: string) => {
        setLoadingUserId(userId);
        await sendFriendReq(userId);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
      },
      onSettled: () => {
        setLoadingUserId(null);
      },
    });

  useEffect(() => {
    if (outGoingFriendReqs?.length) {
      const ids = new Set<string>(
        outGoingFriendReqs.map((f: any) => f.recipient?._id)
      );
      setOutgoingRequestsIds(ids);
    }
  }, [outGoingFriendReqs]);

  return (
    <Container>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Your Friends
        </h2>
        <Link to={"/notifications"} className="btn btn-outline btn-sm ">
          <UsersIcon className="mr-2 size-4" />
          Friend Requests
        </Link>
      </div>
      <section>
        {loadingFriends ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin" />
          </div>
        ) : friends.length === 0 ? (
          <NotUserFound
            title="No friends yet"
            desc="Connect with language partners below to start practicing together!"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {friends.slice(0, 4).map((friend: any) => {
              return (
                <ContactCard key={friend._id} user={friend} isFriend={true} />
              );
            })}
          </div>
        )}
        {friends?.length > 4 && (
          <div className="w-full flex justify-end mt-5">
            <Link to={"/friends"}>
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-primary"
                rightIcon={<ChevronRight size={18} />}
              >
                Show More
              </Button>
            </Link>
          </div>
        )}
      </section>

      <section>
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Meet New Learners
              </h2>
              <p className="opacity-70">
                Discover perfect language exchange partners based on your
                profile
              </p>
            </div>
          </div>
        </div>
        {loadingUsers ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin" />
          </div>
        ) : recommendedUsers?.length === 0 ? (
          <NotUserFound
            title="No recommendations available"
            desc="Check back later for new language partner."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recommendedUsers?.map((user) => {
              const hasRequestBeenSent = outgoingRequestsIds.has(user?._id);
              return (
                <ContactCard
                  key={user?._id}
                  isLoading={loadingUserId === user?._id}
                  user={user}
                  hasRequestBeenSent={hasRequestBeenSent}
                  onSendRequest={(id) => sendRequestMutation(id)}
                />
              );
            })}
          </div>
        )}
      </section>
    </Container>
  );
};

export default HomePage;
