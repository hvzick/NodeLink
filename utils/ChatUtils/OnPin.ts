import { ChatItemType } from "./ChatItems"; 

export const handlePin = (
  id: string,
  setPinnedChats: React.Dispatch<React.SetStateAction<string[]>>, 
  setChatList: React.Dispatch<React.SetStateAction<ChatItemType[]>>
) => {
  setPinnedChats((prevPinned) => {
    const isPinned = prevPinned.includes(id);
    const updatedPinned = isPinned 
      ? prevPinned.filter((chatId) => chatId !== id) 
      : [...prevPinned, id];

    // Update the chat list based on new pinned state
    setChatList((prevChats) => {
      return [...prevChats].sort((a, b) => {
        const aPinned = updatedPinned.includes(a.id) ? 1 : 0;
        const bPinned = updatedPinned.includes(b.id) ? 1 : 0;
        return bPinned - aPinned; // Move pinned chats to the top
      });
    });

    return updatedPinned;
  });
};
