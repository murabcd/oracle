import { editImage } from "@/lib/media/server";

export const maxDuration = 60;

export const POST = async (request: Request) => {
  const body = await request.json();

  if (!Array.isArray(body?.images)) {
    return Response.json({ error: "Images must be an array" }, { status: 400 });
  }

  if (
    body.images.some(
      (image: unknown) =>
        !image ||
        typeof image !== "object" ||
        typeof (image as { url?: unknown }).url !== "string" ||
        typeof (image as { type?: unknown }).type !== "string"
    )
  ) {
    return Response.json(
      { error: "Each image must include url and type" },
      { status: 400 }
    );
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

  const response = await editImage(body);

  return Response.json(response);
};
