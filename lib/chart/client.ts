import type {
  ErrorResponse,
  GenerateChartInput,
  GeneratedChartSuccess,
} from "./types";

async function parseErrorResponse(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as ErrorResponse;

    if (
      payload !== null &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
    ) {
      return payload.error;
    }
  }

  const text = await response.text();

  return text || "Request failed";
}

export async function generateChartRequest(
  input: GenerateChartInput
): Promise<GeneratedChartSuccess> {
  const response = await fetch("/api/chart/create", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return (await response.json()) as GeneratedChartSuccess;
}
