import { LogOutIcon } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, errorMessage } from "@/lib/api-client";

export function LogoutButton() {
  const logout = async () => {
    try {
      await apiFetch("/api/logout", { method: "POST" });
      window.location.assign("/login");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <button
      aria-label="Log out"
      className="hover:bg-accent cursor-pointer rounded-md p-2 transition-colors"
      onClick={logout}
      title="Log out (ends every session)"
      type="button"
    >
      <LogOutIcon className="size-5" />
    </button>
  );
}
