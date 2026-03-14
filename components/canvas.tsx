"use client";

import {
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  getOutgoers,
  type IsValidConnection,
  type Node,
  type OnConnect,
  type OnConnectEnd,
  type OnConnectStart,
  type OnEdgesChange,
  type OnNodesChange,
  type ReactFlowProps,
  useReactFlow,
} from "@xyflow/react";
import { BoxSelectIcon, PlusIcon } from "lucide-react";
import { nanoid } from "nanoid";
import type { MouseEvent, MouseEventHandler, SetStateAction } from "react";
import { useCallback, useEffect, useReducer } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useDebouncedCallback } from "use-debounce";
import { loadCanvas, saveCanvas } from "@/lib/canvas-storage";
import {
  applyDefaultNodeWidth,
  getNodeStyleWithDefaultWidth,
} from "@/lib/node-style";
import { isValidSourceTarget } from "@/lib/xyflow";
import { NodeDropzoneProvider } from "@/providers/node-dropzone";
import { NodeOperationsProvider } from "@/providers/node-operations";
import { Canvas as CanvasComponent } from "./ai-elements/canvas";
import { Connection } from "./ai-elements/connection";
import { Edge as EdgeComponents } from "./ai-elements/edge";
import { nodeTypes } from "./nodes";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";

const edgeTypes = {
  animated: EdgeComponents.Animated,
  temporary: EdgeComponents.Temporary,
};

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  copiedNodes: Node[];
  loaded: boolean;
}

type CanvasAction =
  | { type: "initialize"; nodes: Node[]; edges: Edge[] }
  | { type: "setNodes"; updater: SetStateAction<Node[]> }
  | { type: "setEdges"; updater: SetStateAction<Edge[]> }
  | { type: "setCopiedNodes"; nodes: Node[] };

const resolveStateUpdate = <T,>(updater: SetStateAction<T>, current: T): T =>
  typeof updater === "function"
    ? (updater as (value: T) => T)(current)
    : updater;

const withNodeTimestamps = (node: Node, fallbackTimestamp: string): Node => {
  if (node.type === "drop") {
    return node;
  }

  const data =
    node.data && typeof node.data === "object"
      ? (node.data as Record<string, unknown>)
      : {};
  const createdAt =
    typeof data.createdAt === "string" ? data.createdAt : fallbackTimestamp;
  const updatedAt =
    typeof data.updatedAt === "string" ? data.updatedAt : createdAt;

  return applyDefaultNodeWidth({
    ...node,
    data: {
      ...data,
      createdAt,
      updatedAt,
    },
  });
};

const canvasReducer = (
  state: CanvasState,
  action: CanvasAction
): CanvasState => {
  switch (action.type) {
    case "initialize":
      return {
        ...state,
        nodes: action.nodes,
        edges: action.edges,
        loaded: true,
      };
    case "setNodes":
      return {
        ...state,
        nodes: resolveStateUpdate(action.updater, state.nodes),
      };
    case "setEdges":
      return {
        ...state,
        edges: resolveStateUpdate(action.updater, state.edges),
      };
    case "setCopiedNodes":
      return {
        ...state,
        copiedNodes: action.nodes,
      };
    default:
      return state;
  }
};

const useCanvasState = ({
  initialEdges,
  initialNodes,
}: {
  initialEdges?: Edge[];
  initialNodes?: Node[];
}) => {
  const [state, dispatch] = useReducer(canvasReducer, {
    copiedNodes: [],
    edges: initialEdges ?? [],
    loaded: false,
    nodes: initialNodes ?? [],
  });

  useEffect(() => {
    const stored = loadCanvas();
    const fallbackTimestamp = new Date().toISOString();
    const nodes = (stored?.nodes ?? initialNodes ?? []).map((node) =>
      withNodeTimestamps(node, fallbackTimestamp)
    );

    dispatch({
      type: "initialize",
      nodes,
      edges: stored?.edges ?? initialEdges ?? [],
    });
  }, [initialEdges, initialNodes]);

  const setNodes = useCallback((updater: SetStateAction<Node[]>) => {
    dispatch({ type: "setNodes", updater });
  }, []);

  const setEdges = useCallback((updater: SetStateAction<Edge[]>) => {
    dispatch({ type: "setEdges", updater });
  }, []);

  const setCopiedNodes = useCallback((nodes: Node[]) => {
    dispatch({ type: "setCopiedNodes", nodes });
  }, []);

  return {
    ...state,
    setCopiedNodes,
    setEdges,
    setNodes,
  };
};

