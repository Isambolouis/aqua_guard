

const socket = io();
const tableBody = document.getElementById("table-body");

function addRow(data) {
    const table = document.getElementById("dataTable");
    const row = table.insertRow(1);

    if (data.leak.toLowerCase() === "oui") {
        row.classList.add("leak-row");
        document.getElementById("alertBox").classList.remove("hidden");
    }

    row.innerHTML = `
        <td>${data.date}</td>
        <td>${data.flow_up}</td>
        <td>${data.flow_down}</td>
        <td>${data.leak}</td>
    `;
}




/* ====== Graphique ====== */
const ctx = document.getElementById("flowChart").getContext("2d");

const flowChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: [],
        datasets: [
            {
                label: "Débit enterré",
                data: [],
                borderWidth: 2
            },
            {
                label: "Débit sortie",
                data: [],
                borderWidth: 2
            }
        ]
    }
});

function updateChart(data) {
    flowChart.data.labels.push(data.date);
    flowChart.data.datasets[0].data.push(data.flow_up);
    flowChart.data.datasets[1].data.push(data.flow_down);

    if (flowChart.data.labels.length > 20) {
        flowChart.data.labels.shift();
        flowChart.data.datasets.forEach(ds => ds.data.shift());
    }

    flowChart.update();
}


/* ====== Export CSV ====== */
document.getElementById("exportBtn").onclick = () => {
    window.location.href = "/api/export/csv";
};


/* ====== Statistiques ====== */
let totalUp = 0;
let totalDown = 0;
let count = 0;
let leaks = 0;

function updateStats(data) {
    totalUp += Number(data.flow_up);
    totalDown += Number(data.flow_down);
    count++;

    if (data.leak.toLowerCase() === "oui") leaks++;

    document.getElementById("avgUp").innerText =
        (totalUp / count).toFixed(2);

    document.getElementById("avgDown").innerText =
        (totalDown / count).toFixed(2);

    document.getElementById("leakCount").innerText = leaks;
}


socket.on("history", rows => {
    rows.reverse().forEach(row => {
        addRow(row);
        updateChart(row);
        updateStats(row);
    });
    
});

socket.on("new_data", data => {
    addRow(data);
    updateChart(data);
    updateStats(data);
    console.log(data);
    
});
