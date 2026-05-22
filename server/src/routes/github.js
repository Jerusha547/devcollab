const express = require("express");
const axios = require("axios");
const router = express.Router();

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
  if (req.user) return next();
  res.status(401).json({ message: "Not logged in" });
};

// Get all repos of logged in user
router.get("/repos", isAuthenticated, async (req, res) => {
  try {
    const response = await axios.get("https://api.github.com/user/repos", {
      headers: {
        Authorization: `Bearer ${req.user.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
      params: {
        sort: "updated",
        per_page: 20,
      },
    });
    const repos = response.data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      url: repo.html_url,
    }));
    res.json(repos);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch repos" });
  }
});

// Get PRs for a specific repo
router.get("/repos/:owner/:repo/pulls", isAuthenticated, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        headers: {
          Authorization: `Bearer ${req.user.access_token}`,
          Accept: "application/vnd.github.v3+json",
        },
        params: {
          state: "open",
          per_page: 20,
        },
      },
    );
    const pulls = response.data.map((pr) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      created_at: pr.created_at,
      user: pr.user.login,
    }));
    res.json(pulls);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch pull requests" });
  }
});

module.exports = router;
