import { chartSpecSchema } from "@/lib/chart/catalog";
import { generateChart } from "@/lib/chart/server";

export const maxDuration = 60;

export const POST = async (request: Request) => {
  const body = await request.json();

  if (typeof body?.prompt !== "string") {
    return Response.json({ error: "Prompt must be a string" }, { status: 400 });
  }

  if (typeof body?.modelId !== "string") {
    return Response.json({ error: "Model must be a string" }, { status: 400 });
  }

  if (
    typeof body?.instructions !== "undefined" &&
    typeof body.instructions !== "string"
  ) {
    return Response.json(
      { error: "Instructions must be a string" },
      { status: 400 }
    );
  }

  if (
    typeof body?.documents !== "undefined" &&
    (!Array.isArray(body.documents) ||
      body.documents.some(
        (document: { url?: unknown; type?: unknown }) =>
          typeof document?.url !== "string" ||
          typeof document?.type !== "string"
      ))
  ) {
    return Response.json(
      { error: "Documents must be an array of typed URLs" },
      { status: 400 }
    );
  }

  if (
    typeof body?.videos !== "undefined" &&
    (!Array.isArray(body.videos) ||
      body.videos.some(
        (video: { url?: unknown; type?: unknown }) =>
          typeof video?.url !== "string" || typeof video?.type !== "string"
      ))
  ) {
    return Response.json(
      { error: "Videos must be an array of typed URLs" },
      { status: 400 }
    );
  }

  if (typeof body?.startingSpec !== "undefined") {
    const parsedStartingSpec = chartSpecSchema.safeParse(body.startingSpec);

    if (!parsedStartingSpec.success) {
      return Response.json(
        { error: "Starting spec must be a valid chart spec" },
        { status: 400 }
      );
    }
  }

  const result = await generateChart(body);

  return Response.json(result);
};
