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

let pages = [
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

let nav = document.createElement("nav");
nav.className = "site-nav";
nav.setAttribute("aria-label", "Primary");

let brand = document.createElement("a");
brand.className = "nav-brand";
brand.href = BASE_PATH;
brand.textContent = "Jay Manjrekar";
nav.append(brand);

let ul = document.createElement("ul");
nav.append(ul);

for (let p of pages) {
  let url = p.url;
  url = !url.startsWith("http") ? BASE_PATH + url : url;

  let a = document.createElement("a");
  a.href = url;
  a.textContent = p.title;

  let li = document.createElement("li");
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
