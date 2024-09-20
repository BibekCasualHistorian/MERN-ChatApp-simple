import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import FetchApiWrapper from "@/utils/FetchApiWrapper";
import { io, Socket } from "socket.io-client";
// import "react-chat-elements/dist/main.css";
// import { MessageBox } from "react-chat-elements";

type Group = {
  _id: string;
  name: string;
  members: [];
  admin: string;
};

type GroupMessage = {
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

  const { _id } = useSelector((state: RootState) => state.user.data);

  const [socket, setSocket] = useState<Socket | null>();

  const [newMessage, setNewMessage] = useState("");

  const [groupMessages, setGroupMessages] = useState<[]>([]);
  const [group, setGroup] = useState<Group | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const idRef = useRef(id); // Create a ref for chatPartnerId

  // get group
  useEffect(() => {
    // console.log("id", id);
    const url = new URL(
      `http://localhost:3000/api/groups/get-group-by-id/${id}`
    );
    const fetchData = async () => {
      const { response, data } = await FetchApiWrapper(url, {}, dispatch);
      // console.log("real", response, data);
      if (response.ok) {
        setGroup(data.data);
      }
    };
    fetchData();
  }, [id, dispatch]);

  // console.log("isGroupMessage", groupMessages);

  // get messagaes from groups
  useEffect(() => {
    const url = new URL(
      `http://localhost:3000/api/groups/get-group-messages/${id}`
    );
    const fetchData = async () => {
      const { response, data } = await FetchApiWrapper(url, {}, dispatch);
      // console.log("response, data", response, data);
      if (response.ok) {
        setGroupMessages(data.data);
      }
    };
    fetchData();
  }, [id, dispatch]);

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
      <div className=" flex item-center rounded-lg p-1.5 mb-4 bg-gray-100">
        {/* Avatar */}
        <Avatar className="w-12 h-12 mr-3">
          <AvatarImage alt={group?.name || "U"} />
          <AvatarFallback>{group?.name?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        {/* Friend Info */}
        <div className="flex flex-col gap-0">
          <h2 className="text-lg font-semibold">
            {group?.name || "unavaible"}
          </h2>
          <p className="text-xs text-gray-500">{"Offline"}</p>
        </div>
      </div>
      <ScrollArea
        ref={scrollAreaRef}
        className="bg-gray-100 justify-end items-end  p-4 rounded-lg shadow-sm overflow-y-auto"
      >
        <div className="p-2 rounded-lg space-y-2 flex flex-col-reverse ">
          {groupMessages.map((each: GroupMessage) => (
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
