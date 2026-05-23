import React, { useEffect, useState } from "react";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});
interface StatusCount {
  status: string;
  count: string;
}

interface ReviewerLoad {
  reviewer_id: string;
  assigned: string;
  completed: string;
}

interface MetricsData {
  total: number;
  byStatus: StatusCount[];
  avgTurnaroundHours: number;
  reviewLoad: ReviewerLoad[];
}

function Metrics({ user, onBack }: { user: any; onBack: () => void }) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/prs/submitted`, {
      headers: getHeaders(),
    })
      .then((r) => r.json())
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statusColor: { [key: string]: string } = {
    pending: "#e3b341",
    "in-review": "#388bfd",
    approved: "#3fb950",
    "changes-requested": "#f85149",
  };

  if (loading) return <div style={styles.loading}>Loading metrics...</div>;
  if (!metrics)
    return <div style={styles.loading}>Failed to load metrics.</div>;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.logo}>DevCollab</h1>
        <div style={styles.userInfo}>
          <img src={user.avatar_url} alt="avatar" style={styles.avatar} />
          <span style={styles.username}>{user.username}</span>
          <button style={styles.backBtn} onClick={onBack}>
            ← Dashboard
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <h2 style={styles.pageTitle}>Team Metrics</h2>

        {/* Summary cards */}
        <div style={styles.cardRow}>
          <div style={styles.metricCard}>
            <div style={styles.metricValue}>{metrics.total}</div>
            <div style={styles.metricLabel}>Total PRs Involved</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricValue}>
              {metrics.byStatus.find((s) => s.status === "pending")?.count || 0}
            </div>
            <div style={styles.metricLabel}>Pending Reviews</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricValue}>
              {metrics.byStatus.find((s) => s.status === "approved")?.count ||
                0}
            </div>
            <div style={styles.metricLabel}>Approved PRs</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricValue}>{metrics.avgTurnaroundHours}h</div>
            <div style={styles.metricLabel}>Avg Review Time</div>
          </div>
        </div>

        {/* Status breakdown */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Status Breakdown</h3>
          <div style={styles.statusGrid}>
            {metrics.byStatus.map((s) => (
              <div key={s.status} style={styles.statusCard}>
                <div
                  style={{
                    ...styles.statusDot,
                    background: statusColor[s.status],
                  }}
                />
                <div style={styles.statusName}>{s.status}</div>
                <div style={styles.statusCount}>{s.count}</div>
                <div style={styles.statusBar}>
                  <div
                    style={{
                      ...styles.statusBarFill,
                      width: `${Math.min((parseInt(s.count) / metrics.total) * 100, 100)}%`,
                      background: statusColor[s.status],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Review load table */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Reviewer Load</h3>
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>Reviewer</span>
              <span>Assigned</span>
              <span>Completed</span>
              <span>Completion Rate</span>
            </div>
            {metrics.reviewLoad.map((r) => {
              const rate = Math.round(
                (parseInt(r.completed) / parseInt(r.assigned)) * 100,
              );
              return (
                <div key={r.reviewer_id} style={styles.tableRow}>
                  <span style={styles.reviewerName}>@{r.reviewer_id}</span>
                  <span style={styles.tableCell}>{r.assigned}</span>
                  <span style={styles.tableCell}>{r.completed}</span>
                  <span style={styles.tableCell}>
                    <div style={styles.rateBar}>
                      <div
                        style={{
                          ...styles.rateBarFill,
                          width: `${rate}%`,
                          background:
                            rate >= 70
                              ? "#3fb950"
                              : rate >= 40
                                ? "#e3b341"
                                : "#f85149",
                        }}
                      />
                    </div>
                    <span style={styles.rateText}>{rate}%</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
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
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    color: "#8b949e",
    backgroundColor: "#0d1117",
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
  backBtn: {
    background: "#21262d",
    color: "#c9d1d9",
    border: "1px solid #30363d",
    padding: "6px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
  },
  content: { padding: "24px 32px" },
  pageTitle: { color: "#ffffff", fontSize: "20px", marginBottom: "24px" },
  cardRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "32px",
  },
  metricCard: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "8px",
    padding: "20px",
    textAlign: "center",
  },
  metricValue: {
    fontSize: "32px",
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: "4px",
  },
  metricLabel: { fontSize: "12px", color: "#8b949e" },
  section: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "20px",
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: "14px",
    marginTop: 0,
    marginBottom: "16px",
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
  },
  statusCard: {
    background: "#0d1117",
    borderRadius: "6px",
    padding: "12px 16px",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    display: "inline-block",
    marginRight: "8px",
  },
  statusName: {
    fontSize: "13px",
    color: "#c9d1d9",
    marginBottom: "4px",
    display: "inline",
  },
  statusCount: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#ffffff",
    marginTop: "8px",
    marginBottom: "8px",
  },
  statusBar: {
    height: "4px",
    background: "#30363d",
    borderRadius: "2px",
    overflow: "hidden",
  },
  statusBarFill: { height: "100%", borderRadius: "2px" },
  table: { display: "flex", flexDirection: "column", gap: "8px" },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 2fr",
    gap: "12px",
    padding: "8px 12px",
    fontSize: "12px",
    color: "#8b949e",
    borderBottom: "1px solid #30363d",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 2fr",
    gap: "12px",
    padding: "10px 12px",
    background: "#0d1117",
    borderRadius: "6px",
    alignItems: "center",
  },
  reviewerName: { color: "#58a6ff", fontSize: "13px" },
  tableCell: {
    fontSize: "13px",
    color: "#c9d1d9",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  rateBar: {
    flex: 1,
    height: "6px",
    background: "#30363d",
    borderRadius: "3px",
    overflow: "hidden",
  },
  rateBarFill: { height: "100%", borderRadius: "3px" },
  rateText: { fontSize: "12px", color: "#8b949e", minWidth: "32px" },
};

export default Metrics;
