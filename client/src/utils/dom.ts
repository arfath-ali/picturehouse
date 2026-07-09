export function getElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) throw new Error(`Element not found: ${selector}`);

  return element;
}

export function getElements<T extends HTMLElement>(selector: string): T[] {
  const elements = document.querySelectorAll<T>(selector);

  if (elements.length === 0) throw new Error(`Elements not found: ${selector}`);

  return Array.from(elements);
}
