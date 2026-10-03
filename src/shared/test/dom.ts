// Test-only DOM helpers: they narrow what a query found and fail the test, with a readable message,
// when the element is missing or of another kind.

export function ofType<T extends Element>(element: Element | null | undefined, type: abstract new () => T): T {
  if (!(element instanceof type)) {
    throw new Error(`Expected ${type.name}, got ${element ? `<${element.tagName.toLowerCase()}>` : String(element)}`);
  }
  return element;
}

// The first element under `root` that matches `selector`.
export const getElement = (root: ParentNode, selector: string): HTMLElement =>
  ofType(root.querySelector(selector), HTMLElement);
