const STORAGE_KEY = "grant-atlas-state-v1";

const demoState = {
  grants: [
    {
      id: crypto.randomUUID(),
      name: "Creative Futures Grant",
      funder: "Provincial Arts Council",
      amount: 42000,
      status: "Awarded",
      deadline: "2026-05-14",
      projectIds: [],
    },
    {
      id: crypto.randomUUID(),
      name: "Neighborhood Impact Fund",
      funder: "City Partnership Office",
      amount: 18500,
      status: "In Review",
      deadline: "2026-04-28",
      projectIds: [],
    },
    {
      id: crypto.randomUUID(),
      name: "Digital Inclusion Grant",
      funder: "Northern Tech Foundation",
      amount: 31000,
      status: "Awarded",
      deadline: "2026-06-10",
      projectIds: [],
    },
  ],
  projects: [
    {
      id: crypto.randomUUID(),
      name: "Mobile Maker Lab",
      owner: "Youth Programs",
      stage: "In Progress",
      budget: 36000,
    },
    {
      id: crypto.randomUUID(),
      name: "Community Archive Portal",
      owner: "Digital Team",
      stage: "Planning",
      budget: 24000,
    },
    {
      id: crypto.randomUUID(),
      name: "Laneway Mural Series",
      owner: "Arts Collective",
      stage: "Completed",
      budget: 14000,
    },
  ],
};

demoState.grants[0].projectIds = [demoState.projects[0].id, demoState.projects[2].id];
demoState.grants[1].projectIds = [demoState.projects[1].id];
demoState.grants[2].projectIds = [demoState.projects[0].id, demoState.projects[1].id];

const elements = {
  awardedTotal: document.querySelector("#awardedTotal"),
  activeGrantCount: document.querySelector("#activeGrantCount"),
  fundedProjectCount: document.querySelector("#fundedProjectCount"),
  upcomingDeadlineCount: document.querySelector("#upcomingDeadlineCount"),
  grantCoverageRate: document.querySelector("#grantCoverageRate"),
  coverageProgress: document.querySelector("#coverageProgress"),
  pipelineBadge: document.querySelector("#pipelineBadge"),
  statusBars: document.querySelector("#statusBars"),
  grantList: document.querySelector("#grantList"),
  timelineList: document.querySelector("#timelineList"),
  projectCards: document.querySelector("#projectCards"),
  grantForm: document.querySelector("#grantForm"),
  projectForm: document.querySelector("#projectForm"),
  grantProjectSelect: document.querySelector("#grantProjectSelect"),
  seedDemoButton: document.querySelector("#seedDemoButton"),
  grantItemTemplate: document.querySelector("#grantItemTemplate"),
  projectCardTemplate: document.querySelector("#projectCardTemplate"),
};

function loadState() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(demoState);

  try {
    const parsed = JSON.parse(raw);
    return {
      grants: Array.isArray(parsed.grants) ? parsed.grants : structuredClone(demoState.grants),
      projects: Array.isArray(parsed.projects) ? parsed.projects : structuredClone(demoState.projects),
    };
  } catch {
    return structuredClone(demoState);
  }
}

let state = loadState();

function saveState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function daysUntil(dateValue) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateValue}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function getProjectName(projectId) {
  return state.projects.find((project) => project.id === projectId)?.name ?? "Unknown project";
}

function getLinkedGrants(projectId) {
  return state.grants.filter((grant) => grant.projectIds.includes(projectId));
}

function buildProjectOptions() {
  elements.grantProjectSelect.innerHTML = "";

  state.projects.forEach((project) => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = `${project.name} (${project.stage})`;
    elements.grantProjectSelect.append(option);
  });
}

function renderSummary() {
  const awardedGrants = state.grants.filter((grant) => grant.status === "Awarded");
  const awardedTotal = awardedGrants.reduce((sum, grant) => sum + Number(grant.amount), 0);
  const activeGrantCount = state.grants.filter((grant) =>
    ["Awarded", "In Review", "Drafting"].includes(grant.status)
  ).length;
  const fundedProjects = state.projects.filter((project) => getLinkedGrants(project.id).length > 0).length;
  const upcomingDeadlineCount = state.grants.filter((grant) => {
    const diff = daysUntil(grant.deadline);
    return diff >= 0 && diff <= 30;
  }).length;
  const coverageRate = state.projects.length
    ? Math.round((fundedProjects / state.projects.length) * 100)
    : 0;

  elements.awardedTotal.textContent = formatCurrency(awardedTotal);
  elements.activeGrantCount.textContent = String(activeGrantCount);
  elements.fundedProjectCount.textContent = String(fundedProjects);
  elements.upcomingDeadlineCount.textContent = String(upcomingDeadlineCount);
  elements.grantCoverageRate.textContent = `${coverageRate}%`;
  elements.coverageProgress.style.width = `${coverageRate}%`;
  elements.pipelineBadge.textContent = `${state.grants.length} total`;
}

