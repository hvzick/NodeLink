import { Message } from "../../backend/Local database/SQLite/MessageStructure";

export function addDateSeparators(messages: Message[]): (Message | { type: "date"; date: string; id: string })[] {
  const list: (Message | { type: "date"; date: string; id: string })[] = [];
  let lastDate = "";
  messages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt || parseInt(msg.id, 10));
    const dateString = msgDate.toDateString();
    if (dateString !== lastDate) {
      list.push({
        type: "date",
        date: msgDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
        id: `sep-${dateString}`,
      });
      lastDate = dateString;
    }
    list.push(msg);
  });
  return list;
}

export function mapMessagesById(messages: Message[]): Record<string, Message> {
  const map: Record<string, Message> = {};
  messages.forEach((msg) => {
    map[msg.id] = msg;
  });
  return map;
} 