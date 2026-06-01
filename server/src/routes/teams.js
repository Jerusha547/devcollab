const express = require("express");
const pool = require("../db");

module.exports = (isAuthenticated) => {
  const router = express.Router();

  // Get current user's team
  router.get("/mine", isAuthenticated, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT t.* FROM teams t
         JOIN team_members tm ON t.id = tm.team_id
         WHERE tm.user_id = $1`,
        [req.user.username],
      );
      if (result.rows.length === 0) {
        return res.json(null);
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Get team error:", error.message);
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  // Get team members
  router.get("/members", isAuthenticated, async (req, res) => {
    try {
      const teamResult = await pool.query(
        `SELECT t.id FROM teams t
         JOIN team_members tm ON t.id = tm.team_id
         WHERE tm.user_id = $1`,
        [req.user.username],
      );
      if (teamResult.rows.length === 0) {
        return res.json([]);
      }
      const teamId = teamResult.rows[0].id;
      const members = await pool.query(
        `SELECT user_id, joined_at FROM team_members WHERE team_id = $1`,
        [teamId],
      );
      res.json(members.rows);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  // Create a new team
  router.post("/create", isAuthenticated, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name)
        return res.status(400).json({ message: "Team name is required" });

      // Check if user already in a team
      const existing = await pool.query(
        `SELECT t.id FROM teams t
         JOIN team_members tm ON t.id = tm.team_id
         WHERE tm.user_id = $1`,
        [req.user.username],
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: "You are already in a team" });
      }

      // Generate unique 6-character invite code
      const invite_code = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

      const team = await pool.query(
        `INSERT INTO teams (name, admin_id, invite_code)
         VALUES ($1, $2, $3) RETURNING *`,
        [name, req.user.username, invite_code],
      );

      // Add creator as first member
      await pool.query(
        `INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)`,
        [team.rows[0].id, req.user.username],
      );

      res.json(team.rows[0]);
    } catch (error) {
      console.error("Create team error:", error.message);
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  // Join a team with invite code
  router.post("/join", isAuthenticated, async (req, res) => {
    try {
      const { invite_code } = req.body;
      if (!invite_code)
        return res.status(400).json({ message: "Invite code is required" });

      // Check if user already in a team
      const existing = await pool.query(
        `SELECT t.id FROM teams t
         JOIN team_members tm ON t.id = tm.team_id
         WHERE tm.user_id = $1`,
        [req.user.username],
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: "You are already in a team" });
      }

      // Find team by invite code
      const team = await pool.query(
        `SELECT * FROM teams WHERE UPPER(invite_code) = UPPER($1)`,
        [invite_code],
      );
      if (team.rows.length === 0) {
        return res.status(404).json({ message: "Invalid invite code" });
      }

      // Add user to team
      await pool.query(
        `INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)`,
        [team.rows[0].id, req.user.username],
      );

      res.json(team.rows[0]);
    } catch (error) {
      console.error("Join team error:", error.message);
      res.status(500).json({ message: "Failed to join team" });
    }
  });

  return router;
};
