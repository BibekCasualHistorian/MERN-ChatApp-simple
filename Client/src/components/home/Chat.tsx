import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Input } from "@/components/ui/input"; // Adjust import path as needed
import { Button } from "@/components/ui/button"; // Adjust import path as needed
import { ScrollArea } from "@/components/ui/scroll-area"; // Adjust import path as needed
import { io, Socket } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import FetchApiWrapper from "@/utils/FetchApiWrapper";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

type Friend = {
  _id: string;
  username: string;
};

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

const Chat = () => {
  const dispatch: AppDispatch = useDispatch();

  const [friend, setFriend] = useState<Friend | null>(null);

  const { _id } = useSelector((state: RootState) => state.user.data);
  const { id: chatPartnerId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>();

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const chatPartnerIdRef = useRef(chatPartnerId); // Create a ref for chatPartnerId

  useEffect(() => {
    chatPartnerIdRef.current = chatPartnerId; // Update ref value whenever chatPartnerId changes
  }, [chatPartnerId]);

  useEffect(() => {
    const url = new URL(
      `http://localhost:3000/api/auth/get-user/${chatPartnerId}`
    );

    const fetchData = async () => {
      const { response, data } = await FetchApiWrapper(url, {}, dispatch);
      // console.log("data", data);
      if (response.ok) {
        // console.log("data in response", data.data);
        setFriend(data.data);
      }
    };
    fetchData();
  }, [chatPartnerId, dispatch]);

  useEffect(() => {
    setMessages([]);
    const url = new URL(`http://localhost:3000/api/messages/history`);
    url.searchParams.append("senderId", _id);
    url.searchParams.append("receiverId", chatPartnerId ?? "");
    const fetchData = async () => {
      const { response, data } = await FetchApiWrapper(url, {}, dispatch);
      // console.log("data", data);
      if (response.ok) {
        // console.log("data in response", data.data);
        const { messages } = data.data;
        setMessages(messages);
      }
    };
    fetchData();
  }, [dispatch, _id, chatPartnerId]);

  // useEffect(() => {
  //   const url = new URL(URLWithSameChatPartnerId);
  //   const fetchData = async () => {
  //     const { response, data } = await FetchApiWrapper(url, {}, dispatch);
  //     // console.log("data", data);
  //     if (response.ok) {
  //       // console.log("data in response", data.data);
  //       const { messages } = data.data;
  //       console.log("message in response", messages);
  //       setMessages((prevMessages) => {
  //         const newMessages = messages.filter(
  //           (newMsg: any) =>
  //             !prevMessages.some((oldMsg) => oldMsg._id === newMsg._id)
  //         );
  //         return [...newMessages, ...prevMessages];
  //       });
  //     }
  //   };
  //   fetchData();
  // }, [dispatch, _id, URLWithSameChatPartnerId]);

  // console.log("socket", socket);

  // console.log("messages", messages);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // chatPartner is same as first as we don't want to reruns everytime chatPartnerId
    // changes so chatPartner remeain same even when click to next user and this causes pro
    // blem in "send-msg" socket event so we are going to use useRef
    const newSocket = io("http://localhost:3000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to the server:");
      newSocket.emit("register", { _id });
    });

    newSocket.on("new-user-connected", (data: RegisterResponse) => {
      console.log("new-user-connected", data);
    });

    newSocket.on("new-user-connected-notice", (data) => {
      console.log("new-user-connected-notice : ", data);
    });

    newSocket.on("user-disconnected", (data) => {
      console.log("user-disconnected", data);
    });

    newSocket.on("user-disconnected-notice", (data) => {
      console.log("user-disconnected-notice", data);
    });

    newSocket.on("receive-message", (data: Message) => {
      console.log(_id, chatPartnerId);
      console.log("chatPartnerIdRef", chatPartnerIdRef.current);
      console.log("receive-message", data);
      if (data.senderId == _id && data.receiverId == chatPartnerIdRef.current) {
        console.log("here is it up");
        setMessages((prevState) => [data, ...prevState]);
      }
      if (data.senderId == chatPartnerIdRef.current && data.receiverId == _id) {
        console.log("here is it down");
        setMessages((prevState) => [data, ...prevState]);
      }
    });

    // newSocket.on("disconnect", () => {
    //   console.log("Disconnected from the server");
    // });

    newSocket.on("chat-message", (data: Message) => {
      console.log("chat-message in client", data);
    });
    // Cleanup on component unmount
    return () => {
      newSocket.disconnect();
    };
  }, [_id]);

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

  console.log("Messages", messages);

  return (
    <div
      className="p-4 h-screen grid"
      style={{ gridTemplateRows: "75px 1fr 75px" }}
    >
      <div className=" flex item-center rounded-lg p-1.5 mb-4 bg-gray-100">
        {/* Avatar */}
        <Avatar className="w-12 h-12 mr-3">
          <AvatarImage alt={friend?.username || "U"} />
          <AvatarFallback>{friend?.username?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        {/* Friend Info */}
        <div className="flex flex-col gap-0">
          <h2 className="text-lg font-semibold">
            {friend?.username || "unavaible"}
          </h2>
          <p className="text-xs text-gray-500">{"Offline"}</p>
        </div>
      </div>
      <ScrollArea
        ref={scrollAreaRef}
        className="bg-gray-100 justify-end items-end  p-4 rounded-lg shadow-sm overflow-y-auto"
      >
        <div className=" p-2 rounded-lg  space-y-2 flex flex-col-reverse ">
          {messages.map((each) => (
            <div
              key={`${each.timeStamp}`}
              className={`flex w-4/5 ${
                each.senderId === _id
                  ? "justify-end ml-auto"
                  : "justify-start mr-auto"
              }`}
            >
              <div
                className={`px-4 py-1 text-balance rounded-lg text-white ${
                  each.senderId === _id
                    ? "bg-blue-500"
                    : "bg-gray-500 text-black"
                }`}
              >
                <p>{each.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
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
