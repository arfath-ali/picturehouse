export async function injectSprite(): Promise<void> {
  try {
    const response = await fetch("/src/assets/images/icons.svg");

    if (!response.ok) {
      throw new Error(
        `Failed to load SVG sprite: ${response.status} ${response.statusText}`,
      );
    }

    const svgText = await response.text();

    const container = document.createElement("div");
    container.innerHTML = svgText;
    container.style.display = "none";

    document.body.prepend(container);
  } catch (error) {
    console.error("Error injecting SVG sprite:", error);
  }
}
