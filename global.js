console.log("IT'S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/"
    : (() => {
        const segs = location.pathname.split("/").filter(Boolean);
        return segs.length ? `/${segs[0]}/` : "/";
      })();

function normalizePath(pathname) {
  let p = pathname.replace(/\/index\.html$/i, "");
  if (p.length > 1 && p.endsWith("/")) {
    p = p.slice(0, -1);
  }
  return p || "/";
}

function isCurrentPage(a) {
  return (
    a.host === location.host &&
    normalizePath(a.pathname) === normalizePath(location.pathname)
  );
}

const pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "cv/", title: "CV" },
  { url: "https://github.com/JayManjrekar0827", title: "GitHub" },
  { url: "https://www.linkedin.com/in/jay-manjrekar-789759276", title: "LinkedIn" },
];

document.body.insertAdjacentHTML(
  "afterbegin",
  `<label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>`,
);

const nav = document.createElement("nav");
nav.className = "site-nav";
nav.setAttribute("aria-label", "Primary");

const brand = document.createElement("a");
brand.className = "nav-brand";
brand.href = BASE_PATH;
brand.textContent = "Jay Manjrekar";
nav.append(brand);

const ul = document.createElement("ul");
nav.append(ul);

for (const p of pages) {
  let url = p.url;
  url = !url.startsWith("http") ? BASE_PATH + url : url;

  const a = document.createElement("a");
  a.href = url;
  a.textContent = p.title;

  const li = document.createElement("li");
  li.append(a);
  ul.append(li);

  a.classList.toggle("current", isCurrentPage(a));

  if (a.host !== location.host) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
}

document.body.prepend(nav);

function setColorScheme(value) {
  document.documentElement.style.setProperty("color-scheme", value);
  const sel = document.querySelector(".color-scheme select");
  if (sel) {
    sel.value = value;
  }
}

const select = document.querySelector(".color-scheme select");
select?.addEventListener("input", (event) => {
  const value = event.target.value;
  setColorScheme(value);
  localStorage.colorScheme = value;
});

if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
} else if (select) {
  select.value = "light dark";
}

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch JSON from ${url}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching or parsing JSON data:", error);
    return [];
  }
}

function normalizeHeadingLevel(headingLevel) {
  return /^h[1-6]$/.test(headingLevel) ? headingLevel : "h2";
}

export function renderProjects(projects, containerElement, headingLevel = "h2") {
  if (!(containerElement instanceof Element)) {
    console.error("renderProjects expected a valid container element.");
    return;
  }

  containerElement.innerHTML = "";

  if (!Array.isArray(projects) || projects.length === 0) {
    containerElement.innerHTML = "<p>No projects available yet.</p>";
    return;
  }

  const safeHeading = normalizeHeadingLevel(headingLevel);

  for (const project of projects) {
    const article = document.createElement("article");

    const title = project.title ?? "Untitled Project";
    const image = project.image ?? "https://vis-society.github.io/labs/2/images/empty.svg";
    const description = project.description ?? "Description coming soon.";
    const year = project.year != null && project.year !== "" ? String(project.year) : "";

    article.innerHTML = `
      <${safeHeading}>${title}</${safeHeading}>
      <img src="${image}" alt="${title}">
      <div class="project-copy">
        <p>${description}</p>
        ${year ? `<p class="project-year">${year}</p>` : ""}
      </div>
    `;

    containerElement.appendChild(article);
  }
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}

export { $$, BASE_PATH };
