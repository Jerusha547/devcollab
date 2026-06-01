import React, { useState } from "react";

function TeamSetup({
  user,
  onTeamJoined,
}: {
  user: any;
  onTeamJoined: (team: any) => void;
}) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const createTeam = async () => {
    if (!teamName.trim()) {
      setError("Please enter a team name");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/teams/create`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ name: teamName }),
      });
      const data = await res.json();
      if (data.id) onTeamJoined(data);
      else setError(data.message || "Failed to create team");
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  };

  const joinTeam = async () => {
    if (!inviteCode.trim()) {
      setError("Please enter an invite code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/teams/join`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ invite_code: inviteCode }),
      });
      const data = await res.json();
      if (data.id) onTeamJoined(data);
      else setError(data.message || "Invalid invite code");
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.avatar}>
          <img src={user.avatar_url} alt="avatar" style={styles.avatarImg} />
        </div>
        <h1 style={styles.title}>Welcome, {user.username}!</h1>
        <p style={styles.subtitle}>
          You need a team to use DevCollab. Create a new team or join an
          existing one.
        </p>

        {mode === "choose" && (
          <div style={styles.btnGroup}>
            <button style={styles.primaryBtn} onClick={() => setMode("create")}>
              Create a new team
            </button>
            <button style={styles.secondaryBtn} onClick={() => setMode("join")}>
              Join with invite code
            </button>
          </div>
        )}

        {mode === "create" && (
          <div style={styles.form}>
            <input
              style={styles.input}
              placeholder="Team name (e.g. Frontend Squad)"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createTeam()}
            />
            {error && <p style={styles.error}>{error}</p>}
            <button
              style={styles.primaryBtn}
              onClick={createTeam}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Team"}
            </button>
            <button
              style={styles.linkBtn}
              onClick={() => {
                setMode("choose");
                setError("");
              }}
            >
              ← Back
            </button>
          </div>
        )}

        {mode === "join" && (
          <div style={styles.form}>
            <input
              style={styles.input}
              placeholder="Enter 6-character invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && joinTeam()}
              maxLength={6}
            />
            {error && <p style={styles.error}>{error}</p>}
            <button
              style={styles.primaryBtn}
              onClick={joinTeam}
              disabled={loading}
            >
              {loading ? "Joining..." : "Join Team"}
            </button>
            <button
              style={styles.linkBtn}
              onClick={() => {
                setMode("choose");
                setError("");
              }}
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#0d1117",
    fontFamily: "sans-serif",
  },
  card: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "12px",
    padding: "40px",
    width: "400px",
    textAlign: "center",
  },
  avatar: { marginBottom: "16px" },
  avatarImg: { width: "56px", height: "56px", borderRadius: "50%" },
  title: { color: "#ffffff", fontSize: "20px", margin: "0 0 8px" },
  subtitle: {
    color: "#8b949e",
    fontSize: "13px",
    lineHeight: "1.6",
    margin: "0 0 28px",
  },
  btnGroup: { display: "flex", flexDirection: "column", gap: "12px" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: {
    padding: "10px 12px",
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: "6px",
    color: "#c9d1d9",
    fontSize: "14px",
    textAlign: "center",
    letterSpacing: "2px",
  },
  primaryBtn: {
    backgroundColor: "#238636",
    color: "#ffffff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  secondaryBtn: {
    backgroundColor: "#21262d",
    color: "#c9d1d9",
    border: "1px solid #30363d",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#8b949e",
    cursor: "pointer",
    fontSize: "13px",
  },
  error: { color: "#f85149", fontSize: "13px", margin: "0" },
};

export default TeamSetup;
