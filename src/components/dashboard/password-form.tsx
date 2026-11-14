import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, errorMessage } from "@/lib/api-client";

export function PasswordForm() {
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<
      string,
      string
    >;
    if (data.newPassword !== data.confirmPassword) {
      toast.error("The new passwords don't match");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/api/account/password", {
        json: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
        method: "POST",
      });
      form.reset();
      toast.success("Password changed. Other sessions were signed out.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="flex max-w-sm flex-col gap-4" onSubmit={onSubmit}>
      {(
        [
          ["currentPassword", "current password", "current-password"],
          ["newPassword", "new password (8+ characters)", "new-password"],
          ["confirmPassword", "repeat new password", "new-password"],
        ] as const
      ).map(([name, label, autoComplete]) => (
        <div className="flex flex-col gap-2" key={name}>
          <Label htmlFor={name}>{label}</Label>
          <Input
            autoComplete={autoComplete}
            id={name}
            minLength={name === "currentPassword" ? undefined : 8}
            name={name}
            required
            type="password"
          />
        </div>
      ))}
      <div>
        <Button disabled={busy} type="submit">
          {busy ? "changing…" : "change password"}
        </Button>
      </div>
    </form>
  );
}
