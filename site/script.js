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
        renderTree(data.tree);
      })
      .catch(error => {
        console.error("No se pudo cargar el árbol de GitHub:", error);
        showTreeMessage(`No se pudo cargar el árbol: ${error.message}`, true);
        if (treeHeader) treeHeader.textContent = "UNAVAILABLE";
      });
  }

  if (cfg.showStats === false) $("#stats").hidden = true;
  const statsGrid = $("#stats-grid");
  [["REPOSITORY",`${username}/${repository}`,repoUrl],["COMMITS","View commit history ↗",`${repoUrl}/commits/${encodeURIComponent(branch)}`],["ISSUES","Browse issues ↗",`${repoUrl}/issues`]].forEach(([label,value,url]) => {
    const a = document.createElement("a"); a.className = "stat-card"; a.href = url; a.target = "_blank"; a.rel = "noreferrer";
    const small = document.createElement("small"); small.textContent = label;
    const strong = document.createElement("strong"); strong.textContent = value;
    a.append(small,strong); statsGrid.append(a);
  });
  const langCard = $("#language-card");
  if (cfg.showLanguageStats === false) langCard.hidden = true;
  else if (validRepo) {
    const img = $("#language-image");
    img.src = `https://github-readme-stats.vercel.app/api/top-langs/?username=${encodeURIComponent(username)}&repo=${encodeURIComponent(repository)}&layout=compact&theme=chartreuse-dark&hide_border=true&bg_color=0d1511&title_color=53f59a&text_color=e3eee7`;
    img.addEventListener("error", () => { langCard.querySelector("p").textContent = "No se pudo cargar el gráfico externo. El repositorio podría ser privado o el servicio no estar disponible."; img.hidden = true; }, {once:true});
  } else { langCard.querySelector("p").textContent = "Configurá username y repository para mostrar estadísticas."; $("#language-image").hidden = true; }

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