const useCanvasController = (props: ReactFlowProps) => {
  const {
    onConnect,
    onEdgesChange,
    onNodesChange,
    nodes: initialNodes,
    edges: initialEdges,
    ...restProps
  } = props ?? {};
  const {
    nodes,
    edges,
    copiedNodes,
    loaded,
    setNodes,
    setEdges,
    setCopiedNodes,
  } = useCanvasState({
    initialEdges,
    initialNodes,
  });
  const {
    getEdges,
    toObject,
    screenToFlowPosition,
    getNodes,
    getNode,
    updateNode,
  } = useReactFlow();

  const save = useDebouncedCallback(() => {
    const { nodes: currentNodes, edges: currentEdges } = toObject();
    saveCanvas({ nodes: currentNodes, edges: currentEdges });
  }, 1000);

  const handleNodesChange = useCallback<OnNodesChange>(
    (changes) => {
      setNodes((current) => {
        const updated = applyNodeChanges(changes, current);
        save();
        onNodesChange?.(changes);
        return updated;
      });
    },
    [save, onNodesChange, setNodes]
  );

  const handleEdgesChange = useCallback<OnEdgesChange>(
    (changes) => {
      setEdges((current) => {
        const updated = applyEdgeChanges(changes, current);
        save();
        onEdgesChange?.(changes);
        return updated;
      });
    },
    [save, onEdgesChange, setEdges]
  );

  const handleConnect = useCallback<OnConnect>(
    (connection) => {
      const newEdge: Edge = {
        id: nanoid(),
        type: "animated",
        ...connection,
      };
      setEdges((current) => current.concat(newEdge));
      save();
      onConnect?.(connection);
    },
    [save, onConnect, setEdges]
  );

  const addNode = useCallback(
    (type: string, options?: Record<string, unknown>) => {
      const { data: nodeData, ...nodeOptions } = options ?? {};
      const timestamp = new Date().toISOString();
      const data =
        nodeData && typeof nodeData === "object"
          ? (nodeData as Record<string, unknown>)
          : {};
      const createdAt =
        typeof data.createdAt === "string" ? data.createdAt : timestamp;
      const updatedAt =
        typeof data.updatedAt === "string" ? data.updatedAt : createdAt;
      const newNode: Node = {
        id: nanoid(),
        type,
        data: {
          ...data,
          ...(type === "drop"
            ? {}
            : {
                createdAt,
                updatedAt,
              }),
        },
        position: { x: 0, y: 0 },
        origin: [0, 0.5],
        style: getNodeStyleWithDefaultWidth({
          style:
            typeof nodeOptions.style === "object" && nodeOptions.style !== null
              ? nodeOptions.style
              : undefined,
          type,
          width:
            typeof nodeOptions.width === "number"
              ? nodeOptions.width
              : undefined,
        }),
        ...nodeOptions,
      };

      setNodes((current) => current.concat(newNode));
      save();

      return newNode.id;
    },
    [save, setNodes]
  );

  const duplicateNode = useCallback(
    (id: string) => {
      const node = getNode(id);

      if (!node?.type) {
        return;
      }

      const {
        id: _oldId,
        data: {
          createdAt: _createdAt,
          updatedAt: _updatedAt,
          ...nodeData
        } = {},
        ...nodeProps
      } = node;

      const newId = addNode(node.type, {
        ...nodeProps,
        data: nodeData,
        position: {
          x: node.position.x + 200,
          y: node.position.y + 200,
        },
        selected: true,
      });

      setTimeout(() => {
        updateNode(id, { selected: false });
        updateNode(newId, { selected: true });
      }, 0);
    },
    [addNode, getNode, updateNode]
  );

  const handleConnectEnd = useCallback<OnConnectEnd>(
    (event, connectionState) => {
      if (!connectionState.isValid) {
        const { clientX, clientY } =
          "changedTouches" in event ? event.changedTouches[0] : event;

        const sourceId = connectionState.fromNode?.id;
        const isSourceHandle = connectionState.fromHandle?.type === "source";

        if (!sourceId) {
          return;
        }

        const newNodeId = addNode("drop", {
          position: screenToFlowPosition({ x: clientX, y: clientY }),
          data: {
            isSource: !isSourceHandle,
          },
        });

        setEdges((current) =>
          current.concat({
            id: nanoid(),
            source: isSourceHandle ? sourceId : newNodeId,
            target: isSourceHandle ? newNodeId : sourceId,
            type: "temporary",
          })
        );
      }
    },
    [addNode, screenToFlowPosition, setEdges]
  );

  const isValidConnection = useCallback<IsValidConnection>(
    (connection) => {
      const currentNodes = getNodes();
      const currentEdges = getEdges();
      const target = currentNodes.find((node) => node.id === connection.target);

      if (connection.source) {
        const source = currentNodes.find(
          (node) => node.id === connection.source
        );

        if (!(source && target)) {
          return false;
        }

        if (!isValidSourceTarget(source, target)) {
          return false;
        }
      }

      const hasCycle = (node: Node, visited = new Set<string>()) => {
        if (visited.has(node.id)) {
          return false;
        }

        visited.add(node.id);

        for (const outgoer of getOutgoers(node, currentNodes, currentEdges)) {
          if (outgoer.id === connection.source || hasCycle(outgoer, visited)) {
            return true;
          }
        }
      };

      if (!target || target.id === connection.source) {
        return false;
      }

      return !hasCycle(target);
    },
    [getNodes, getEdges]
  );

  const handleConnectStart = useCallback<OnConnectStart>(() => {
    setNodes((current) => current.filter((node) => node.type !== "drop"));
    setEdges((current) => current.filter((edge) => edge.type !== "temporary"));
    save();
  }, [save, setEdges, setNodes]);

  const addDropNode = useCallback<MouseEventHandler<HTMLDivElement>>(
    (event) => {
      if (!(event.target instanceof HTMLElement)) {
        return;
      }

      const { x, y } = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode("drop", {
        position: { x, y },
      });
    },
    [addNode, screenToFlowPosition]
  );

  const handleSelectAll = useCallback(() => {
    setNodes((current) => current.map((node) => ({ ...node, selected: true })));
  }, [setNodes]);

  const handleCopy = useCallback(() => {
    const selectedNodes = getNodes().filter((node) => node.selected);

    if (selectedNodes.length > 0) {
      setCopiedNodes(selectedNodes);
    }
  }, [getNodes, setCopiedNodes]);

  const handlePaste = useCallback(() => {
    if (copiedNodes.length === 0) {
      return;
    }

    setNodes((current) => {
      const newNodes = copiedNodes.map((node) => ({
        ...node,
        id: nanoid(),
        position: {
          x: node.position.x + 200,
          y: node.position.y + 200,
        },
        selected: true,
      }));

      return [
        ...current.map((node) => ({
          ...node,
          selected: false,
        })),
        ...newNodes,
      ];
    });
  }, [copiedNodes, setNodes]);

  const handleDuplicateAll = useCallback(() => {
    const selected = getNodes().filter((node) => node.selected);

    for (const node of selected) {
      duplicateNode(node.id);
    }
  }, [getNodes, duplicateNode]);

  const handleContextMenu = useCallback((event: MouseEvent) => {
    if (
      !(
        event.target instanceof HTMLElement &&
        event.target.classList.contains("react-flow__pane")
      )
    ) {
      event.preventDefault();
    }
  }, []);

  useHotkeys("meta+a", handleSelectAll, {
    enableOnContentEditable: false,
    preventDefault: true,
  });

  useHotkeys("meta+d", handleDuplicateAll, {
    enableOnContentEditable: false,
    preventDefault: true,
  });

  useHotkeys("meta+c", handleCopy, {
    enableOnContentEditable: false,
    preventDefault: true,
  });

  useHotkeys("meta+v", handlePaste, {
    enableOnContentEditable: false,
    preventDefault: true,
  });

  return {
    addDropNode,
    addNode,
    duplicateNode,
    edges,
    handleConnect,
    handleConnectEnd,
    handleConnectStart,
    handleContextMenu,
    handleEdgesChange,
    handleNodesChange,
    handleSelectAll,
    isValidConnection,
    loaded,
    nodes,
    restProps,
  };
};

