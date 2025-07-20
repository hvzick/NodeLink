import { useEffect } from "react";
import { initConversationTones } from "../../NotificationsSettings/ConversationTones";

export function useInitConversationTones() {
  useEffect(() => {
    initConversationTones();
  }, []);
}
