import { generateImage } from "@/lib/media/server";

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

  const response = await generateImage(body);

  return Response.json(response);
};
