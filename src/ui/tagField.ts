import { App } from "obsidian";

/**
 * Replaces a plain text input with a tag-chip field that:
 *  - Shows currently selected tags as removable chips
 *  - Has a text input that searches existing vault tags as you type
 *  - Shows a dropdown of matching tags below the input
 *  - Lets you type a new tag and press Enter / comma to add it
 *
 * @param app      — Obsidian App instance (for metadataCache)
 * @param wrapper  — The container element (replaces the cf-field content area)
 * @param initial  — Tags already on the item being edited
 * @returns        getTags — call this before saving to get the current tag list
 */
export function buildTagField(
  app: App,
  wrapper: HTMLElement,
  initial: string[]
): { getTags: () => string[] } {
  const selected: string[] = [...initial];

  const inner = wrapper.createDiv("ctf-inner");

  const chipsRow = inner.createDiv("ctf-chips");
  const textInput = inner.createEl("input", {
    type: "text",
    cls: "ctf-input",
    placeholder: selected.length === 0 ? "Add tags…" : "",
  });

  const dropdown = inner.createDiv("ctf-dropdown");
  dropdown.style.display = "none";

  const renderChips = () => {
    chipsRow.empty();
    for (const tag of selected) {
      const chip = chipsRow.createDiv("ctf-chip");
      chip.createSpan({ cls: "ctf-chip-label" }).setText(tag);
      const remove = chip.createEl("button", { cls: "ctf-chip-remove", text: "×" });
      remove.addEventListener("mousedown", (ev) => {
        ev.preventDefault();
        selected.splice(selected.indexOf(tag), 1);
        renderChips();
        updatePlaceholder();
      });
    }
    textInput.placeholder = selected.length === 0 ? "Add tags…" : "";
  };

  const updatePlaceholder = () => {
    textInput.placeholder = selected.length === 0 ? "Add tags…" : "";
  };

  const getVaultTags = (): string[] => {
    const raw = (app.metadataCache as any).getTags() as Record<string, number> | null;
    if (!raw) return [];
    return Object.keys(raw).map(t => t.startsWith("#") ? t.slice(1) : t);
  };

  const closeDropdown = () => {
    dropdown.style.display = "none";
    dropdown.empty();
  };

  const addTag = (tag: string) => {
    const clean = tag.trim().replace(/^#/, "");
    if (!clean || selected.includes(clean)) return;
    selected.push(clean);
    textInput.value = "";
    renderChips();
    closeDropdown();
  };

  textInput.addEventListener("input", () => {
    const q = textInput.value.trim().replace(/^#/, "");
    dropdown.empty();
    if (!q) { closeDropdown(); return; }

    const vaultTags = getVaultTags();
    const matches = vaultTags
      .filter(t => !selected.includes(t) && t.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 8);

    if (matches.length === 0) { closeDropdown(); return; }

    dropdown.style.display = "";
    for (const tag of matches) {
      const item = dropdown.createDiv("ctf-result-item");
      item.createSpan({ cls: "ctf-tag-hash", text: "#" });
      item.createSpan({ cls: "ctf-tag-label" }).setText(tag);
      item.addEventListener("mousedown", (ev) => {
        ev.preventDefault();
        addTag(tag);
      });
    }
  });

  textInput.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === ",") {
      ev.preventDefault();
      addTag(textInput.value);
    }
    if (ev.key === "Backspace" && textInput.value === "" && selected.length > 0) {
      selected.pop();
      renderChips();
    }
  });

  textInput.addEventListener("blur", () => {
    // Commit any typed text
    if (textInput.value.trim()) addTag(textInput.value);
    setTimeout(closeDropdown, 150);
  });

  renderChips();

  return { getTags: () => [...selected] };
}
