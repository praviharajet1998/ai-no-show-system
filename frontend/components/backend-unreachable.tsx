import { ApiError } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function BackendUnreachable({ error }: { error: unknown }) {
  const message =
    error instanceof ApiError
      ? `Backend error (${error.status}): ${error.message}`
      : "Could not reach the backend API.";
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Can&apos;t load this page</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Make sure the FastAPI backend is running and BACKEND_API_URL is set correctly.
        </CardContent>
      </Card>
    </div>
  );
}
