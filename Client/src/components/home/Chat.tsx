import { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input"; // Adjust import path as needed
import { Button } from "@/components/ui/button"; // Adjust import path as needed
// Adjust import path as needed
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import FetchApiWrapper from "@/utils/FetchApiWrapper";
import ChatHeader from "../utils/ChatHeader";
import ChatDisplay from "../utils/ChatDisplay";
import { Socket } from "socket.io-client";

interface Message {
  _id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: Date;
  timeStamp: Date;
  updatedAt?: Date;
}

interface RegisterResponse {
  userId: string;
  socketId: string;
}

type ContextType = { socket: Socket | null; activeUsers: [] | null };

const Chat = () => {
  const dispatch: AppDispatch = useDispatch();

  const { socket, activeUsers } = useOutletContext<ContextType>();

  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);

  const { _id } = useSelector((state: RootState) => state.user.data);
  const { id: chatPartnerId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const [loading, setLoading] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatPartnerIdRef = useRef(chatPartnerId); // Create a ref for chatPartnerId

  useEffect(() => {
    chatPartnerIdRef.current = chatPartnerId; // Update ref value whenever chatPartnerId changes
  }, [chatPartnerId]);

  const handleFetchMore = useCallback(async () => {
    setLoading(true);
    if (!nextCursor || !chatPartnerId) return;
    const url = new URL(`http://localhost:3000/api/messages/history`);
    url.searchParams.set("nextCursor", nextCursor);
    url.searchParams.set("senderId", _id);
    url.searchParams.set("receiverId", chatPartnerId);
    // console.log("url", url);
    const { response, data } = await FetchApiWrapper(url, {}, dispatch);
    if (response.ok) {
      const { data: messages, nextCursor, success } = data;

      if (success) {
        setMessages((prevMessages) => [...prevMessages, ...messages]);
        setNextCursor(nextCursor);
        setHasMoreMessages(() => (nextCursor == null ? false : true));
      }
    }
    setLoading(false);
  }, [dispatch, nextCursor, _id, chatPartnerId]);

  const fetchMessages = useCallback(async () => {
    const url = new URL(`http://localhost:3000/api/messages/history`);
    url.searchParams.append("senderId", _id);
    url.searchParams.append("receiverId", chatPartnerId ?? "");
    const { response, data } = await FetchApiWrapper(url, {}, dispatch);
    // console.log("data", data);
    if (response.ok) {
      // console.log("data in response", data.data);
      const { nextCursor } = data;
      setNextCursor(nextCursor);
      setHasMoreMessages(nextCursor ? true : false);
      setMessages(data.data);
    }
  }, [chatPartnerId, dispatch, _id]);

  useEffect(() => {
    setMessages([]);
    setHasMoreMessages(true);
    setNextCursor(null);
    setLoading(false);

    fetchMessages();
  }, [chatPartnerId, fetchMessages]);

  useEffect(() => {
    if (!socket) return;
    // chatPartner is same as first as we don't want to reruns everytime chatPartnerId
    // changes so chatPartner remeain same even when click to next user and this causes pro
    // blem in "send-msg" socket event so we are going to use useRef
    // const newSocket = io("http://localhost:3000");
    // setSocket(newSocket);

    // socket.on("connect", () => {
    //   console.log("Connected to the server in Chat.tsx:");
    //   socket.emit("register", { _id });
    // });

    socket.on("new-user-connected", (data: RegisterResponse) => {
      console.log("new-user-connected", data);
    });

    socket.on("new-user-connected-notice", (data) => {
      console.log("new-user-connected-notice : ", data);
    });

    socket.on("user-disconnected", (data) => {
      console.log("user-disconnected", data);
    });

    socket.on("user-disconnected-notice", (data) => {
      console.log("user-disconnected-notice", data);
    });

    socket.on("receive-message", (data: Message) => {
      // console.log(_id, chatPartnerId);
      // console.log("chatPartnerIdRef", chatPartnerIdRef.current);
      console.log("receive-message", data);
      if (data.senderId == _id && data.receiverId == chatPartnerIdRef.current) {
        // console.log("here is it up");
        setMessages((prevState) => [data, ...prevState]);
      }
      if (data.senderId == chatPartnerIdRef.current && data.receiverId == _id) {
        // console.log("here is it down");
        setMessages((prevState) => [data, ...prevState]);
      }
    });

    // socket.on("disconnect", () => {
    //   console.log("Disconnected from the server");
    // });

    socket.on("chat-message", (data: Message) => {
      console.log("chat-message in client", data);
    });
    // Cleanup on component unmount
    // return () => {
    //   socket.disconnect();
    // };
  }, [_id, socket]);

  const socketSendMessage = () => {
    if (socket) {
      socket.emit("send-msg", {
        content: newMessage,
        senderId: _id,
        isGroupMessage: false,
        receiverId: chatPartnerIdRef.current,
        timeStamp: Date.now(), // Add this to help with creating unique keys
      });
      setNewMessage("");
    }
  };

  return (
    <div
      className="p-4 h-screen grid"
      style={{ gridTemplateRows: "75px 1fr 75px" }}
    >
      <ChatHeader
        isActive={
          activeUsers != null && activeUsers.includes(chatPartnerId) ? 10 : 0
        }
        id={chatPartnerId}
        activeMembers={null}
        url={new URL(`http://localhost:3000/api/auth/get-user`)}
      />
      <ChatDisplay
        scrollTimeoutRef={scrollTimeoutRef}
        loading={loading}
        messages={messages}
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
              socketSendMessage();
            }
          }}
          className="flex-1 mr-2 border-2 border-black"
        />
        <Button className="px-10" onClick={socketSendMessage}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default Chat;
