import { fetchJSON, renderProjects, fetchGitHubData } from "./global.js";

async function initHomePage() {
  const projects = await fetchJSON("./lib/projects.json");
  const latestProjects = Array.isArray(projects) ? projects.slice(0, 3) : [];
  const projectsContainer = document.querySelector(".projects");

  if (projectsContainer) {
    renderProjects(latestProjects, projectsContainer, "h2");
  }

  const githubData = await fetchGitHubData("JayManjrekar0827");
  const profileStats = document.querySelector("#profile-stats");

  if (profileStats && githubData) {
    profileStats.innerHTML = `
      <dl>
        <dt>Public Repos</dt><dd>${githubData.public_repos ?? "N/A"}</dd>
        <dt>Public Gists</dt><dd>${githubData.public_gists ?? "N/A"}</dd>
        <dt>Followers</dt><dd>${githubData.followers ?? "N/A"}</dd>
        <dt>Following</dt><dd>${githubData.following ?? "N/A"}</dd>
      </dl>
    `;
  }
}

initHomePage();
