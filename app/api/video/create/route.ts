import { generateVideo } from "@/lib/media/server";

export const maxDuration = 60;

export const POST = async (request: Request) => {
  const body = await request.json();

  if (typeof body?.modelId !== "string") {
    return Response.json({ error: "Model must be a string" }, { status: 400 });
  }

  if (typeof body?.prompt !== "string") {
    return Response.json({ error: "Prompt must be a string" }, { status: 400 });
  }

  if (typeof body?.image !== "undefined" && typeof body.image !== "string") {
    return Response.json({ error: "Image must be a string" }, { status: 400 });
  }

  const response = await generateVideo(body);

  return Response.json(response);
};
