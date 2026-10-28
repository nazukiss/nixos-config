(() => {
  const cfg = window.SITE_CONFIG || {};
  const $ = (s) => document.querySelector(s);
  const setText = (s, v) => { if (v) document.querySelectorAll(s).forEach(el => el.textContent = v); };
  const username = cfg.username || "nazukiss";
  const repository = cfg.repository || "nixos-config";
  const project = cfg.projectName || "nixos-config";
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

  const tree = $("#file-tree");
  (cfg.tree || []).forEach((entry,index,list) => {
    const row = document.createElement("div"); row.className = "tree-row";
    const name = document.createElement("span"); name.className = `tree-name ${entry.kind === "folder" ? "folder" : "file"}`;
    name.textContent = `${index === list.length - 1 ? "└── " : "├── "}${entry.name || "unnamed"}`;
    const note = document.createElement("span"); note.className = "tree-note"; note.textContent = entry.note || "";
    row.append(name,note); tree.append(row);
  });

  if (cfg.showStats === false) $("#stats").hidden = true;
  const statsGrid = $("#stats-grid");
  [["REPOSITORY",`${username}/${repository}`,repoUrl],["COMMITS","View commit history ↗",`${repoUrl}/commits`],["ISSUES","Browse issues ↗",`${repoUrl}/issues`]].forEach(([label,value,url]) => {
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
