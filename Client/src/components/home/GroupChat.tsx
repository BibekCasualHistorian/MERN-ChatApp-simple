import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import FetchApiWrapper from "@/utils/FetchApiWrapper";
import { io, Socket } from "socket.io-client";
import ChatHeader from "../utils/ChatHeader";
import ChatDisplay from "../utils/ChatDisplay";
// import "react-chat-elements/dist/main.css";
// import { MessageBox } from "react-chat-elements";

// type Group = {
//   _id: string;
//   name: string;
//   members: [];
//   admin: string;
// };

// type ResponseData = {
//   data: [];
//   success: boolean;
//   statusCode: number;
//   nextCursor: Date;
// };

type GroupMessage = {
  _id: string;
  senderId: string;
  groupId: string;
  receiverId: null;
  isRead: boolean;
  timeStamp: Date;
  content: string;
  isGroupMessage: boolean;
};

const GroupChat = () => {
  const { id } = useParams();
  const dispatch: AppDispatch = useDispatch();

  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  console.log("nextCursor", nextCursor);

  const [loading, setLoading] = useState<boolean>(false);

  const { _id } = useSelector((state: RootState) => state.user.data);

  const [socket, setSocket] = useState<Socket | null>();

  const [newMessage, setNewMessage] = useState("");

  const [groupMessages, setGroupMessages] = useState<[]>([]);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(id); // Create a ref for chatPartnerId
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(
    async (cursor: string | null = null) => {
      if (!id) return;
      setLoading(true);
      const url = new URL(
        `http://localhost:3000/api/groups/get-group-messages/${id}`
      );
      const { response, data } = await FetchApiWrapper(url, {}, dispatch);
      if (response.ok) {
        const { data: messages, nextCursor, success } = data;
        console.log(nextCursor, messages);
        if (success) {
          setGroupMessages((prevMessages) =>
            cursor ? [...prevMessages, ...messages] : messages
          );
          setHasMoreMessages(nextCursor == null ? false : true);
          setNextCursor(nextCursor);

          const scrollArea = scrollAreaRef.current;
          if (scrollArea) {
            scrollArea.scrollTop = scrollArea.scrollHeight;
          }
        }
      }
      setLoading(false);
    },
    [id, dispatch]
  );

  const handleFetchMore = useCallback(async () => {
    setLoading(true);
    const url = new URL(
      `http://localhost:3000/api/groups/get-group-messages/${id}`
    );
    url.searchParams.set("nextCursor", nextCursor);
    console.log("url", url);
    const { response, data } = await FetchApiWrapper(url, {}, dispatch);
    if (response.ok) {
      const { data: messages, nextCursor, success } = data;

      setGroupMessages((prevMessages) => [...prevMessages, ...messages]);
      setNextCursor(nextCursor);
      setHasMoreMessages(nextCursor == null ? false : true);
    }
    setLoading(false);
  }, [dispatch, id, nextCursor]);

  const handleSocketSendMessage = () => {
    if (socket) {
      socket.emit("send-msg", {
        content: newMessage,
        senderId: _id,
        isGroupMessage: true,
        groupId: id,
        timeStamp: Date.now(), // Add this to help with creating unique keys
      });
      setNewMessage("");
    }
  };

  // get Group

  // Initial message fetch on component mount (this will run only once)
  useEffect(() => {
    setGroupMessages([]);
    setHasMoreMessages(true);
    setNextCursor(null);
    fetchMessages(); // Fetch the first batch of messages on load
  }, [id, fetchMessages]);

  useEffect(() => {
    const newSocket = io("http://localhost:3000");
    setSocket(newSocket);

    // console.log("rendered main useEffect");

    newSocket.on("connect", () => {
      console.log("connected to server");
      newSocket.emit("register", { _id: _id });
      newSocket.emit("join-group", {
        groupId: idRef.current,
        userId: _id,
      });
    });

    newSocket.on("new-user-connected", (data) => {
      console.log("data in new-user-connected", data);
    });

    newSocket.on("room-joined", (data) => {
      console.log(data);
    });

    newSocket.on("room-joined-notice", (data) => {
      console.log(data);
    });

    // newSocket.on("");

    newSocket.on("disconnect", () => {
      console.log("disconencted from socket");
    });

    newSocket.on("group-left", (data) => {
      console.log(data);
    });

    newSocket.on("group-left-notice", (data) => {
      console.log(data);
    });

    newSocket.on("receive-message", (data) => {
      console.log("receive-group-message", data.data);
      const { isGroupMessage } = data.data;
      if (isGroupMessage) {
        setGroupMessages((prevState: []) => {
          console.log("prevState", prevState);
          return [data.data, ...prevState];
        });
      }
    });
    return () => {
      newSocket.disconnect();
    };
  }, [_id]);

  // for when we change the user so that groupId changes
  useEffect(() => {
    if (socket && id) {
      if (idRef.current == id) return;
      const data = { groupId: idRef.current, userId: _id };
      socket.emit("leave-group", data);

      console.log("Switching group from:", idRef.current, "to:", id);

      data.groupId = id;
      socket.emit("join-group", data);
    }

    idRef.current = id; // Update the id reference
  }, [socket, id, _id]);

  return (
    <div
      className="p-4 h-screen grid"
      style={{ gridTemplateRows: "75px 1fr 75px" }}
    >
      <ChatHeader
        id={id}
        url={new URL(`http://localhost:3000/api/groups/get-group-by-id`)}
      />
      <ChatDisplay
        scrollTimeoutRef={scrollTimeoutRef}
        loading={loading}
        messages={groupMessages}
        hasMoreMessages={hasMoreMessages}
        handleFetchMore={handleFetchMore}
      />
      <div className="flex rounded-lg items-center mt-3 px-3 w-full bg-gray-100">
        {/* Input field and Send button */}
        <Input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key == "Enter") {
              e.preventDefault();
              handleSocketSendMessage();
            }
          }}
          className="flex-1 mr-2 border-2 border-black"
        />
        <Button className="px-10" onClick={handleSocketSendMessage}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default GroupChat;
