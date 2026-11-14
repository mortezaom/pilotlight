import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type AuthFormType, authFormSchema } from "@/data/auth-form-data";
import { apiFetch, errorMessage } from "@/lib/api-client";

export default function AuthForm({
  isInitialized,
}: {
  isInitialized: boolean;
}) {
  const form = useForm<AuthFormType>({
    defaultValues: { email: "", password: "", secret: "" },
    resolver: zodResolver(authFormSchema),
  });

  const onSubmit = async (values: AuthFormType) => {
    try {
      await apiFetch(`/api/${isInitialized ? "login" : "setup"}`, {
        json: values,
        method: "POST",
      });
      toast.success(isInitialized ? "Logged in" : "Dashboard initialized");
      window.location.assign("/dashboard");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="auth@example.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="--------" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isInitialized && (
          <FormField
            control={form.control}
            name="secret"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Setup Secret</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="one-time-code"
                    placeholder="--------"
                    type="password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button
          className="flex w-full items-center"
          disabled={form.formState.isSubmitting}
          type="submit"
        >
          {form.formState.isSubmitting && (
            <Loader2Icon className="animate-spin" />
          )}
          {isInitialized ? "Login" : "Initialize"}
        </Button>
      </form>
    </Form>
  );
}
