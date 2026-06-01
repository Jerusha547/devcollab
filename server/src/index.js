const express = require("express");
const cors = require("cors");
const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const jwt = require("jsonwebtoken");
const teamRoutes = require("./routes/teams")(authenticateJWT);
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const server = createServer(app);
const wss = new WebSocketServer({ server });
const clients = new Map();

wss.on("connection", (ws) => {
  let username = null;
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === "register") {
        username = data.username;
        clients.set(username, ws);
      }
    } catch (e) {}
  });
  ws.on("close", () => {
    if (username) clients.delete(username);
  });
});

const notifyUser = (username, payload) => {
  const client = clients.get(username);
  if (client && client.readyState === 1) {
    client.send(JSON.stringify(payload));
  }
};

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(passport.initialize());
app.use("/teams", teamRoutes);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL || "http://localhost:5000"}/auth/github/callback`,
    },
    (accessToken, refreshToken, profile, done) => {
      const user = {
        github_id: profile.id,
        username: profile.username,
        avatar_url: profile.photos[0].value,
        access_token: accessToken,
      };
      return done(null, user);
    },
  ),
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// JWT middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      return next();
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }
  }
  res.status(401).json({ message: "Not logged in" });
};

app.get("/", (req, res) => res.json({ message: "DevCollab API running" }));

app.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user", "repo"], session: false }),
);

app.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    failureRedirect: `${process.env.CLIENT_URL || "http://localhost:3000"}/login`,
    session: false,
  }),
  (req, res) => {
    const token = jwt.sign(req.user, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.redirect(
      `${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard?token=${token}`,
    );
  },
);

app.get("/auth/me", authenticateJWT, (req, res) => {
  res.json(req.user);
});

app.get("/auth/logout", (req, res) => {
  res.json({ message: "Logged out" });
});

const githubRoutes = require("./routes/github");
const prRoutes = require("./routes/prs")(notifyUser, authenticateJWT);

app.use("/github", githubRoutes);
app.use("/prs", prRoutes);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
