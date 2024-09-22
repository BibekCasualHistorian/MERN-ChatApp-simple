import React, { useCallback, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { AppDispatch } from "@/store/store";
import { useDispatch } from "react-redux";
import FetchApiWrapper from "@/utils/FetchApiWrapper";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { FaArrowCircleLeft, FaBackspace } from "react-icons/fa";

interface ChatHeaderProps {
  id: string | undefined;
  url: URL;
}

interface FriendOrGroup {
  name?: string;
  username?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ id, url }) => {
  const [friendOrGroup, setFriendOrGroup] = useState<FriendOrGroup | null>(
    null
  );

  const dispatch = useDispatch<AppDispatch>();

  const fetchHeader = useCallback(async () => {
    if (!id) return;
    const apiUrl = new URL(`${url}/${id}`);
    const { response, data } = await FetchApiWrapper(apiUrl, {}, dispatch);
    if (response.ok && data) {
      setFriendOrGroup(data.data);
    }
  }, [id, dispatch, url]);

  useEffect(() => {
    fetchHeader();
  }, [fetchHeader]);

  const avatarName = friendOrGroup?.name || friendOrGroup?.username || "U";
  const displayName =
    friendOrGroup?.name || friendOrGroup?.username || "unavailable";

  return (
    <div className="flex items-center rounded-lg p-1.5 mb-4 bg-gray-100">
      <Link
        to={"/"}
        className="bg-white p-2 md:hidden rounded-lg px-2 border-2"
      >
        <FaArrowCircleLeft />
      </Link>
      {/* Avatar */}
      <Avatar className="w-12 h-12 mr-3 border-2 ml-3">
        <AvatarImage alt={avatarName} />
        <AvatarFallback>{avatarName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      {/* Friend Info */}
      <div className="flex flex-col gap-0">
        <h2 className="text-lg font-semibold">{displayName}</h2>
        <p className="text-xs text-gray-500">Offline</p>
      </div>
    </div>
  );
};

export default ChatHeader;
