import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { fetchJSON, renderProjects } from "../global.js";

let allProjects = [];
let query = "";
let selectedIndex = -1;

const projectsContainer = document.querySelector(".projects");
const searchInput = document.querySelector(".searchBar");
const titleElement = document.querySelector(".projects-title");

function getSearchFiltered() {
  const q = query.trim().toLowerCase();
  if (!q) {
    return allProjects.slice();
  }
  return allProjects.filter((project) => {
    const values = Object.values(project).join("\n").toLowerCase();
    return values.includes(q);
  });
}

function getPieData(projectsSource) {
  const rolled = d3.rollups(
    projectsSource,
    (v) => v.length,
    (d) => d.year,
  );
  return rolled.map(([year, count]) => ({
    value: count,
    label: String(year ?? ""),
  }));
}

function getVisibleProjects() {
  const searchFiltered = getSearchFiltered();
  const pieData = getPieData(searchFiltered);
  if (selectedIndex < 0 || selectedIndex >= pieData.length) {
    return searchFiltered;
  }
  const year = pieData[selectedIndex].label;
  return searchFiltered.filter((p) => String(p.year ?? "") === year);
}

function renderPieChart(projectsForPie) {
  const svg = d3.select("#projects-pie-plot");
  const legend = d3.select(".legend");

  svg.selectAll("path").remove();
  legend.selectAll("li").remove();

  const data = getPieData(projectsForPie);
  if (!data.length) {
    return;
  }

  const colors = d3.scaleOrdinal(d3.schemeTableau10);
  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const arcData = sliceGenerator(data);
  const arcs = arcData.map((d) => arcGenerator(d));

  arcs.forEach((arcPath, i) => {
    svg
      .append("path")
      .attr("d", arcPath)
      .attr("fill", colors(i))
      .attr("class", i === selectedIndex ? "selected" : null)
      .on("click", () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        updatePage();
      });
  });

  data.forEach((d, idx) => {
    legend
      .append("li")
      .attr("class", idx === selectedIndex ? "legend-row selected" : "legend-row")
      .attr("style", `--color:${colors(idx)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on("click", () => {
        selectedIndex = selectedIndex === idx ? -1 : idx;
        updatePage();
      });
  });
}

function updatePage() {
  const searchFiltered = getSearchFiltered();
  const pieData = getPieData(searchFiltered);
  if (selectedIndex >= pieData.length) {
    selectedIndex = -1;
  }
  const visible = getVisibleProjects();

  if (projectsContainer) {
    renderProjects(visible, projectsContainer, "h2");
  }

  renderPieChart(searchFiltered);

  if (titleElement && Array.isArray(allProjects)) {
    titleElement.textContent = `${allProjects.length} Projects`;
  }
}

async function initProjectsPage() {
  allProjects = await fetchJSON("../lib/projects.json");
  if (!Array.isArray(allProjects)) {
    allProjects = [];
  }

  updatePage();

  searchInput?.addEventListener("input", (event) => {
    query = event.target.value;
    selectedIndex = -1;
    updatePage();
  });
}

initProjectsPage();
