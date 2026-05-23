const express = require("express");
const axios = require("axios");
const pool = require("../db");

module.exports = (notifyUser) => {
  const router = express.Router();

  const isAuthenticated = (req, res, next) => {
    if (req.user) return next();
    res.status(401).json({ message: "Not logged in" });
  };

  // Submit a PR for review
  router.post("/submit", isAuthenticated, async (req, res) => {
    try {
      const { github_pr_url, reviewer_id } = req.body;

      const parts = github_pr_url.split("/");
      const owner = parts[3];
      const repo = parts[4];
      const pr_number = parts[6];

      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pr_number}`,
        {
          headers: {
            Authorization: `Bearer ${req.user.access_token}`,
            Accept: "application/vnd.github.v3+json",
          },
        },
      );

      const title = response.data.title;

      const result = await pool.query(
        `INSERT INTO pull_requests 
          (github_pr_url, title, submitter_id, reviewer_id, status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING *`,
        [github_pr_url, title, req.user.username, reviewer_id],
      );

      // Notify reviewer in real time
      notifyUser(reviewer_id, {
        type: "new_review_request",
        message: `${req.user.username} assigned you a PR to review: "${title}"`,
        pr: result.rows[0],
      });

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Submit error:", error.message);
      res.status(500).json({ message: "Failed to submit PR" });
    }
  });

  // Get all PRs submitted by logged in user
  router.get("/submitted", isAuthenticated, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM pull_requests WHERE submitter_id = $1 ORDER BY created_at DESC`,
        [req.user.username],
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Submitted error:", error.message);
      res.status(500).json({ message: "Failed to fetch PRs" });
    }
  });

  // Get all PRs assigned to logged in user
  router.get("/assigned", isAuthenticated, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM pull_requests WHERE reviewer_id = $1 ORDER BY created_at DESC`,
        [req.user.username],
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Assigned error:", error.message);
      res.status(500).json({ message: "Failed to fetch PRs" });
    }
  });

  // Update PR status
  router.patch("/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = [
        "pending",
        "in-review",
        "approved",
        "changes-requested",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const result = await pool.query(
        `UPDATE pull_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [status, id],
      );

      const pr = result.rows[0];

      // Notify submitter in real time
      notifyUser(pr.submitter_id, {
        type: "status_update",
        message: `Your PR "${pr.title}" status changed to: ${status}`,
        pr,
      });

      res.json(pr);
    } catch (error) {
      console.error("Status error:", error.message);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  return router;
};
