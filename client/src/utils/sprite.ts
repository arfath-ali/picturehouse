export async function injectSprite(): Promise<void> {
  const response = await fetch("/src/assets/images/icons.svg");

  const svgText = await response.text();

  const container = document.createElement("div");
  container.innerHTML = svgText;
  container.style.display = "none";

  document.body.prepend(container);
}
