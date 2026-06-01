const express = require("express");
const axios = require("axios");
const pool = require("../db");

module.exports = (notifyUser, isAuthenticated) => {
  const router = express.Router();

  // const isAuthenticated = (req, res, next) => {
  //   if (req.user) return next();
  //   res.status(401).json({ message: "Not logged in" });
  // };

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
      const existing = await pool.query(
        `SELECT id FROM pull_requests 
   WHERE github_pr_url = $1 AND submitter_id = $2`,
        [github_pr_url, req.user.username],
      );

      if (existing.rows.length > 0) {
        return res
          .status(400)
          .json({ message: "You already submitted this PR for review" });
      }
      // Get user's team
      const teamResult = await pool.query(
        `SELECT t.id FROM teams t
   JOIN team_members tm ON t.id = tm.team_id
   WHERE tm.user_id = $1`,
        [req.user.username],
      );
      const team_id = teamResult.rows.length > 0 ? teamResult.rows[0].id : null;
      const result = await pool.query(
        `INSERT INTO pull_requests 
    (github_pr_url, title, submitter_id, reviewer_id, team_id, status)
   VALUES ($1, $2, $3, $4, $5, 'pending')
   RETURNING *`,
        [github_pr_url, title, req.user.username, reviewer_id, team_id],
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
      const teamResult = await pool.query(
        `SELECT t.id FROM teams t
   JOIN team_members tm ON t.id = tm.team_id
   WHERE tm.user_id = $1`,
        [req.user.username],
      );
      const team_id = teamResult.rows[0]?.id;

      const result = await pool.query(
        `SELECT * FROM pull_requests 
   WHERE submitter_id = $1 AND team_id = $2
   ORDER BY created_at DESC`,
        [req.user.username, team_id],
      );
    } catch (error) {
      console.error("Submitted error:", error.message);
      res.status(500).json({ message: "Failed to fetch PRs" });
    }
  });

  // Get all PRs assigned to logged in user
  router.get("/assigned", isAuthenticated, async (req, res) => {
    try {
      const teamResult = await pool.query(
        `SELECT t.id FROM teams t
   JOIN team_members tm ON t.id = tm.team_id
   WHERE tm.user_id = $1`,
        [req.user.username],
      );
      const team_id = teamResult.rows[0]?.id;

      const result = await pool.query(
        `SELECT * FROM pull_requests 
   WHERE reviewer_id = $1 AND team_id = $2
   ORDER BY created_at DESC`,
        [req.user.username, team_id],
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
  // Get dashboard metrics
  router.get("/metrics", isAuthenticated, async (req, res) => {
    try {
      const teamResult = await pool.query(
        `SELECT t.id FROM teams t
   JOIN team_members tm ON t.id = tm.team_id
   WHERE tm.user_id = $1`,
        [req.user.username],
      );
      const team_id = teamResult.rows[0]?.id;

      const totalPRs = await pool.query(
        `SELECT COUNT(*) FROM pull_requests 
   WHERE team_id = $1`,
        [team_id],
      );

      const byStatus = await pool.query(
        `SELECT status, COUNT(*) as count 
   FROM pull_requests 
   WHERE team_id = $1
   GROUP BY status`,
        [team_id],
      );

      const avgTurnaround = await pool.query(
        `SELECT ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600)::numeric, 1) as avg_hours
   FROM pull_requests
   WHERE team_id = $1 AND status = 'approved'`,
        [team_id],
      );

      const reviewLoad = await pool.query(
        `SELECT reviewer_id, COUNT(*) as assigned,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as completed
   FROM pull_requests
   WHERE team_id = $1
   GROUP BY reviewer_id
   ORDER BY assigned DESC`,
        [team_id],
      );

      res.json({
        total: parseInt(totalPRs.rows[0].count),
        byStatus: byStatus.rows,
        avgTurnaroundHours: avgTurnaround.rows[0].avg_hours || 0,
        reviewLoad: reviewLoad.rows,
      });
    } catch (error) {
      console.error("Metrics error:", error.message);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });
  return router;
};