export const Canvas = ({ children, ...props }: ReactFlowProps) => {
  const {
    addDropNode,
    addNode,
    duplicateNode,
    edges,
    handleConnect,
    handleConnectEnd,
    handleConnectStart,
    handleContextMenu,
    handleEdgesChange,
    handleNodesChange,
    handleSelectAll,
    isValidConnection,
    loaded,
    nodes,
    restProps,
  } = useCanvasController(props);

  if (!loaded) {
    return null;
  }

  return (
    <NodeOperationsProvider addNode={addNode} duplicateNode={duplicateNode}>
      <NodeDropzoneProvider>
        <ContextMenu>
          <ContextMenuTrigger onContextMenu={handleContextMenu}>
            <CanvasComponent
              connectionLineComponent={Connection}
              edges={edges}
              edgeTypes={edgeTypes}
              isValidConnection={isValidConnection}
              nodes={nodes}
              nodeTypes={nodeTypes}
              onConnect={handleConnect}
              onConnectEnd={handleConnectEnd}
              onConnectStart={handleConnectStart}
              onDoubleClick={addDropNode}
              onEdgesChange={handleEdgesChange}
              onNodesChange={handleNodesChange}
              {...restProps}
            >
              {children}
            </CanvasComponent>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={addDropNode}>
              <PlusIcon size={12} />
              <span>Add a new node</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={handleSelectAll}>
              <BoxSelectIcon size={12} />
              <span>Select all</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </NodeDropzoneProvider>
    </NodeOperationsProvider>
  );
};
