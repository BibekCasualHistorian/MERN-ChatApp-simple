import { useState, useEffect, useCallback, useMemo } from "react";
import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import FetchApiWrapper from "@/utils/FetchApiWrapper";

import { Link, Outlet, useLocation, useParams } from "react-router-dom";

import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { io } from "socket.io-client";

type Friend = {
  _id: string;
  username: string;
  latestMessage: string;
  time: string;

  avatarUrl: string;
};

type Group = {
  _id: string;
  name: string;
  members: [];
  admin: string;
};

const Home = () => {
  const dispatch: AppDispatch = useDispatch();
  const params = useParams();
  const [groupName, setGroupName] = useState("");

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const state = useSelector((state: RootState) => state.user);

  const { _id } = state.data;
  const location = useLocation();

  // Track window width state and minimize re-renders
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const [socket, setSocket] = useState(null);

  const [activeUsers, setActiveUsers] = useState([]);

  // console.log("socket in home: ", socket);

  useEffect(() => {
    if (socket) return;
    const newSocket = io("http://localhost:3000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to server in top");
      newSocket.emit("register", { _id: _id });
    });

    newSocket.on("active-users", (data) => {
      setActiveUsers(data);
      // console.log(data);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    return () => {
      newSocket.disconnect();
    };
  }, [_id]);

  const handleResize = useCallback(() => {
    const newIsMobile = window.innerWidth < 768;
    if (newIsMobile !== isMobile) {
      setIsMobile(newIsMobile);
    }
  }, [isMobile]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  useEffect(() => {
    const fetchUsers = async () => {
      const url = new URL(
        "http://localhost:3000/api/groups/get-groups-for-user"
      );

      const { response, data } = await FetchApiWrapper(
        url,
        { method: "GET" },
        dispatch
      );
      if (response.ok) {
        setGroups(data.data);
      }
    };

    fetchUsers();
  }, [dispatch, state.data._id]);

  // Fetch users and filter them
  useEffect(() => {
    const fetchUsers = async () => {
      const url = new URL("http://localhost:3000/api/auth/get-all-users");

      const { response, data } = await FetchApiWrapper(
        url,
        { method: "GET" },
        dispatch
      );
      if (response.ok) {
        const filteredUsers = data.data.filter(
          (each: any) => each._id !== state.data._id
        );
        setUsers(filteredUsers);
      }
    };

    fetchUsers();
  }, [dispatch, state.data._id]);

  const handleUserChange = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleGroupCreate = async () => {
    try {
      const url = new URL(`http://localhost:3000/api/groups/create`);
      const { response, data } = await FetchApiWrapper(
        url,
        {
          method: "POST",

          body: JSON.stringify({
            name: groupName,
            members: [...selectedUsers, _id],
            createdBy: _id,
          }),
        },
        dispatch
      );

      if (response.ok) {
        console.log("Group created successfully:", data);
        // Optionally, you might want to close the dialog or reset the state here
        setGroupName("");
        setSelectedUsers([]);
      } else {
        console.error("Failed to create group:", data.message);
        // Handle the error here (e.g., show an error message)
      }
    } catch (error) {
      console.error("An error occurred:", error);
      // Handle the error here (e.g., show an error message)
    }
  };

  return (
    <div className="grid grid-cols-5">
      {((isMobile && location.pathname == "/") || !isMobile) && (
        <div className="col-span-full md:col-span-2 h-screen p-4 border-r border-gray-200 bg-white ">
          <div className="flex my-2 items-center justify-between px-3">
            <h2 className="text-lg font-semibold ">Friends ({users.length})</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Make Group</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex justify-center">
                    Make a Group
                  </DialogTitle>
                  <DialogDescription className="text-center">
                    write the name of your group and select members
                  </DialogDescription>
                </DialogHeader>
                <div>
                  <Input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Group Name..."
                  />
                  <br />
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select-users" />
                    </SelectTrigger>
                    <SelectContent aria-multiselectable>
                      {" "}
                      {users.map((friend: Friend) => (
                        <div key={friend._id} className="flex items-center p-2">
                          <input
                            type="checkbox"
                            id={friend._id}
                            checked={selectedUsers.includes(friend._id)}
                            onChange={() => handleUserChange(friend._id)}
                            className="mr-2"
                          />
                          <label htmlFor={friend._id} className="text-sm">
                            {friend.username}
                          </label>
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button className="w-full mt-4" onClick={handleGroupCreate}>
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <ScrollArea className="">
            {users.map((friend: Friend) => {
              const { _id, username } = friend;
              const isOnline = activeUsers.includes(friend._id);
              return (
                <Link
                  key={_id}
                  to={`/chat/${_id}`}
                  className={`${
                    _id == params.id && "bg-gray-200"
                  } grid grid-cols-12  items-center p-3 my-1 rounded-lg shadow-sm hover:bg-gray-100 transition cursor-pointer`}
                >
                  <div
                    className="grid col-span-11 gap-4 items-center "
                    style={{ gridTemplateColumns: "44px 1fr" }}
                  >
                    {/* Avatar */}
                    <Avatar className="w-12 h-12 mr-3">
                      <AvatarImage alt={username} />
                      <AvatarFallback>{username.charAt(0)}</AvatarFallback>
                    </Avatar>

                    {/* Name and Latest Message */}
                    <div className=" flex-1 overflow-hidden">
                      <p className="text-sm mb-0.5  font-semibold overflow-hidden text-ellipsis">
                        {username}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {"Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2">
                    {/* Time */}
                    {/* <span className="text-xs text-gray-400">
                  {time || "U"}
                </span> */}

                    {/* Online/Offline Indicator */}
                    <span
                      className={`h-3 w-3 rounded-full ${
                        isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                    ></span>
                  </div>
                </Link>
              );
            })}
          </ScrollArea>

          {/* // groups  */}
          <div>
            <h1 className="text-1.5xl font-bold mt-3 mb-2 px-3">
              Groups ({groups.length})
            </h1>
            <div>
              {groups.map((group: Group) => {
                // console.log("group", group);
                const { _id: groupID, username, members } = group;
                const isOnline = members.some(
                  (member) => member !== _id && activeUsers.includes(member)
                );
                // console.log("isOneline", groupID, members, isOnline);
                return (
                  <Link
                    key={groupID}
                    to={`/group/${groupID}`}
                    className={`${
                      groupID == params.id && "bg-gray-200"
                    } flex items-center justify-between p-3  rounded-lg shadow-sm hover:bg-gray-100 transition cursor-pointer`}
                  >
                    <div className="flex items-center">
                      {/* Avatar */}
                      <Avatar className="w-12 h-12 mr-3">
                        <AvatarImage alt={username} />
                        <AvatarFallback>
                          {group?.name.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>

                      {/* Name and Latest Message */}
                      <div>
                        <p className="text-sm font-semibold overflow-hidden">
                          {group?.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {"Unknown"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Time */}
                      {/* <span className="text-xs text-gray-400">{time}</span> */}

                      {/* Online/Offline Indicator */}
                      <span
                        className={`h-3 w-3 rounded-full ${
                          isOnline ? "bg-green-500" : "bg-gray-400"
                        }`}
                      ></span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {((isMobile &&
        (location.pathname.includes("chat") ||
          location.pathname.includes("group"))) ||
        !isMobile) && (
        <div className="col-span-full md:col-span-3 h-screen">
          <Outlet context={{ socket, activeUsers }} />
        </div>
      )}
    </div>
  );
};

export default Home;
