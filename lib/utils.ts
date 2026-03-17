import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const FORM_EDITABLE_SELECTOR = "input, textarea, select";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getTargetElement = (target: EventTarget | null) => {
  if (target instanceof HTMLElement) {
    return target;
  }

  if (target instanceof Node) {
    return target.parentElement;
  }

  return null;
};

const isEditableElement = (element: HTMLElement | null) =>
  Boolean(element && hasEditableAncestor(element));

const hasEditableAncestor = (element: HTMLElement) => {
  let current: HTMLElement | null = element;

  while (current) {
    if (
      current.isContentEditable ||
      current.contentEditable === "true" ||
      current.contentEditable === "plaintext-only" ||
      current instanceof HTMLInputElement ||
      current instanceof HTMLTextAreaElement ||
      current instanceof HTMLSelectElement ||
      current.matches(FORM_EDITABLE_SELECTOR) ||
      current.getAttribute("contenteditable") !== null
    ) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
};

export const isEditableTarget = (
  target: EventTarget | null,
  activeElement?: Element | null
) =>
  isEditableElement(getTargetElement(target)) ||
  isEditableElement(activeElement instanceof HTMLElement ? activeElement : null);

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
