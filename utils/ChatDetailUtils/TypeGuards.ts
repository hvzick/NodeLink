import { Message } from "../../backend/Local database/SQLite/MessageStructure";

export const isMessage = (item: any): item is Message =>
  item && typeof item === "object" && "sender" in item && "id" in item; 