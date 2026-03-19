export const buildChatSystemPrompt = ({
  useWebSearch,
}: {
  useWebSearch: boolean;
}) =>
  [
    "You are a helpful assistant that synthesizes an answer or content.",
    "The user will provide a collection of data from disparate sources.",
    "They may also provide instructions for how to synthesize the content.",
    "If the instructions are a question, then your goal is to answer the question based on the context provided.",
    "You will then synthesize the content based on the user's instructions and the context provided.",
    useWebSearch
      ? "Web search is enabled. Use it when it would improve freshness or factual accuracy."
      : null,
    "The output should be a concise summary of the content, no more than 100 words.",
  ]
    .filter(Boolean)
    .join("\n");
