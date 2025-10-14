import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export const getUserRole = async (): Promise<AppRole | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;

    return data?.role || null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
};

export const checkAuth = async (): Promise<boolean> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error("Error checking auth:", error);
    return false;
  }
};

export const checkAdminRole = async (): Promise<boolean> => {
  const role = await getUserRole();
  return role ? ["okk", "sekjend", "ketum"].includes(role) : false;
};

export const checkDPDRole = async (): Promise<boolean> => {
  const role = await getUserRole();
  return role === "dpd";
};
