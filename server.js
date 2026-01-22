const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const session = require("express-session");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(session({
    secret: "aquaguard_secret_2026",
    resave: false,
    saveUninitialized: true
}));

/* ====== Base de données SQLite ====== */
const db = new sqlite3.Database("db.sqlite");

db.run(`
CREATE TABLE IF NOT EXISTS water_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    flow_up REAL,
    flow_down REAL,
    leak TEXT
)
`);


// ====== Authentification simple ======
const PASSWORD = "iot1234567";

app.post("/login", (req, res) => {
    const { password } = req.body;

    if (password === PASSWORD) {
        req.session.authenticated = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

function authMiddleware(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect("/login.html");
    }
}

app.get("/", authMiddleware, (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});


/* ====== API REST POST ====== */
app.post("/api/data", (req, res) => {
    const { api_key, flow_up, flow_down } = req.body;

    if (api_key !== "AquaGuard_Secret_Key_2026") {
        return res.status(401).json({ error: "API Key invalide" });
    }

    const date = new Date().toISOString();
    const leak = flow_up > flow_down ? "OUI" : "NON";

    db.run(
        `INSERT INTO water_data (date, flow_up, flow_down, leak)
         VALUES (?, ?, ?, ?)`,
        [date, flow_up, flow_down, leak]
    );

    const data = { date, flow_up, flow_down, leak };

    /* Envoi temps réel */
    io.emit("new_data", data);

    res.json({ message: "Données enregistrées", data });
});

/* ====== Export CSV ====== */

app.get("/api/export/csv", authMiddleware, (req, res) => {
    db.all("SELECT * FROM water_data", (err, rows) => {
        if (err) return res.status(500).send("Erreur CSV");

        let csv = "date,flow_up,flow_down,leak\n";
        rows.forEach(r => {
            csv += `${r.date},${r.flow_up},${r.flow_down},${r.leak}\n`;
        });

        fs.writeFileSync("data.csv", csv);
        res.download("data.csv");
    });
});


/* ====== WebSocket ====== */
io.on("connection", (socket) => {
    console.log("Client connecté");

    db.all(
        `SELECT * FROM water_data ORDER BY id DESC LIMIT 20`,
        (err, rows) => {
            socket.emit("history", rows);
        }
    );
});

/* ====== Lancement ====== */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur AquaGuard actif sur le port ${PORT}`);
});




