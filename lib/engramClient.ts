import { EngramResponse } from "@/types/engram";

export async function askEngram(
  message: string
): Promise<EngramResponse> {
  const response = await fetch("/api/engram", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
    }),
  });

  return response.json();
}