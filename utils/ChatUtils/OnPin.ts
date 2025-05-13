import { ChatItemType } from "./ChatItemsTypes"; 

export const handlePin = (
  id: string,
  setPinnedChats: React.Dispatch<React.SetStateAction<string[]>>, 
  setChatList: React.Dispatch<React.SetStateAction<ChatItemType[]>>
) => {
  setPinnedChats((prevPinned) => {
    const isPinned = prevPinned.includes(id);
    const updatedPinned = isPinned 
      ? prevPinned.filter((chatId) => chatId !== id) 
      : [id, ...prevPinned]; // Add new pinned chat at the beginning

    // Update the chat list based on new pinned state
    setChatList((prevChats) => {
      return [...prevChats].sort((a, b) => {
        const aPinned = updatedPinned.includes(a.id);
        const bPinned = updatedPinned.includes(b.id);
        
        // If both are pinned, sort by their position in updatedPinned array
        if (aPinned && bPinned) {
          return updatedPinned.indexOf(a.id) - updatedPinned.indexOf(b.id);
        }
        
        // If both are unpinned, sort by time
        if (!aPinned && !bPinned) {
          const aTime = new Date(a.time).getTime();
          const bTime = new Date(b.time).getTime();
          return bTime - aTime; // Most recent first
        }
        
        // Pinned chats go to the top
        return aPinned ? -1 : 1;
      });
    });

    return updatedPinned;
  });
};
