import { useReactFlow, type XYPosition } from "@xyflow/react";
import { nanoid } from "nanoid";
import { useEffect, useRef } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { nodeButtons } from "@/lib/node-buttons";
import { createNodeData, initializeNodeData } from "@/lib/node-data";
import { getNodeStyleWithDefaultWidth } from "@/lib/node-style";
import { NodeLayout } from "./layout";

interface DropNodeProps {
  data: {
    isSource?: boolean;
    position: XYPosition;
  };
  id: string;
}

const buildReplacementNode = ({
  options,
  position,
  type,
}: {
  options?: Record<string, unknown>;
  position: XYPosition;
  type: string;
}) => {
  const { data: nodeData, ...rest } = options ?? {};
  const timestamp = new Date().toISOString();
  const nextData = {
    ...createNodeData({}, timestamp),
    ...initializeNodeData(nodeData, timestamp),
  };

  return {
    id: nanoid(),
    type,
    position,
    data: nextData,
    origin: [0, 0.5] as [number, number],
    style: getNodeStyleWithDefaultWidth({
      style:
        typeof rest.style === "object" && rest.style !== null
          ? rest.style
          : undefined,
      type,
      width: typeof rest.width === "number" ? rest.width : undefined,
    }),
    ...rest,
  };
};

export const DropNode = ({ data, id }: DropNodeProps) => {
  const { addNodes, deleteElements, getNode, addEdges, getNodeConnections } =
    useReactFlow();
  const ref = useRef<HTMLDivElement>(null);

  const handleSelect = (type: string, options?: Record<string, unknown>) => {
    const currentNode = getNode(id);
    const position = currentNode?.position || { x: 0, y: 0 };
    const sourceNodes = getNodeConnections({
      nodeId: id,
    });

    // Delete the drop node
    deleteElements({
      nodes: [{ id }],
    });

    const newNode = buildReplacementNode({
      options,
      position,
      type,
    });

    addNodes(newNode);

    for (const sourceNode of sourceNodes) {
      addEdges({
        id: nanoid(),
        source: data.isSource ? newNode.id : sourceNode.source,
        target: data.isSource ? sourceNode.source : newNode.id,
        type: "animated",
      });
    }
  };

  useEffect(() => {
    const focusSearchInput = () => {
      const searchInput = ref.current?.querySelector("input");

      if (!(searchInput instanceof HTMLInputElement)) {
        return;
      }

      searchInput.focus();
      searchInput.select();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Delete the drop node when Escape is pressed
        deleteElements({
          nodes: [{ id }],
        });
      }
    };

    const handleClick = (event: MouseEvent) => {
      // Get the DOM element for this node
      const nodeElement = ref.current;

      // Check if the click was outside the node
      if (nodeElement && !nodeElement.contains(event.target as Node)) {
        deleteElements({
          nodes: [{ id }],
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const focusFrame = window.requestAnimationFrame(focusSearchInput);
    const focusTimeout = window.setTimeout(focusSearchInput, 60);

    setTimeout(() => {
      window.addEventListener("click", handleClick);
    }, 50);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.clearTimeout(focusTimeout);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("click", handleClick);
    };
  }, [deleteElements, id]);

  return (
    <div ref={ref}>
      <NodeLayout data={data} id={id} title="Add a new node" type="drop">
        <Command className="rounded-3xl bg-secondary/60">
          <CommandInput autoFocus placeholder="Type a command or search..." />
          <CommandList className="max-h-[min(50vh,28rem)] overflow-y-auto">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Add node">
              {nodeButtons.map((button) => (
                <CommandItem
                  key={button.id}
                  onSelect={() => handleSelect(button.id)}
                >
                  <button.icon size={16} />
                  {button.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </NodeLayout>
    </div>
  );
};
