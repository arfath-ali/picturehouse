export function createIcon(
  iconId: string,
  classNames: string[],
): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add(...classNames);
  svg.setAttribute("aria-hidden", "true");

  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `#${iconId}`);

  svg.appendChild(use);

  return svg;
}
