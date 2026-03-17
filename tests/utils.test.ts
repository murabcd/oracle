import { describe, expect, it } from "vitest";
import { isEditableTarget } from "@/lib/utils";

describe("isEditableTarget", () => {
  it("treats nested contenteditable text nodes as editable", () => {
    const editor = document.createElement("div");
    const paragraph = document.createElement("p");
    const textNode = document.createTextNode("hello");

    editor.contentEditable = "true";
    editor.setAttribute("contenteditable", "true");
    paragraph.append(textNode);
    editor.append(paragraph);
    document.body.append(editor);

    expect(isEditableTarget(textNode, editor)).toBe(true);
  });

  it("treats focused textareas as editable", () => {
    const textarea = document.createElement("textarea");

    document.body.append(textarea);

    expect(isEditableTarget(textarea, textarea)).toBe(true);
  });

  it("ignores non-editable elements", () => {
    const element = document.createElement("div");

    document.body.append(element);

    expect(isEditableTarget(element, element)).toBe(false);
  });
});
