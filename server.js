// server.js
const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const fs = require("fs");
const axios = require("axios");

dotenv.config();

const app = express();

// Helmet avec frameSrc pour autoriser l'affichage du PDF dans un iframe
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      frameSrc: [
        "'self'"
      ]
    }
  }
}));

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

// Configuration des vues
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Log pour les téléchargements
const logPath = path.join(__dirname, "cv-downloads.log");
if (!fs.existsSync(logPath)) fs.writeFileSync(logPath, "");

// Route principale
app.get("/", (req, res) => {
  const projects = [
    {
      title: "Site vitrine cybersécurité",
      description: "Site responsive pour sensibiliser aux risques numériques.",
      image: "/images/project1.avif",
      link: "https://exemple.com/projet1"
    },
    {
      title: "Script Python de sauvegarde",
      description: "Automatisation des sauvegardes locales avec Python.",
      image: "/images/project2.avif",
      link: ""
    },
    {
      title: "Dashboard SQL",
      description: "Suivi des incidents réseau avec SQL et visualisation.",
      image: "/images/project3.avif",
      link: ""
    }
  ];

  fs.readFile(logPath, "utf8", (err, data) => {
    let downloadCount = 0;
    if (!err && data) {
      const lignes = data.trim().split("\n").filter(Boolean);
      downloadCount = lignes.length;
    }

    res.render("index", { projects, downloadCount });
  });
});

// Route de téléchargement du CV
app.get("/telecharger-cv", async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const timestamp = new Date().toISOString();

  const logEntry = `[${timestamp}] - IP: ${ip}\n`;
  fs.appendFile(logPath, logEntry, (err) => {
    if (err) console.error("Erreur enregistrement IP :", err);
  });

  const filePath = path.join(__dirname, "public/files/Thibault_Claudon_CV.pdf");
  res.download(filePath, "Thibault_Claudon_CV.pdf");
});

// Page mentions légales
app.get("/mentions", (req, res) => {
  res.render("mentions");
});

// Page plan du site
app.get("/plan", (req, res) => {
  res.render("plan");
});

// Envoi de mail avec nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post("/send", (req, res) => {
  const { name, email, subject, message } = req.body;
  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: `[Portfolio] ${subject}`,
    text: `Nom : ${name}\nEmail : ${email}\n\n${message}`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("Erreur mail :", err);
      return res.status(500).send("Erreur lors de l'envoi du message.");
    }
    res.send("Message envoyé !");
  });
});

// Middleware global d'erreur
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Une erreur s'est produite.");
});

// Démarrage serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Portfolio en ligne sur http://localhost:${PORT}`);
});