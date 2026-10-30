(() => {
  "use strict";

  const cfg = window.SITE_CONFIG || {};
  const username = cfg.username || "nazukiss";
  const repository = cfg.repository || "nixos-config";
  const branch = cfg.branch || "main";
  const repoUrl = "https://github.com/" + encodeURIComponent(username) + "/" + encodeURIComponent(repository);
  const apiUrl = "https://api.github.com/repos/" + encodeURIComponent(username) + "/" + encodeURIComponent(repository);
  const $ = (selector, root = document) => root.querySelector(selector);

  document.title = cfg.projectName || "nazukiss — NixOS configuration";
  document.querySelectorAll("[data-repo-link]").forEach(link => { link.href = repoUrl; });
  document.querySelectorAll("[data-file-link]").forEach(link => {
    const path = link.dataset.fileLink.split("/").map(encodeURIComponent).join("/");
    link.href = repoUrl + "/blob/" + encodeURIComponent(branch) + "/" + path;
  });
  const commitsLink = $("[data-commits-link]");
  if (commitsLink) commitsLink.href = repoUrl + "/commits/" + encodeURIComponent(branch);
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  // Fill only values explicitly maintained in site.config.js.
  const system = cfg.system || {};
  document.querySelectorAll("[data-system]").forEach(element => {
    const value = system[element.dataset.system];
    if (value) element.textContent = value;
  });
  document.querySelectorAll("[data-description]").forEach(element => {
    if (cfg.description) element.textContent = cfg.description;
  });

  // The editorial light theme is the default; a dark reading mode is optional.
  const themeButton = $("[data-theme-toggle]");
  const themeKey = "nazukiss-site-theme";
  function applyTheme(theme) {
    const dark = theme === "dark";
    document.body.classList.toggle("theme-dark", dark);
    if (themeButton) {
      themeButton.setAttribute("aria-pressed", String(dark));
      themeButton.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
      themeButton.querySelector("span").textContent = dark ? "☼" : "☾";
    }
  }
  let savedTheme = "light";
  try { savedTheme = localStorage.getItem(themeKey) || "light"; } catch (_) {}
  applyTheme(savedTheme);
  themeButton?.addEventListener("click", () => {
    const next = document.body.classList.contains("theme-dark") ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(themeKey, next); } catch (_) {}
  });

  async function getJson(url, cacheKey, cacheDuration = 30 * 60 * 1000) {
    const storageKey = "nazukiss:" + cacheKey;
    let cached = null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) cached = JSON.parse(raw);
    } catch (_) {}
    if (cached && cached.savedAt && Date.now() - cached.savedAt < cacheDuration) return cached.data;

    const response = await fetch(url, {
      headers: { Accept: "application/vnd.github+json" }
    });
    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        throw new Error("GitHub's public API is temporarily rate-limited.");
      }
      throw new Error("GitHub returned HTTP " + response.status + ".");
    }
    const data = await response.json();
    try { localStorage.setItem(storageKey, JSON.stringify({ data, savedAt: Date.now() })); } catch (_) {}
    return data;
  }

  // Render a shallow, navigable view of the real repository tree.
  const treeContainer = $("#file-tree");
  const treeUrl = apiUrl + "/git/trees/" + encodeURIComponent(branch) + "?recursive=1";
  const makeContentsUrl = (path, isFolder) => {
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    return repoUrl + "/" + (isFolder ? "tree" : "blob") + "/" + encodeURIComponent(branch) + "/" + encodedPath;
  };

  function treeMessage(message, error = false) {
    if (!treeContainer) return;
    const paragraph = document.createElement("p");
    paragraph.className = error ? "tree-error" : "tree-loading";
    paragraph.textContent = message;
    treeContainer.replaceChildren(paragraph);
  }

  function renderTree(entries) {
    const root = { name: repository, path: "", type: "tree", children: new Map() };
    entries.forEach(entry => {
      if (!entry.path || entry.path.startsWith(".git/")) return;
      const parts = entry.path.split("/");
      let parent = root;
      parts.forEach((part, index) => {
        const path = parts.slice(0, index + 1).join("/");
        if (!parent.children.has(part)) {
          parent.children.set(part, {
            name: part,
            path,
            type: index === parts.length - 1 ? entry.type : "tree",
            children: new Map()
          });
        } else if (index === parts.length - 1) {
          parent.children.get(part).type = entry.type;
        }
        parent = parent.children.get(part);
      });
    });

    const rows = [];
    function walk(parent, depth) {
      const children = [...parent.children.values()].sort((a, b) => {
        if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
        return a.name.localeCompare(b.name, "en", { numeric: true, sensitivity: "base" });
      });
      children.forEach((node, index) => {
        rows.push({ node, depth, last: index === children.length - 1 });
        if (node.type === "tree" && depth < 1) walk(node, depth + 1);
      });
    }
    walk(root, 0);

    const fragment = document.createDocumentFragment();
    rows.slice(0, 33).forEach(({ node, depth, last }) => {
      const row = document.createElement("div");
      row.className = "tree-row";
      row.style.paddingLeft = (depth * 13 + 3) + "px";
      const connector = document.createElement("span");
      connector.className = "tree-connector";
      connector.textContent = depth ? (last ? "└" : "├") : "";
      const link = document.createElement("a");
      const folder = node.type === "tree";
      link.className = "tree-entry " + (folder ? "folder" : "file");
      link.href = makeContentsUrl(node.path, folder);
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = (folder ? "▰ " : "▱ ") + node.name + (folder ? "/" : "");
      link.title = node.path;
      row.append(connector, link);
      fragment.append(row);
    });

    if (rows.length > 33) {
      const more = document.createElement("p");
      more.className = "tree-loading";
      more.textContent = "+ " + (rows.length - 33) + " more entries in GitHub";
      fragment.append(more);
    }
    treeContainer.replaceChildren(fragment);
  }

  if (treeContainer) {
    treeMessage("Reading the repository tree…");
    getJson(treeUrl, "tree")
      .then(data => {
        if (data.truncated || !Array.isArray(data.tree)) throw new Error("GitHub returned an incomplete repository tree.");
        renderTree(data.tree);
      })
      .catch(error => {
        console.error("Could not load repository tree:", error);
        treeMessage(error.message + " Open the repository to browse the files.", true);
      });
  }

  // Recent commit titles, abbreviated hashes and relative dates come from GitHub.
  const commitContainer = $("#commit-list");
  const commitsUrl = apiUrl + "/commits?per_page=4";
  const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  function formatRelativeDate(value) {
    if (!value) return "";
    const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
    const ranges = [
      ["year", 31536000], ["month", 2592000], ["week", 604800],
      ["day", 86400], ["hour", 3600], ["minute", 60]
    ];
    for (const [unit, size] of ranges) {
      if (Math.abs(seconds) >= size) return relativeTime.format(Math.round(seconds / size), unit);
    }
    return relativeTime.format(0, "minute");
  }

  function renderCommits(commits) {
    const fragment = document.createDocumentFragment();
    commits.forEach(item => {
      const row = document.createElement("a");
      row.className = "commit-item";
      row.href = repoUrl + "/commit/" + item.sha;
      row.target = "_blank";
      row.rel = "noreferrer";
      row.title = item.commit?.message || "Open commit";
      const dot = document.createElement("span");
      dot.className = "commit-dot";
      const message = document.createElement("span");
      message.className = "commit-message";
      message.textContent = (item.commit?.message || "Commit").split("\n")[0];
      const meta = document.createElement("span");
      meta.className = "commit-meta";
      const date = item.commit?.author?.date || item.commit?.committer?.date;
      meta.textContent = item.sha.slice(0, 7) + " · " + formatRelativeDate(date);
      row.append(dot, message, meta);
      fragment.append(row);
    });
    commitContainer.replaceChildren(fragment);
  }

  if (commitContainer) {
    getJson(commitsUrl, "commits", 10 * 60 * 1000)
      .then(data => {
        if (!Array.isArray(data) || !data.length) throw new Error("No recent commits were returned.");
        renderCommits(data);
      })
      .catch(error => {
        console.error("Could not load recent commits:", error);
        const message = document.createElement("p");
        message.className = "tree-error";
        message.textContent = "Recent activity is temporarily unavailable.";
        commitContainer.replaceChildren(message);
      });
  }

  // Copy the conventional local configuration path.
  const copyButton = $("[data-copy-tree]");
  copyButton?.addEventListener("click", async () => {
    const originalLabel = copyButton.getAttribute("aria-label");
    try {
      await navigator.clipboard.writeText("/etc/nixos");
      copyButton.setAttribute("aria-label", "Copied /etc/nixos");
      copyButton.textContent = "✓";
    } catch (_) {
      copyButton.setAttribute("aria-label", "Copy is unavailable in this browser");
      copyButton.textContent = "!";
    }
    window.setTimeout(() => {
      copyButton.textContent = "▢";
      copyButton.setAttribute("aria-label", originalLabel || "Copy repository path");
    }, 1600);
  });
})();