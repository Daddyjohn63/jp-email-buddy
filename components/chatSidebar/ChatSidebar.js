import Link from "next/link";
import { useEffect } from "react";

export const ChatSidebar = () => {
  useEffect(() => {
    const loadChatList = async () => {
      const response = await fetch(`/api/chat/getChatList`, {
        method: "POST",
      });
      const json = await response.json();
      console.log("CHAT LIST:", json);
    };
    loadChatList();
  }, []);
  return (
    <div className="flex flex-col overflow-hidden bg-gray-900 text-white">
      <Link href="/api/auth/logout" className="btn m-2 flex justify-center">
        Logout
      </Link>
    </div>
  );
};
