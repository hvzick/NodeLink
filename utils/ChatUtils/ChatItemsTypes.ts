// In your ChatItemsTypes.ts file, add:
export interface ChatItemType {
  id: string;
  name: string;
  message: string;
  time: string;
  avatar: any;
  unreadCount?: number; // Add this field
}
