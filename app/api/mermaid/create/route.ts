import { generateMermaid } from "@/lib/mermaid/server";

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
    typeof body?.startingSource !== "undefined" &&
    typeof body.startingSource !== "string"
  ) {
    return Response.json(
      { error: "Starting Mermaid must be a string" },
      { status: 400 }
    );
  }

  const result = await generateMermaid(body);

  return Response.json(result);
};
