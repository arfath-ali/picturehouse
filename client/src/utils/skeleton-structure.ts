export function createSkeletonFragment(count: number, className: string) {
  const fragment = document.createDocumentFragment();
  const isFeatured = className === "featured__item-skeleton";

  for (let i = 0; i < count; i++) {
    const skeletonItem = document.createElement("div");
    skeletonItem.classList.add(className);

    if (isFeatured) {
      skeletonItem.classList.add("shimmer");
    } else {
      const poster = document.createElement("div");
      poster.classList.add(`${className}-poster`, "shimmer");

      const line1 = document.createElement("div");
      line1.classList.add(`${className}-line`, `${className}-line1`, "shimmer");

      const line2 = document.createElement("div");
      line2.classList.add(`${className}-line`, `${className}-line2`, "shimmer");

      skeletonItem.append(poster, line1, line2);
    }

    fragment.append(skeletonItem);
  }

  return fragment;
}
