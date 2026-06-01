import React, { useEffect, useState } from "react";
import useWebSocket from "../hooks/useWebSocket";
import Metrics from "./Metrics";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});
interface PR {
  id: number;
  github_pr_url: string;
  title: string;
  status: string;
  created_at: string;
}

// function Dashboard({ user }: { user: any }) {
function Dashboard({ user, team }: { user: any; team: any }) {
  const [submittedPRs, setSubmittedPRs] = useState<PR[]>([]);
  const [assignedPRs, setAssignedPRs] = useState<PR[]>([]);
  const [activeTab, setActiveTab] = useState<"submitted" | "assigned">(
    "submitted",
  );
  const [prUrl, setPrUrl] = useState("");
  const [reviewerId, setReviewerId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [notification, setNotification] = useState("");
  const [showMetrics, setShowMetrics] = useState(false);
  const [search, setSearch] = useState("");

  useWebSocket(user.username, (data) => {
    setNotification(data.message);
    fetchPRs();
    setTimeout(() => setNotification(""), 5000);
  });
  useEffect(() => {
    fetchPRs();
  }, []);

  const fetchPRs = async () => {
    const [submitted, assigned] = await Promise.all([
      fetch(`${process.env.REACT_APP_API_URL}/prs/submitted`, {
        headers: getHeaders(),
      }).then((r) => r.json()),
      fetch(`${process.env.REACT_APP_API_URL}/prs/assigned`, {
        headers: getHeaders(),
      }).then((r) => r.json()),
    ]);
    setSubmittedPRs(Array.isArray(submitted) ? submitted : []);
    setAssignedPRs(Array.isArray(assigned) ? assigned : []);
  };

  const submitPR = async () => {
    if (!prUrl || !reviewerId) {
      setMessage("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    // try {
    //   const res = await fetch(`${process.env.REACT_APP_API_URL}/prs/submit`, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       Authorization: `Bearer ${localStorage.getItem("token")}`,
    //     },
    //     body: JSON.stringify({ github_pr_url: prUrl, reviewer_id: reviewerId }),
    //   });
    //   const data = await res.json();
    //   if (data.id) {
    //     setMessage("PR submitted successfully!");
    //     setPrUrl("");
    //     setReviewerId("");
    //     fetchPRs();
    //   } else {
    //     setMessage("Failed to submit PR");
    //   }
    // } catch {
    //   setMessage(data.message || "Failed to submit PR");
    // }
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/prs/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ github_pr_url: prUrl, reviewer_id: reviewerId }),
      });
      const data = await res.json();
      if (data.id) {
        setMessage("PR submitted successfully!");
        setPrUrl("");
        setReviewerId("");
        fetchPRs();
      } else {
        setMessage(data.message || "Failed to submit PR");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`${process.env.REACT_APP_API_URL}/prs/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ status }),
    });
    fetchPRs();
  };

  const statusColor: { [key: string]: string } = {
    pending: "#e3b341",
    "in-review": "#388bfd",
    approved: "#3fb950",
    "changes-requested": "#f85149",
  };
  if (showMetrics)
    return <Metrics user={user} onBack={() => setShowMetrics(false)} />;
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.logo}>DevCollab</h1>
        <div style={styles.teamInfo}>
          <span style={styles.teamName}>{team.name}</span>
          <span style={styles.inviteCode}>Invite: {team.invite_code}</span>
        </div>
        <div style={styles.userInfo}>
          <img src={user.avatar_url} alt="avatar" style={styles.avatar} />
          <span style={styles.username}>{user.username}</span>
          <a
            href="/login"
            style={styles.logout}
            onClick={() => localStorage.removeItem("token")}
          >
            Logout
          </a>
          <button
            style={styles.metricsBtn}
            onClick={() => setShowMetrics(true)}
          >
            📊 Team Metrics
          </button>
        </div>
      </div>
      {notification && <div style={styles.notification}>🔔 {notification}</div>}

      {/* Submit PR form */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Submit PR for Review</h2>
        <input
          style={styles.input}
          placeholder="GitHub PR URL (e.g. https://github.com/owner/repo/pull/1)"
          value={prUrl}
          onChange={(e) => setPrUrl(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="Reviewer GitHub ID"
          value={reviewerId}
          onChange={(e) => setReviewerId(e.target.value)}
        />
        <button style={styles.button} onClick={submitPR} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit for Review"}
        </button>
        {message && <p style={styles.message}>{message}</p>}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "submitted" ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab("submitted")}
        >
          Submitted ({submittedPRs.length})
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "assigned" ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab("assigned")}
        >
          Assigned to Me ({assignedPRs.length})
        </button>
      </div>
      <input
        style={styles.searchInput}
        placeholder="🔍 Search PRs by title..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* PR List */}
      <div style={styles.prList}>
        {(activeTab === "submitted" ? submittedPRs : assignedPRs).length ===
        0 ? (
          <div style={styles.empty}>No PRs here yet.</div>
        ) : (
          (activeTab === "submitted" ? submittedPRs : assignedPRs)
            .filter(
              (pr) =>
                pr.title?.toLowerCase().includes(search.toLowerCase()) ||
                pr.github_pr_url.toLowerCase().includes(search.toLowerCase()),
            )
            .map((pr) => (
              <div key={pr.id} style={styles.prCard}>
                <div style={styles.prInfo}>
                  <a
                    href={pr.github_pr_url}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.prTitle}
                  >
                    {pr.title || pr.github_pr_url}
                  </a>
                  <span
                    style={{
                      ...styles.status,
                      background: statusColor[pr.status],
                    }}
                  >
                    {pr.status}
                  </span>
                </div>
                {activeTab === "assigned" && (
                  <div style={styles.actions}>
                    <button
                      style={styles.actionBtn}
                      onClick={() => updateStatus(pr.id, "in-review")}
                    >
                      In Review
                    </button>
                    <button
                      style={styles.actionBtn}
                      onClick={() => updateStatus(pr.id, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      style={styles.actionBtn}
                      onClick={() => updateStatus(pr.id, "changes-requested")}
                    >
                      Request Changes
                    </button>
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0d1117",
    color: "#c9d1d9",
    fontFamily: "sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    borderBottom: "1px solid #30363d",
  },
  logo: { color: "#ffffff", fontSize: "20px", margin: 0 },
  userInfo: { display: "flex", alignItems: "center", gap: "12px" },
  avatar: { width: "32px", height: "32px", borderRadius: "50%" },
  username: { color: "#c9d1d9", fontSize: "14px" },
  logout: { color: "#f85149", fontSize: "14px", textDecoration: "none" },
  card: {
    margin: "24px 32px",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "8px",
    padding: "24px",
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: "16px",
    marginBottom: "16px",
    marginTop: 0,
  },
  input: {
    display: "block",
    width: "100%",
    padding: "8px 12px",
    marginBottom: "12px",
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: "6px",
    color: "#c9d1d9",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  button: {
    backgroundColor: "#238636",
    color: "#ffffff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  message: { color: "#3fb950", fontSize: "13px", marginTop: "8px" },
  tabs: {
    display: "flex",
    gap: "0",
    margin: "0 32px",
    borderBottom: "1px solid #30363d",
  },
  tab: {
    padding: "10px 20px",
    background: "none",
    border: "none",
    color: "#8b949e",
    cursor: "pointer",
    fontSize: "14px",
  },
  activeTab: { color: "#ffffff", borderBottom: "2px solid #238636" },
  prList: { margin: "16px 32px" },
  empty: { color: "#8b949e", textAlign: "center", padding: "40px" },
  prCard: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "12px",
  },
  prInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  prTitle: { color: "#58a6ff", fontSize: "14px", textDecoration: "none" },
  status: {
    fontSize: "12px",
    padding: "2px 8px",
    borderRadius: "20px",
    color: "#000000",
    fontWeight: "500",
  },
  actions: { display: "flex", gap: "8px", marginTop: "12px" },
  actionBtn: {
    background: "#21262d",
    color: "#c9d1d9",
    border: "1px solid #30363d",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  notification: {
    background: "#1f6feb",
    color: "#ffffff",
    padding: "12px 32px",
    fontSize: "14px",
  },
  metricsBtn: {
    background: "#21262d",
    color: "#c9d1d9",
    border: "1px solid #30363d",
    padding: "6px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
  },
  searchInput: {
    display: "block",
    width: "calc(100% - 64px)",
    margin: "16px 32px 8px 32px",
    padding: "8px 12px",
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: "6px",
    color: "#c9d1d9",
    fontSize: "14px",
  },
  teamInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  teamName: { color: "#ffffff", fontSize: "13px", fontWeight: "500" },
  inviteCode: { color: "#3fb950", fontSize: "11px", letterSpacing: "1px" },
};

export default Dashboard;
