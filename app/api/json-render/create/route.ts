import { jsonRenderSchema } from "@/lib/json-render/catalog";
import { generateJsonRender } from "@/lib/json-render/server";

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

  if (typeof body?.startingSpec !== "undefined") {
    const parsedStartingSpec = jsonRenderSchema.safeParse(body.startingSpec);

    if (!parsedStartingSpec.success) {
      return Response.json(
        { error: "Starting spec must be a valid json-render spec" },
        { status: 400 }
      );
    }
  }

  const response = await generateJsonRender(body);

  return Response.json(response);
};
