
const results = [
  { date: "2025-06-01", event: "Youth Cup", score: "4.5/5", place: "1st" },
  { date: "2025-05-20", event: "School Championship", score: "5/6", place: "2nd" }
];

const table = document.getElementById('resultsTable');
table.innerHTML = "<tr><th>Date</th><th>Event</th><th>Score</th><th>Place</th></tr>";
results.forEach(r => {
  table.innerHTML += `<tr><td>${r.date}</td><td>${r.event}</td><td>${r.score}</td><td>${r.place}</td></tr>`;
});
