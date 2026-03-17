import { fetchLinkPreview } from "@/lib/link/server";

export const maxDuration = 30;

export const POST = async (request: Request) => {
  const body = await request.json();

  if (typeof body?.url !== "string") {
    return Response.json({ error: "URL must be a string" }, { status: 400 });
  }

  const response = await fetchLinkPreview({
    url: body.url,
  });

  return Response.json(response);
};
