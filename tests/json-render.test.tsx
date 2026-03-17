import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JsonRenderPreview } from "@/components/nodes/interface/preview";
import {
  parseJsonRenderSpec,
  serializeJsonRenderSpec,
} from "@/lib/json-render/catalog";

describe("json render schema", () => {
  it("parses and serializes a valid spec", () => {
    const spec = parseJsonRenderSpec(`{
      "root": "card-1",
      "elements": {
        "card-1": {
          "type": "Card",
          "props": {
            "title": "Launch",
            "description": "Weekly update",
            "maxWidth": "sm",
            "centered": true
          },
          "children": ["heading-1"]
        },
            "heading-1": {
              "type": "Heading",
              "props": {
                "text": "Ready",
                "level": "h3"
          },
          "children": []
        }
      }
    }`);

    expect(spec.root).toBe("card-1");
    expect(serializeJsonRenderSpec(spec)).toContain('"type": "Card"');
  });

  it("rejects malformed specs", () => {
    expect(() =>
      parseJsonRenderSpec(`{
        "root": "unknown-1",
        "elements": {
          "unknown-1": {
            "type": "Unknown",
            "props": {},
            "children": []
          }
        }
      }`)
    ).toThrowError();
  });
});

describe("JsonRenderPreview", () => {
  it("renders an official json-render spec", () => {
    const spec = parseJsonRenderSpec(`{
      "root": "card-1",
      "elements": {
        "card-1": {
          "type": "Card",
          "props": {
            "title": "Product Launch",
            "description": "Weekly pulse",
            "maxWidth": "sm",
            "centered": true
          },
          "children": ["stack-1"]
        },
        "stack-1": {
          "type": "Stack",
          "props": {
            "direction": "vertical",
            "gap": "md",
            "align": "stretch",
            "justify": "start"
          },
          "children": ["text-1", "button-1"]
        },
        "text-1": {
          "type": "Text",
          "props": {
            "text": "Sign in to continue",
            "variant": "muted"
          },
          "children": []
        },
        "button-1": {
          "type": "Button",
          "props": {
            "label": "Ship update",
            "variant": "primary",
            "disabled": null
          },
          "children": []
        }
      }
    }`);

    render(<JsonRenderPreview spec={spec} />);

    expect(screen.getByText("Product Launch")).toBeInTheDocument();
    expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ship update" })
    ).toBeInTheDocument();
  });
});
