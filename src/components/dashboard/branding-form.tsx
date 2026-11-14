import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type BrandingSchemaType, brandingSchema } from "@/data/branding-data";
import { apiFetch, errorMessage } from "@/lib/api-client";
import type { Branding } from "@/lib/settings";
import BrandingFileUpload, { resizeLogo } from "./branding-file-upload";

export function BrandingForm({ data }: { data: Branding | null }) {
  // null = keep the current logo
  const [logo, setLogo] = useState<File | "removed" | null>(null);

  const form = useForm<BrandingSchemaType>({
    defaultValues: {
      announcement: data?.announcement ?? "",
      description: data?.description ?? "Uptime monitoring and status page",
      title: data?.title ?? "Pilotlight",
    },
    resolver: zodResolver(brandingSchema),
  });

  const onSubmit = async (values: BrandingSchemaType) => {
    try {
      const formData = new FormData();
      for (const [key, value] of Object.entries(values)) {
        formData.append(key, value);
      }
      if (logo) {
        formData.append(
          "image",
          logo === "removed" ? logo : await resizeLogo(logo)
        );
      }
      await apiFetch("/api/branding", { body: formData, method: "POST" });
      toast.success("Branding saved");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Form {...form}>
      <form
        className="flex w-full flex-col space-y-8"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="grid grid-cols-2 items-start gap-8">
          <div className="flex flex-col items-stretch gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Pilotlight" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="announcement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Announcement (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Scheduled maintenance on Sunday 02:00 UTC"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Shown above the live status, which is worked out
                    automatically from your services.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <BrandingFileUpload
              currentImage={data?.imageUrl ?? null}
              onChange={setLogo}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (SEO)</FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-24"
                    placeholder="Description for Search Engines"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-start">
          <Button
            className="flex w-full items-center px-10 py-5"
            disabled={form.formState.isSubmitting}
            type="submit"
            variant="outline"
          >
            {form.formState.isSubmitting && (
              <Loader2Icon className="animate-spin" />
            )}
            Submit
          </Button>
        </div>
      </form>
    </Form>
  );
}
