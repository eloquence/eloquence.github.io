const STORAGE_KEY = "mpedit.stashes.v1";
const panels = [...document.querySelectorAll(".panel")];
const toast = document.querySelector(".toast");
let toastTimer = 0;

const loadPrompts = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const savePrompts = (prompts) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
};

const formatDate = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const showToast = (message, action) => {
  toast.replaceChildren(document.createTextNode(message));

  if (action) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action.label;
    button.addEventListener("click", () => {
      action.handler();
      toast.classList.remove("is-visible");
      clearTimeout(toastTimer);
    });
    toast.append(button);
  }

  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), action ? 5000 : 1500);
};

const copyText = async (text, message) => {
  try {
    await navigator.clipboard.writeText(text);
    showToast(message);
  } catch {
    const fallback = document.createElement("textarea");
    fallback.value = text;
    fallback.style.position = "fixed";
    fallback.style.opacity = "0";
    document.body.append(fallback);
    fallback.select();
    document.execCommand("copy");
    fallback.remove();
    showToast(message);
  }
};

const updateLineNumbers = (panel) => {
  const textarea = panel.querySelector("textarea");
  const lineNumbers = panel.querySelector(".line-numbers");
  const lineCount = textarea.value.split("\n").length;
  lineNumbers.textContent = Array.from({ length: lineCount }, (_, index) => index + 1).join("\n");
};

const syncLineScroll = (panel) => {
  const textarea = panel.querySelector("textarea");
  const lineNumbers = panel.querySelector(".line-numbers");
  lineNumbers.scrollTop = textarea.scrollTop;
};

const refreshSelects = () => {
  const prompts = loadPrompts();
  document.querySelectorAll(".prompt-select").forEach((select) => {
    const selected = select.value;
    select.replaceChildren(new Option("(Select a saved prompt)", ""));
    prompts.forEach((prompt) => select.add(new Option(prompt.name, prompt.id)));
    select.value = prompts.some((prompt) => prompt.id === selected) ? selected : "";
  });
};

const getSelectedPrompt = (panel) => {
  const selectedId = panel.querySelector(".prompt-select").value;
  return loadPrompts().find((prompt) => prompt.id === selectedId);
};

const savePrompt = (panel) => {
  const text = panel.querySelector("textarea").value;
  const prompts = loadPrompts();
  const createdAt = new Date();
  const prompt = {
    id: `${createdAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    name: `Prompt ${formatDate(createdAt)}`,
    text
  };

  prompts.unshift(prompt);
  savePrompts(prompts);
  refreshSelects();
  panel.querySelector(".prompt-select").value = prompt.id;
  showToast("Prompt saved");
};

const loadPrompt = (panel) => {
  const prompt = getSelectedPrompt(panel);
  if (!prompt) {
    showToast("Select a prompt");
    return;
  }

  const textarea = panel.querySelector("textarea");
  textarea.value = prompt.text;
  updateLineNumbers(panel);
  textarea.focus();
  showToast("Prompt loaded");
};

const renamePrompt = (panel) => {
  const prompt = getSelectedPrompt(panel);
  if (!prompt) {
    showToast("Select a prompt");
    return;
  }

  const nextName = window.prompt("Rename prompt", prompt.name);
  if (!nextName || nextName.trim() === prompt.name) return;

  const prompts = loadPrompts().map((item) => (
    item.id === prompt.id ? { ...item, name: nextName.trim() } : item
  ));
  savePrompts(prompts);
  refreshSelects();
  panel.querySelector(".prompt-select").value = prompt.id;
  showToast("Renamed");
};

const deletePrompt = (panel) => {
  const prompt = getSelectedPrompt(panel);
  if (!prompt) {
    showToast("Select a prompt");
    return;
  }

  savePrompts(loadPrompts().filter((item) => item.id !== prompt.id));
  refreshSelects();
  showToast("Deleted");
};

const clearText = (panel) => {
  const textarea = panel.querySelector("textarea");
  if (!textarea.value) {
    showToast("Already clear");
    textarea.focus();
    return;
  }

  const previous = {
    value: textarea.value,
    selectionStart: textarea.selectionStart,
    selectionEnd: textarea.selectionEnd,
    scrollTop: textarea.scrollTop
  };

  textarea.value = "";
  textarea.scrollTop = 0;
  updateLineNumbers(panel);
  syncLineScroll(panel);
  textarea.focus();

  showToast("Cleared", {
    label: "Undo",
    handler: () => {
      textarea.value = previous.value;
      updateLineNumbers(panel);
      textarea.focus();
      textarea.setSelectionRange(previous.selectionStart, previous.selectionEnd);
      textarea.scrollTop = previous.scrollTop;
      syncLineScroll(panel);
    }
  });
};

panels.forEach((panel) => {
  const textarea = panel.querySelector("textarea");
  textarea.addEventListener("input", () => updateLineNumbers(panel));
  textarea.addEventListener("scroll", () => syncLineScroll(panel));
  panel.querySelector(".save-prompt").addEventListener("click", () => savePrompt(panel));
  panel.querySelector(".retrieve").addEventListener("click", () => loadPrompt(panel));
  panel.querySelector(".rename").addEventListener("click", () => renamePrompt(panel));
  panel.querySelector(".delete").addEventListener("click", () => deletePrompt(panel));
  panel.querySelector(".copy-side").addEventListener("click", () => copyText(textarea.value, "Copied"));
  panel.querySelector(".clear-side").addEventListener("click", () => clearText(panel));
  updateLineNumbers(panel);
});

document.querySelector("#copyCombined").addEventListener("click", () => {
  const [left, right] = panels.map((panel) => panel.querySelector("textarea").value);
  const separator = left && !left.endsWith("\n") ? "\n" : "";
  copyText(`${left}${separator}${right}`, "Combined copy ready");
});

refreshSelects();
