import { RootState } from "@/store/store";
import { useCallback, useEffect, useRef } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useSelector } from "react-redux";

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

type ChatDisplayProps = {
  messages: Message[];
  loading: boolean;
  handleFetchore: any;
  hasMoreMessages: boolean;
  scrollTimeOutRef: NodeJS.Timeout | null;
};

const ChatDisplay = ({
  messages,
  hasMoreMessages,
  scrollTimeoutRef,
  loading,
  handleFetchMore,
}: ChatDisplayProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  console.log("dispalying in chatDispaly");
  const { _id } = useSelector((state: RootState) => state.user.data);

  const handleScroll = useCallback(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    console.log(
      "scrollAre.scrollTop == 0",
      scrollArea.scrollTop,
      scrollAreaRef.current
    );

    // Check if the user has reached the top of the scrollable area
    if (scrollArea.scrollTop === 0 && hasMoreMessages && !loading) {
      scrollTimeoutRef.current = setTimeout(() => {
        handleFetchMore();
      }, 1000); // Adding a slight delay to prevent rapid firing
    }
  }, [hasMoreMessages, loading, handleFetchMore, scrollTimeoutRef]);

  useEffect(() => {
    console.log("scrollAreaRef", scrollAreaRef.current);
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      scrollArea.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (scrollArea) {
        scrollArea.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  return (
    <div
      ref={scrollAreaRef}
      className="bg-gray-100 justify-end items-end  p-4 rounded-lg shadow-sm overflow-y-auto"
    >
      {!hasMoreMessages && (
        <div className="text-gray-400 my-4 text-center">
          You have reached the end of messages
        </div>
      )}
      <InfiniteScroll
        next={handleFetchMore}
        dataLength={messages.length}
        hasMore={hasMoreMessages}
        style={{ display: "flex", flexDirection: "column-reverse" }}
        inverse={true} // Reverse scroll direction
        loader={
          <div className="flex justify-center items-center text-red-500">
            <p>loading...</p>
          </div>
        }
        scrollableTarget="scrollAreaRef"
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
      </InfiniteScroll>
    </div>
  );
};

export default ChatDisplay;
