import { supabase } from "./Supabase";

const fetchProfiles = async () => {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error) console.error("❌ Error:", error.message);
  else console.log("Profiles:", data);
};

fetchProfiles();
