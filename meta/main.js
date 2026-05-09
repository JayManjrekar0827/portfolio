import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

async function loadData() {
  const data = await d3.csv("loc.csv", (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + "T00:00" + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      const first = lines[0];
      const { author, date, time, timezone, datetime } = first;
      const ret = {
        id: commit,
        url: `https://github.com/JayManjrekar0827/portfolio/commit/${commit}`,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, "lines", {
        value: lines,
        writable: false,
        configurable: false,
        enumerable: false,
      });

      return ret;
    })
    .sort((a, b) => a.datetime - b.datetime);
}

function renderCommitInfo(data, commits) {
  d3.select("#stats").selectAll("*").remove();
  const dl = d3.select("#stats").append("dl").attr("class", "stats");

  dl.append("dt").html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append("dd").text(data.length);

  dl.append("dt").text("Total commits");
  dl.append("dd").text(commits.length);

  const fileGroups = d3.groups(data, (d) => d.file);
  dl.append("dt").text("Files");
  dl.append("dd").text(fileGroups.length);

  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (l) => l.line),
    (d) => d.file,
  );
  const longestFile = d3.greatest(fileLengths, (d) => d[1]);
  dl.append("dt").text("Longest file");
  dl.append("dd").text(`${longestFile[0]} (${longestFile[1]} lines)`);

  const avgFileLength = d3.mean(fileLengths, (d) => d[1]);
  dl.append("dt").text("Avg file length");
  dl.append("dd").text(`${Math.round(avgFileLength)} lines`);

  const maxDepth = d3.max(data, (d) => d.depth);
  dl.append("dt").text("Max indentation");
  dl.append("dd").text(maxDepth);

  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) =>
      new Date(d.datetime).toLocaleString("en", { dayPeriod: "short" }),
  );
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0] ?? "—";
  dl.append("dt").text("Most active time");
  dl.append("dd").text(maxPeriod);
}

const data = await loadData();
const commits = processCommits(data);

renderCommitInfo(data, commits);
