// backend/Supabase/LiveSearch.ts

import { supabase } from "./Supabase";

/**
 * Live search for users with partial matching
 * Returns array of users matching the search term
 */
export const liveSearchUsers = async (input: string, limit: number = 10) => {
  try {
    if (input.trim().length === 0) return [];

    if (input.startsWith("@")) {
      // Username search - when query starts with @
      const username = input.slice(1).toLowerCase();
      console.log(`Username search for: "${username}"`);

      const { data, error } = await supabase
        .from("profiles")
        .select("username, wallet_address, avatar, name")
        .ilike("username", `${username}%`) // Partial match from beginning
        .limit(limit);

      if (error) {
        console.log("❌ Username search error:", error.message);
        return [];
      }

      console.log(
        `Found ${data?.length || 0} users for username: "${username}"`
      );
      if (data && data.length > 0) {
        console.log(
          "Username search results:",
          data.map((u) => u.username)
        );
      }
      return data || [];
    } else {
      // General search - search across name, username, and wallet address
      const searchTerm = input.trim();
      // Search across multiple fields: name, username, and wallet_address
      const { data, error } = await supabase
        .from("profiles")
        .select("username, wallet_address, avatar, name")
        .or(
          `name.ilike.%${searchTerm}%,username.ilike.%${searchTerm.toLowerCase()}%,wallet_address.ilike.%${searchTerm}%`
        )
        .limit(limit);

      if (error) {
        console.log("❌ General search error:", error.message);
        return [];
      }

      console.log(
        `Found ${data?.length || 0} users for general search: "${searchTerm}"`
      );

      return data || [];
    }
  } catch (err) {
    console.error("❌ Live search unexpected error:", err);
    return [];
  }
};
