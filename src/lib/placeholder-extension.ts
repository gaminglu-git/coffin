/**
 * TipTap extension for @-triggered placeholder suggestions.
 * Inserts {{placeholder}} as plain text when user selects from dropdown.
 */

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Suggestion, type SuggestionProps } from "@tiptap/suggestion";
import {
  filterPlaceholderSuggestions,
  type PlaceholderSuggestion,
} from "./placeholder-suggestions";

const PlaceholderPluginKey = new PluginKey("placeholder");

function createPlaceholderDropdown() {
  let container: HTMLDivElement | null = null;
  let selectedIndex = 0;
  let props: SuggestionProps<PlaceholderSuggestion, PlaceholderSuggestion> | null = null;

  const getContainer = () => {
    if (!container) {
      container = document.createElement("div");
      container.className =
        "placeholder-suggestion-list fixed z-50 min-w-[200px] max-h-[240px] overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 py-1";
      container.style.display = "none";
      document.body.appendChild(container);
    }
    return container;
  };

  const render = () => {
    const c = getContainer();
    if (!props || props.items.length === 0) {
      c.style.display = "none";
      return;
    }
    c.innerHTML = "";
    c.style.display = "block";

    props.items.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = `px-3 py-2 text-sm cursor-pointer flex flex-col gap-0.5 ${
        index === selectedIndex ? "bg-mw-green/10 text-mw-green" : "text-gray-700 hover:bg-gray-50"
      }`;
      div.innerHTML = `
        <span class="font-medium">${escapeHtml(item.label)}</span>
        <span class="text-xs text-gray-500">${escapeHtml(item.placeholder)}</span>
      `;
      div.addEventListener("click", () => {
        props!.command(item);
        hide();
      });
      c.appendChild(div);
    });

    const rect = props.clientRect?.();
    if (rect) {
      c.style.left = `${rect.left}px`;
      c.style.top = `${rect.bottom + 4}px`;
    }
  };

  const hide = () => {
    const c = getContainer();
    c.style.display = "none";
    container = null;
  };

  const updateSelection = () => {
    const items = getContainer().querySelectorAll("div");
    items.forEach((el, i) => {
      el.className = `px-3 py-2 text-sm cursor-pointer flex flex-col gap-0.5 ${
        i === selectedIndex ? "bg-mw-green/10 text-mw-green" : "text-gray-700 hover:bg-gray-50"
      }`;
    });
    items[selectedIndex]?.scrollIntoView({ block: "nearest" });
  };

  function escapeHtml(s: string) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  return {
    onStart(p: SuggestionProps<PlaceholderSuggestion, PlaceholderSuggestion>) {
      props = p;
      selectedIndex = 0;
      render();
    },
    onUpdate(p: SuggestionProps<PlaceholderSuggestion, PlaceholderSuggestion>) {
      props = p;
      selectedIndex = Math.min(selectedIndex, Math.max(0, props.items.length - 1));
      render();
    },
    onExit() {
      hide();
      props = null;
    },
    onKeyDown(p: { event: KeyboardEvent; view: unknown }) {
      if (!props) return false;
      const { event } = p;
      if (event.key === "ArrowDown") {
        selectedIndex = Math.min(selectedIndex + 1, props.items.length - 1);
        updateSelection();
        return true;
      }
      if (event.key === "ArrowUp") {
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateSelection();
        return true;
      }
      if (event.key === "Enter") {
        if (props.items[selectedIndex]) {
          props.command(props.items[selectedIndex]);
          hide();
        }
        return true;
      }
      if (event.key === "Escape") {
        hide();
        return false;
      }
      return false;
    },
  };
}

export const PlaceholderExtension = Extension.create({
  name: "placeholder",

  addProseMirrorPlugins() {
    const dropdown = createPlaceholderDropdown();
    return [
      Suggestion({
        pluginKey: PlaceholderPluginKey,
        editor: this.editor,
        char: "@",
        allowSpaces: false,
        items: ({ query }) => filterPlaceholderSuggestions(query),
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).insertContent(props.placeholder).run();
        },
        render: () => dropdown,
      }) as Plugin,
    ];
  },
});
