import { useQuery } from "@tanstack/react-query";
import React from "react";
import { getFriends } from "../lib/api";
import { Loader } from "lucide-react";
import NotUserFound from "../components/NotUserFound";
import ContactCard from "../components/ContactCard";
import Container from "../components/Container";

const FriendsPage = () => {
  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getFriends,
  });
  return (
    <Container>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Your Friends
        </h2>
      </div>

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
          {friends.map((friend: any) => {
            return (
              <ContactCard key={friend._id} user={friend} isFriend={true} />
            );
          })}
        </div>
      )}
    </Container>
  );
};

export default FriendsPage;
