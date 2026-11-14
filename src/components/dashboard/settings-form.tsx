import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, errorMessage } from "@/lib/api-client";
import type { GlobalSettings } from "@/lib/settings";

export function SettingsForm() {
  const [tcpCheckerUrl, setTcpCheckerUrl] = useState("");
  const [checkInterval, setCheckInterval] = useState(5);
  const [busy, setBusy] = useState<"loading" | "saving" | "testing" | null>(
    "loading"
  );

  useEffect(() => {
    apiFetch<GlobalSettings>("/api/settings")
      .then((settings) => {
        setTcpCheckerUrl(settings.tcpCheckerUrl);
        setCheckInterval(settings.defaultMonitoringInterval);
      })
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => setBusy(null));
  }, []);

  const handleSave = async () => {
    setBusy("saving");
    try {
      await apiFetch("/api/settings", {
        json: {
          defaultMonitoringInterval: checkInterval,
          tcpCheckerUrl: tcpCheckerUrl.trim(),
        },
        method: "POST",
      });
      toast.success("Settings saved");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const handleTest = async () => {
    setBusy("testing");
    try {
      const { responseTime } = await apiFetch<{ responseTime: number }>(
        "/api/settings/test-tcp",
        { json: { tcpCheckerUrl: tcpCheckerUrl.trim() }, method: "POST" }
      );
      toast.success(
        `TCP checker works (reached 1.1.1.1:53 in ${responseTime}ms)`
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="checkInterval">Check interval (minutes)</Label>
        <Input
          disabled={busy === "loading"}
          id="checkInterval"
          min={5}
          onChange={(e) => setCheckInterval(e.target.valueAsNumber)}
          type="number"
          value={Number.isNaN(checkInterval) ? "" : checkInterval}
        />
        <p className="text-muted-foreground text-xs">
          How often every service is checked. Minimum 5 minutes.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tcpCheckerUrl">TCP Checker Service URL</Label>
        <Input
          disabled={busy === "loading"}
          id="tcpCheckerUrl"
          onChange={(e) => setTcpCheckerUrl(e.target.value)}
          placeholder="https://your-tcp-checker.example.com"
          type="url"
          value={tcpCheckerUrl}
        />
        <p className="text-muted-foreground text-xs">
          Cloudflare Workers can't monitor TCP ports directly, so TCP services
          are checked through this small external service.{" "}
          <a
            className="underline"
            href="https://github.com/mortezaom/relay-tcp"
            rel="noopener noreferrer"
            target="_blank"
          >
            Get the TCP checker →
          </a>
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          disabled={busy !== null || !tcpCheckerUrl}
          onClick={handleTest}
          variant="outline"
        >
          {busy === "testing" ? "Testing..." : "Test Connection"}
        </Button>
        <Button disabled={busy !== null} onClick={handleSave}>
          {busy === "saving" ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