function renderStatusBars() {
  const statuses = ["Awarded", "In Review", "Drafting", "Closed"];
  elements.statusBars.innerHTML = "";

  statuses.forEach((status) => {
    const count = state.grants.filter((grant) => grant.status === status).length;
    const width = state.grants.length ? (count / state.grants.length) * 100 : 0;

    const row = document.createElement("div");
    row.className = "status-row";
    row.innerHTML = `
      <span>${status}</span>
      <div class="bar-track"><div class="bar-fill" style="width: ${width}%"></div></div>
      <strong>${count}</strong>
    `;
    elements.statusBars.append(row);
  });
}

function renderGrantList() {
  elements.grantList.innerHTML = "";

  const sorted = [...state.grants].sort((a, b) => Number(b.amount) - Number(a.amount));

  if (!sorted.length) {
    elements.grantList.innerHTML = '<div class="empty-state">No grants yet. Add your first one to start tracking funding.</div>';
    return;
  }

  sorted.forEach((grant) => {
    const node = elements.grantItemTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".grant-name").textContent = grant.name;
    node.querySelector(".grant-meta").textContent =
      `${grant.funder} • ${grant.projectIds.length} linked project${grant.projectIds.length === 1 ? "" : "s"}`;
    node.querySelector(".grant-amount").textContent = formatCurrency(Number(grant.amount));
    node.querySelector(".tag").textContent = grant.status;
    elements.grantList.append(node);
  });
}

function renderTimeline() {
  elements.timelineList.innerHTML = "";

  const sorted = [...state.grants].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  if (!sorted.length) {
    elements.timelineList.innerHTML = '<div class="empty-state">No deadlines to show yet.</div>';
    return;
  }

  sorted.forEach((grant) => {
    const diff = daysUntil(grant.deadline);
    const item = document.createElement("article");
    item.className = "timeline-item";
    item.innerHTML = `
      <div class="timeline-date">${formatDate(grant.deadline)}</div>
      <div>
        <p class="timeline-title">${grant.name}</p>
        <p class="timeline-meta">${grant.funder} • ${diff < 0 ? `${Math.abs(diff)} days ago` : `in ${diff} days`}</p>
      </div>
      <span class="tag">${grant.status}</span>
    `;
    elements.timelineList.append(item);
  });
}

function renderProjects() {
  elements.projectCards.innerHTML = "";

  if (!state.projects.length) {
    elements.projectCards.innerHTML = '<div class="empty-state">No projects yet. Add one and then connect funding to it.</div>';
    return;
  }

  state.projects.forEach((project) => {
    const grants = getLinkedGrants(project.id);
    const node = elements.projectCardTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".project-name").textContent = project.name;
    node.querySelector(".project-owner").textContent = `Lead: ${project.owner}`;
    node.querySelector(".project-stage").textContent = project.stage;
    node.querySelector(".project-budget").textContent = formatCurrency(Number(project.budget));
    node.querySelector(".project-grant-count").textContent = String(grants.length);

    const linkedGrants = node.querySelector(".linked-grants");
    if (grants.length) {
      grants.forEach((grant) => {
        const pill = document.createElement("div");
        pill.className = "linked-grant-pill";
        pill.textContent = `${grant.name} • ${formatCurrency(Number(grant.amount))}`;
        linkedGrants.append(pill);
      });
    } else {
      linkedGrants.innerHTML = '<div class="empty-state">No funding linked yet.</div>';
    }

    elements.projectCards.append(node);
  });
}

function render() {
  buildProjectOptions();
  renderSummary();
  renderStatusBars();
  renderGrantList();
  renderTimeline();
  renderProjects();
}

elements.grantForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);

  state.grants.unshift({
    id: crypto.randomUUID(),
    name: String(formData.get("name")).trim(),
    funder: String(formData.get("funder")).trim(),
    amount: Number(formData.get("amount")),
    status: String(formData.get("status")),
    deadline: String(formData.get("deadline")),
    projectIds: formData.getAll("projectIds").map(String),
  });

  saveState();
  event.currentTarget.reset();
  render();
});

elements.projectForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);

  state.projects.unshift({
    id: crypto.randomUUID(),
    name: String(formData.get("name")).trim(),
    owner: String(formData.get("owner")).trim(),
    stage: String(formData.get("stage")),
    budget: Number(formData.get("budget")),
  });

  saveState();
  event.currentTarget.reset();
  render();
});

elements.seedDemoButton.addEventListener("click", () => {
  state = structuredClone(demoState);
  saveState();
  render();
});

render();
