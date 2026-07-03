import { MessagesPage } from "@/components/chat/MessagesPage";

export default function UserMessagesPage() {
  return <MessagesPage basePath="/userDashboard/messages" context="buyer" />;
}
