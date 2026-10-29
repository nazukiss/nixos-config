(() => {
  const cfg = window.SITE_CONFIG || {};
  const $ = (s) => document.querySelector(s);
  const setText = (s, v) => { if (v) document.querySelectorAll(s).forEach(el => el.textContent = v); };
  const username = cfg.username || "nazukiss";
  const repository = cfg.repository || "nixos-config";
  const project = cfg.projectName || "nixos-config";
  const branch = cfg.branch || "main";
  const validRepo = Boolean(username && repository && !username.startsWith("YOUR_") && !repository.startsWith("YOUR_"));
  const repoUrl = validRepo ? `https://github.com/${encodeURIComponent(username)}/${encodeURIComponent(repository)}` : "https://github.com/";
  document.title = `${project} // NIXOS SYSTEM INTERFACE`;
  setText("[data-project]", project); setText("#project-title", project);
  setText("[data-description]", cfg.description); setText("[data-version]", cfg.version);
  setText("[data-license]", cfg.license); setText("[data-status]", cfg.status);
  setText("[data-username]", username); $("#year").textContent = new Date().getFullYear();
  document.querySelectorAll("[data-repo-link]").forEach(a => { a.href = repoUrl; });

  const tech = $("#tech-list");
  (cfg.technologies || []).forEach(value => { const span = document.createElement("span"); span.textContent = value; tech.append(span); });

  const sys = cfg.system || {};
  const sysGrid = $("#system-grid");
  [["OS",sys.os],["DISTRO",sys.distro],["DESKTOP",sys.desktop],["SHELL",sys.shell],["HARDWARE",sys.hardware]].forEach(([label,value]) => {
    const card = document.createElement("div"); card.className = "system-card";
    const small = document.createElement("small"); small.textContent = label;
    const strong = document.createElement("strong"); strong.textContent = value || "Not configured";
    card.append(small,strong); sysGrid.append(card);
  });
  document.querySelectorAll("[data-system]").forEach(el => { if (sys[el.dataset.system]) el.textContent = sys[el.dataset.system]; });

  // El árbol se obtiene de la API pública de GitHub; no depende de una lista mantenida a mano.
  const treeContainer = $("#file-tree");
  const treeHeader = document.querySelector(".tree-panel .panel-heading .panel-label");
  const treeUrl = `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repository)}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
  const contentsUrl = (path, isFolder) => `${repoUrl}/${isFolder ? "tree" : "blob"}/${encodeURIComponent(branch)}/${path.split("/").map(encodeURIComponent).join("/")}`;

  function showTreeMessage(message, isError = false) {
    treeContainer.replaceChildren();
    const p = document.createElement("p");
    p.className = "tree-message";
    p.textContent = message;
    treeContainer.append(p);
    if (isError && validRepo) {
      const link = document.createElement("a");
      link.className = "text-link";
      link.href = `${repoUrl}/tree/${encodeURIComponent(branch)}`;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = "Abrir el repositorio en GitHub ↗";
      treeContainer.append(link);
    }
  }

  function renderTree(entries) {
    const root = { name: repository, path: "", type: "tree", children: new Map() };
    for (const entry of entries) {
      if (!entry.path || entry.path.startsWith(".git/")) continue;
      const parts = entry.path.split("/");
      let node = root;
      parts.forEach((part, index) => {
        const path = parts.slice(0, index + 1).join("/");
        if (!node.children.has(part)) {
          node.children.set(part, {
            name: part,
            path,
            type: index === parts.length - 1 ? entry.type : "tree",
            children: new Map()
          });
        } else if (index === parts.length - 1) {
          node.children.get(part).type = entry.type;
        }
        node = node.children.get(part);
      });
    }

    const rows = [];
    function visit(parent, depth, ancestors) {
      const children = [...parent.children.values()].sort((a, b) => {
        if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
      });
      children.forEach((node, index) => {
        rows.push({ node, depth, last: index === children.length - 1, ancestors });
        if (node.type === "tree") visit(node, depth + 1, [...ancestors, index === children.length - 1]);
      });
    }
    visit(root, 0, []);

    const fragment = document.createDocumentFragment();
    rows.forEach(({ node, depth, last, ancestors }) => {
      const row = document.createElement("div");
      row.className = "tree-row";
      const name = document.createElement("a");
      const isFolder = node.type === "tree";
      name.className = `tree-name ${isFolder ? "folder" : "file"}`;
      name.href = contentsUrl(node.path, isFolder);
      name.target = "_blank";
      name.rel = "noreferrer";
      name.style.paddingLeft = `${depth * 20}px`;
      name.textContent = `${depth ? (last ? "└── " : "├── ") : ""}${isFolder ? "▸ " : ""}${node.name}`;
      name.setAttribute("aria-label", `${isFolder ? "Carpeta" : "Archivo"}: ${node.path}`);
      const note = document.createElement("span");
      note.className = "tree-note";
      note.textContent = isFolder ? "DIRECTORY" : "FILE";
      row.append(name, note);
      fragment.append(row);
    });
    treeContainer.replaceChildren(fragment);
    if (treeHeader) treeHeader.textContent = `${rows.length} ENTRIES`;
  }

  if (!validRepo) {
    showTreeMessage("Configurá username y repository para cargar la estructura.", true);
  } else {
    showTreeMessage("Consultando la estructura real del repositorio…");
    fetch(treeUrl, { headers: { Accept: "application/vnd.github+json" } })
      .then(response => {
        if (!response.ok) throw new Error(response.status === 403 || response.status === 429 ? "GitHub limitó temporalmente las consultas." : `GitHub respondió con el estado ${response.status}.`);
        return response.json();
      })
      .then(data => {
        if (data.truncated) throw new Error("GitHub devolvió un árbol incompleto por el tamaño del repositorio.");
        if (!Array.isArray(data.tree)) throw new Error("La respuesta de GitHub no contiene una estructura válida.");
        const files = data.tree.filter(entry => entry.type === "blob").length;
        const folders = data.tree.filter(entry => entry.type === "tree").length;
        treeSummary = { files, folders };
        renderTree(data.tree);
        renderStats();
      })
      .catch(error => {
        console.error("No se pudo cargar el árbol de GitHub:", error);
        showTreeMessage(`No se pudo cargar el árbol: ${error.message}`, true);
        treeLoadError = error.message;
        renderStats();
        if (treeHeader) treeHeader.textContent = "UNAVAILABLE";
      });
  }

  if (cfg.showStats === false) $("#stats").hidden = true;
  const statsGrid = $("#stats-grid");
  let repoMetadata = null;
  let repoLoadError = null;
  let treeSummary = null;
  let treeLoadError = null;
  const numberFormat = new Intl.NumberFormat("es-AR");
  const dateFormat = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

  function renderStats() {
    const cards = [
      { label: "STARS", value: repoMetadata ? numberFormat.format(repoMetadata.stargazers_count) : (repoLoadError ? "No disponible" : "Cargando…"), url: `${repoUrl}/stargazers` },
      { label: "FORKS", value: repoMetadata ? numberFormat.format(repoMetadata.forks_count) : (repoLoadError ? "No disponible" : "Cargando…"), url: `${repoUrl}/forks` },
      { label: "OPEN ISSUES / PRs", value: repoMetadata ? numberFormat.format(repoMetadata.open_issues_count) : (repoLoadError ? "No disponible" : "Cargando…"), url: `${repoUrl}/issues` },
      { label: "ARCHIVOS", value: treeSummary ? numberFormat.format(treeSummary.files) : (treeLoadError ? "No disponible" : "Cargando…"), url: `${repoUrl}/tree/${encodeURIComponent(branch)}` },
      { label: "CARPETAS", value: treeSummary ? numberFormat.format(treeSummary.folders) : (treeLoadError ? "No disponible" : "Cargando…"), url: `${repoUrl}/tree/${encodeURIComponent(branch)}` },
      { label: "ÚLTIMA ACTUALIZACIÓN", value: repoMetadata ? dateFormat.format(new Date(repoMetadata.pushed_at)) : (repoLoadError ? "No disponible" : "Cargando…"), url: `${repoUrl}/commits/${encodeURIComponent(branch)}` },
      { label: "COMMITS", value: "Ver historial ↗", url: `${repoUrl}/commits/${encodeURIComponent(branch)}` },
      { label: "REPOSITORIO", value: `${username}/${repository}`, url: repoUrl }
    ];
    statsGrid.replaceChildren();
    cards.forEach(({ label, value, url }) => {
      const a = document.createElement("a");
      a.className = "stat-card";
      a.href = url;
      a.target = "_blank";
      a.rel = "noreferrer";
      const small = document.createElement("small");
      small.textContent = label;
      const strong = document.createElement("strong");
      strong.textContent = value;
      a.append(small, strong);
      statsGrid.append(a);
    });
  }

  renderStats();
  if (validRepo) {
    fetch(`https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repository)}`, {
      headers: { Accept: "application/vnd.github+json" }
    })
      .then(response => {
        if (!response.ok) throw new Error(response.status === 403 || response.status === 429 ? "GitHub limitó temporalmente las consultas." : `GitHub respondió con el estado ${response.status}.`);
        return response.json();
      })
      .then(data => {
        repoMetadata = data;
        renderStats();
      })
      .catch(error => {
        console.error("No se pudieron cargar las estadísticas de GitHub:", error);
        repoLoadError = error.message;
        renderStats();
        const note = document.createElement("p");
        note.className = "muted stats-error";
        note.textContent = `No se pudieron cargar algunos datos: ${error.message} Podés consultarlos directamente en GitHub.`;
        statsGrid.append(note);
      });
  }
  const langCard = $("#language-card");
  const languageChart = $("#language-chart");
  const languageStatus = $("#language-status");
  if (cfg.showLanguageStats === false) langCard.hidden = true;
  else if (validRepo) {
    languageStatus.textContent = "Consultando los lenguajes detectados por GitHub…";
    fetch(`https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repository)}/languages`, {
      headers: { Accept: "application/vnd.github+json" }
    })
      .then(response => {
        if (!response.ok) throw new Error(response.status === 403 || response.status === 429 ? "GitHub limitó temporalmente las consultas." : `GitHub respondió con el estado ${response.status}.`);
        return response.json();
      })
      .then(languages => {
        const entries = Object.entries(languages).filter(([, bytes]) => Number.isFinite(bytes) && bytes > 0).sort((a, b) => b[1] - a[1]);
        const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
        languageChart.replaceChildren();
        if (!entries.length || !total) {
          languageStatus.textContent = "GitHub todavía no informa lenguajes para este repositorio.";
          return;
        }
        languageStatus.textContent = "Distribución según los bytes de código detectados por GitHub; no representa porcentajes exactos de tiempo o esfuerzo.";
        entries.forEach(([name, bytes]) => {
          const percent = bytes / total * 100;
          const row = document.createElement("div");
          row.className = "language-row";
          const meta = document.createElement("div");
          meta.className = "language-meta";
          const label = document.createElement("span");
          label.textContent = name;
          const value = document.createElement("span");
          value.textContent = `${percent.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;
          const track = document.createElement("div");
          track.className = "language-track";
          track.setAttribute("role", "img");
          track.setAttribute("aria-label", `${name}: ${percent.toFixed(1)} por ciento`);
          const bar = document.createElement("div");
          bar.className = "language-bar";
          bar.style.width = `${percent}%`;
          track.append(bar);
          meta.append(label, value);
          row.append(meta, track);
          languageChart.append(row);
        });
      })
      .catch(error => {
        console.error("No se pudo cargar la distribución de lenguajes:", error);
        languageStatus.textContent = `No se pudo cargar la distribución: ${error.message} Podés consultar los lenguajes en GitHub.`;
      });
  } else {
    languageStatus.textContent = "Configurá username y repository para mostrar estadísticas.";
  }

  const lines = ["nix flake show","git status","sudo nixos-rebuild switch --flake .#<hostname>"];
  const typed = $("#typed-text");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) typed.textContent = lines[0];
  else {
    let line=0,char=0,deleting=false;
    function tick() {
      const current=lines[line]; typed.textContent=current.slice(0,char);
      if (!deleting && char<current.length) { char++; setTimeout(tick,48); }
      else if (!deleting) { deleting=true; setTimeout(tick,1150); }
      else if (char>0) { char--; setTimeout(tick,22); }
      else { deleting=false; line=(line+1)%lines.length; setTimeout(tick,280); }
    }
    tick();
  }
})();