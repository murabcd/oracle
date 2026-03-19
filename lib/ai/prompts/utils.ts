interface PromptSection {
  heading: string;
  values: string[];
}

export const joinPromptBlocks = (
  blocks: Array<string | null | undefined>,
  separator = "\n\n"
) =>
  blocks
    .filter(
      (block): block is string => typeof block === "string" && block.length > 0
    )
    .join(separator);

export const buildPromptSections = (sections: PromptSection[]) => {
  const content: string[] = [];

  for (const section of sections) {
    if (!section.values.length) {
      continue;
    }

    content.push(`--- ${section.heading} ---`, ...section.values);
  }

  return content.join("\n");
};
