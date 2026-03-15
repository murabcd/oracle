export const NODE_DATA_VERSION = 1;

export type NodeExecutionStatus = "idle" | "running" | "success" | "error";

export interface NodeFile {
  name?: string;
  type: string;
  url: string;
}

export interface NodeOutput {
  files?: NodeFile[];
  json?: unknown;
  text?: string;
}

export interface NodeMeta {
  createdAt: string;
  error: string | null;
  status: NodeExecutionStatus;
  updatedAt: string;
}

export interface NodeResultBase {
  output?: NodeOutput;
}

export interface BaseNodeData<
  Config extends Record<string, unknown>,
  Result extends Record<string, unknown> | undefined = undefined,
> extends Record<string, unknown> {
  config: Config;
  meta: NodeMeta;
  result?: Result;
  version: number;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const createNodeMeta = (timestamp: string): NodeMeta => ({
  createdAt: timestamp,
  error: null,
  status: "idle",
  updatedAt: timestamp,
});

export const isNodeData = (
  value: unknown
): value is BaseNodeData<Record<string, unknown>> => {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    typeof value.version === "number" &&
    isPlainObject(value.config) &&
    isPlainObject(value.meta) &&
    typeof value.meta.createdAt === "string" &&
    typeof value.meta.updatedAt === "string" &&
    typeof value.meta.status === "string"
  );
};

export const createNodeData = <
  Config extends Record<string, unknown>,
  Result extends Record<string, unknown> | undefined = undefined,
>(
  config: Config,
  timestamp = new Date().toISOString()
): BaseNodeData<Config, Result> => ({
  config,
  meta: createNodeMeta(timestamp),
  version: NODE_DATA_VERSION,
});

export const initializeNodeData = <
  Config extends Record<string, unknown> = Record<string, unknown>,
  Result extends Record<string, unknown> | undefined = undefined,
>(
  value: unknown,
  timestamp = new Date().toISOString()
): BaseNodeData<Config, Result> => {
  if (!isPlainObject(value)) {
    return createNodeData({} as Config, timestamp);
  }

  const config = isPlainObject(value.config)
    ? (value.config as Config)
    : ({} as Config);
  const result = isPlainObject(value.result)
    ? (value.result as Result)
    : undefined;

  return {
    ...createNodeData<Config, Result>(config, timestamp),
    ...(typeof result === "undefined" ? {} : { result }),
  };
};

export const patchNodeConfig = <
  Config extends Record<string, unknown>,
  Result extends Record<string, unknown> | undefined,
>(
  data: BaseNodeData<Config, Result>,
  patch: Partial<Config>,
  timestamp = new Date().toISOString()
) => ({
  config: {
    ...data.config,
    ...patch,
  },
  meta: {
    ...data.meta,
    updatedAt: timestamp,
  },
});

export const patchNodeMeta = <
  Config extends Record<string, unknown>,
  Result extends Record<string, unknown> | undefined,
>(
  data: BaseNodeData<Config, Result>,
  patch: Partial<NodeMeta>
) => ({
  meta: {
    ...data.meta,
    ...patch,
  },
});

export const replaceNodeResult = <
  Config extends Record<string, unknown>,
  Result extends Record<string, unknown>,
>(
  data: BaseNodeData<Config, Result | undefined>,
  result: Result,
  status: NodeExecutionStatus = "success",
  timestamp = new Date().toISOString()
) => ({
  meta: {
    ...data.meta,
    error: null,
    status,
    updatedAt: timestamp,
  },
  result,
});

export const markNodeRunning = <
  Config extends Record<string, unknown>,
  Result extends Record<string, unknown> | undefined,
>(
  data: BaseNodeData<Config, Result>
) =>
  patchNodeMeta(data, {
    error: null,
    status: "running",
  });

export const markNodeError = <
  Config extends Record<string, unknown>,
  Result extends Record<string, unknown> | undefined,
>(
  data: BaseNodeData<Config, Result>,
  error: string,
  timestamp = new Date().toISOString()
) =>
  patchNodeMeta(data, {
    error,
    status: "error",
    updatedAt: timestamp,
  });
