import React from "react";

function Login() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>DevCollab</h1>
        <p style={styles.subtitle}>Code review tracking for developer teams</p>
        <a href="http://localhost:5000/auth/github" style={styles.button}>
          Login with GitHub
        </a>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#0d1117",
  },
  card: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "12px",
    padding: "48px",
    textAlign: "center",
    width: "360px",
  },
  title: {
    color: "#ffffff",
    fontSize: "28px",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#8b949e",
    fontSize: "14px",
    marginBottom: "32px",
  },
  button: {
    display: "inline-block",
    backgroundColor: "#238636",
    color: "#ffffff",
    padding: "12px 24px",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
  },
};

export default Login;
