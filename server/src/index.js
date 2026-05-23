const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const { createServer } = require("http");
const { WebSocketServer } = require("ws");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server from express app
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Store connected clients: { username: ws }
const clients = new Map();

wss.on("connection", (ws, req) => {
  let username = null;

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === "register") {
        username = data.username;
        clients.set(username, ws);
        console.log(`WebSocket registered: ${username}`);
      }
    } catch (e) {
      console.error("WebSocket message error:", e);
    }
  });

  ws.on("close", () => {
    if (username) {
      clients.delete(username);
      console.log(`WebSocket disconnected: ${username}`);
    }
  });
});

// Export so routes can use it
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
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      sameSite: "none",
      httpOnly: true,
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

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

// Routes
const githubRoutes = require("./routes/github");
const prRoutes = require("./routes/prs")(notifyUser);

app.get("/", (req, res) => res.json({ message: "DevCollab API running" }));
app.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user", "repo"] }),
);
app.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
  }),
  (req, res) => res.redirect(`${process.env.CLIENT_URL}/dashboard`),
);
app.get("/auth/me", (req, res) => {
  if (req.user) res.json(req.user);
  else res.status(401).json({ message: "Not logged in" });
});
app.get("/auth/logout", (req, res) => {
  req.logout(() => res.json({ message: "Logged out" }));
});

app.use("/github", githubRoutes);
app.use("/prs", prRoutes);

// Use server.listen instead of app.listen
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
