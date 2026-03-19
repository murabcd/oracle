import type { Editor, EditorEvents } from "@tiptap/core";
import { useReactFlow } from "@xyflow/react";
import { useRef } from "react";
import { EditorProvider } from "@/components/kibo-ui/editor";
import { patchNodeConfig } from "@/lib/node-data";
import { cn } from "@/lib/utils";
import { NodeLayout } from "../layout";
import type { TextNodeProps } from ".";

type TextPrimitiveProps = TextNodeProps & {
  title: string;
};

export const TextPrimitive = ({
  data,
  id,
  type,
  title,
}: TextPrimitiveProps) => {
  const { updateNodeData } = useReactFlow();
  const editor = useRef<Editor | null>(null);

  const handleUpdate = ({ editor: editorInstance }: { editor: Editor }) => {
    const json = editorInstance.getJSON();
    const text = editorInstance.getText();
    const hasExistingText = Boolean(data.config.text?.trim().length);

    updateNodeData(
      id,
      patchNodeConfig(
        data,
        {
          content: json,
          text,
        },
        hasExistingText ? new Date().toISOString() : data.meta.updatedAt
      )
    );
  };

  const handleCreate = (props: EditorEvents["create"]) => {
    editor.current = props.editor;
    props.editor.chain().focus().run();
  };

  return (
    <NodeLayout
      bodyClassName="h-full"
      className="p-0"
      contentClassName="h-full"
      data={data}
      id={id}
      title={title}
      type={type}
    >
      <div className="nowheel h-full overflow-auto rounded-3xl">
        <EditorProvider
          className={cn(
            "prose dark:prose-invert size-full max-w-none p-[calc(1.5rem*var(--node-scale,1))]",
            "[&_.ProseMirror]:min-h-full",
            "[&_.ProseMirror]:text-[calc(0.95rem*var(--node-scale,1))]",
            "[&_.ProseMirror]:leading-[calc(1.6rem*var(--node-scale,1))]",
            "[&_.ProseMirror_h1]:text-[calc(1.8rem*var(--node-scale,1))]",
            "[&_.ProseMirror_h2]:text-[calc(1.45rem*var(--node-scale,1))]",
            "[&_.ProseMirror_h3]:text-[calc(1.2rem*var(--node-scale,1))]",
            "[&_.ProseMirror_pre]:text-[calc(0.85rem*var(--node-scale,1))]",
            "[&_p:first-child]:mt-0",
            "[&_p:last-child]:mb-0"
          )}
          content={data.config.content}
          immediatelyRender={false}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          placeholder="Start typing..."
        />
      </div>
    </NodeLayout>
  );
};
