import { extractDocumentText } from "@/lib/document/server";

export const maxDuration = 60;

export const POST = async (request: Request) => {
  const body = await request.json();

  if (
    !body?.source ||
    typeof body.source !== "object" ||
    typeof body.source.url !== "string" ||
    typeof body.source.type !== "string"
  ) {
    return Response.json(
      { error: "Source must be a typed URL" },
      { status: 400 }
    );
  }

  if (
    typeof body.source.name !== "undefined" &&
    typeof body.source.name !== "string"
  ) {
    return Response.json(
      { error: "Source name must be a string" },
      { status: 400 }
    );
  }

  const response = await extractDocumentText({
    source: body.source,
  });

  return Response.json(response);
};
