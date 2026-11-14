import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { type ServiceInput, serviceSchema } from "@/data/services-data";
import type { ServiceWithStatus } from "@/data/services-storage";
import { apiFetch, errorMessage } from "@/lib/api-client";

const DEFAULT_PORTS = { http: 80, https: 443 } as const;

export function ServiceDialog({
  service,
  onOpenChange,
  onSaved,
}: {
  service: ServiceWithStatus | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (service: ServiceWithStatus) => void;
}) {
  const form = useForm<ServiceInput>({
    defaultValues: service
      ? {
          address: service.address,
          id: service.id,
          name: service.name,
          port: service.port,
          public: service.public,
          showAddress: service.showAddress,
          type: service.type,
        }
      : {
          address: "",
          name: "",
          port: 443,
          public: true,
          showAddress: false,
          type: "https",
        },
    resolver: zodResolver(serviceSchema),
  });

  const onSubmit = async (values: ServiceInput) => {
    try {
      const saved = await apiFetch<ServiceWithStatus>("/api/services", {
        json: values,
        method: "POST",
      });
      toast.success("Service saved");
      // keep the known status fields until the next refresh
      onSaved({ ...service, ...saved, history: service?.history ?? [] });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form
            className="flex w-full flex-col space-y-8"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <DialogHeader>
              <DialogTitle>{service ? "Edit" : "Add"} Service</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Website" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="example.com | 10.0.0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={(type: ServiceInput["type"]) => {
                        field.onChange(type);
                        if (type !== "tcp") {
                          form.setValue("port", DEFAULT_PORTS[type]);
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl className="w-full">
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="w-full">
                        <SelectItem value="https">HTTPS</SelectItem>
                        <SelectItem value="http">HTTP</SelectItem>
                        <SelectItem value="tcp">TCP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {field.value === "tcp" && (
                      <p className="text-sub border-main mt-2 border-l-2 pl-3 text-xs">
                        TCP checks, and HTTP on ports other than 80/443, go
                        through your TCP checker (Settings → monitoring).{" "}
                        <a
                          className="text-main underline underline-offset-4"
                          href="https://github.com/mortezaom/relay-tcp"
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          Deploy the checker
                        </a>
                      </p>
                    )}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="443"
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        value={Number.isNaN(field.value) ? "" : field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {(
                [
                  ["public", "Show on the public status page"],
                  ["showAddress", "Show its address to visitors"],
                ] as const
              ).map(([name, label]) => (
                <FormField
                  control={form.control}
                  key={name}
                  name={name}
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                className="flex w-28 items-center"
                disabled={form.formState.isSubmitting}
                type="submit"
              >
                {form.formState.isSubmitting && (
                  <Loader2Icon className="animate-spin" />
                )}
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
