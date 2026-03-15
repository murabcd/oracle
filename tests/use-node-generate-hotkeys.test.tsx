import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Textarea } from "@/components/ui/textarea";
import { useNodeGenerateHotkeys } from "@/hooks/use-node-generate-hotkeys";

const TestEditor = ({
  disabled = false,
  onGenerate,
}: {
  disabled?: boolean;
  onGenerate: () => void;
}) => {
  const ref = useNodeGenerateHotkeys({
    disabled,
    onGenerate,
  });

  return <Textarea aria-label="Prompt" ref={ref} />;
};

describe("useNodeGenerateHotkeys", () => {
  it("submits on enter", () => {
    const onGenerate = vi.fn();

    render(<TestEditor onGenerate={onGenerate} />);

    const prompt = screen.getByRole("textbox", { name: "Prompt" });
    prompt.focus();
    fireEvent.keyDown(prompt, {
      code: "Enter",
      key: "Enter",
    });

    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it("submits on meta+enter without firing twice", () => {
    const onGenerate = vi.fn();

    render(<TestEditor onGenerate={onGenerate} />);

    const prompt = screen.getByRole("textbox", { name: "Prompt" });
    prompt.focus();
    fireEvent.keyDown(prompt, {
      code: "Enter",
      key: "Enter",
      metaKey: true,
    });

    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it("preserves shift+enter for new lines", () => {
    const onGenerate = vi.fn();

    render(<TestEditor onGenerate={onGenerate} />);

    const prompt = screen.getByRole("textbox", { name: "Prompt" });
    prompt.focus();
    fireEvent.keyDown(prompt, {
      code: "Enter",
      key: "Enter",
      shiftKey: true,
    });

    expect(onGenerate).not.toHaveBeenCalled();
  });

  it("does not submit when disabled", () => {
    const onGenerate = vi.fn();

    render(<TestEditor disabled onGenerate={onGenerate} />);

    const prompt = screen.getByRole("textbox", { name: "Prompt" });
    prompt.focus();
    fireEvent.keyDown(prompt, {
      code: "Enter",
      key: "Enter",
    });

    expect(onGenerate).not.toHaveBeenCalled();
  });
});
