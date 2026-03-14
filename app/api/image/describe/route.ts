import { describeImage } from "@/lib/media/server";

export const maxDuration = 30;

export const POST = async (request: Request) => {
  const body = await request.json();

  if (typeof body?.url !== "string") {
    return Response.json({ error: "URL must be a string" }, { status: 400 });
  }

  const response = await describeImage(body.url);

  return Response.json(response);
};
