import { getElement } from "../utils/dom.js";

let profileDropdownController: AbortController | null = null;

export function profileDropdown() {
  profileDropdownController?.abort();
  profileDropdownController = new AbortController();
  const { signal } = profileDropdownController;

  const profileBtn = getElement("[data-js='site-header-profile-btn']");
  const profielMenu = getElement("[data-js='site-header-profile-menu']");

  const closeDropdown = () => {
    profielMenu.classList.remove("is-visible");
  };

  profileBtn.addEventListener(
    "click",
    () => {
      profielMenu.classList.toggle("is-visible");
    },
    { signal },
  );

  profielMenu.addEventListener(
    "click",
    (e) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest(".site-header__signout-btn")) return;

      closeDropdown();
    },
    { signal },
  );

  window.addEventListener(
    "click",
    (e) => {
      if ((e.target as HTMLElement).closest(".site-header__profile-container"))
        return;
      closeDropdown();
    },
    { signal },
  );
}

export function cleanupProfileDropdown() {
  profileDropdownController?.abort();
  profileDropdownController = null;
}
