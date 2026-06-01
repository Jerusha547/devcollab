// import React, { useEffect, useState } from "react";
// import {
//   BrowserRouter,
//   Routes,
//   Route,
//   Navigate,
//   useLocation,
// } from "react-router-dom";
// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";

// function AppRoutes() {
//   const [user, setUser] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const location = useLocation();

//   useEffect(() => {
//     // Check for token in URL after GitHub redirect
//     const params = new URLSearchParams(location.search);
//     const token = params.get("token");
//     if (token) {
//       localStorage.setItem("token", token);
//       window.history.replaceState({}, "", "/dashboard");
//     }

//     const storedToken = token || localStorage.getItem("token");
//     if (!storedToken) {
//       setLoading(false);
//       return;
//     }

//     fetch(`${process.env.REACT_APP_API_URL}/auth/me`, {
//       headers: { Authorization: `Bearer ${storedToken}` },
//     })
//       .then((res) => res.json())
//       .then((data) => {
//         if (data.github_id) setUser(data);
//         else localStorage.removeItem("token");
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   }, [location.search]);

//   if (loading)
//     return (
//       <div
//         style={{
//           color: "white",
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           height: "100vh",
//         }}
//       >
//         Loading...
//       </div>
//     );

//   return (
//     <Routes>
//       <Route
//         path="/login"
//         element={!user ? <Login /> : <Navigate to="/dashboard" />}
//       />
//       <Route
//         path="/dashboard"
//         element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
//       />
//       <Route
//         path="*"
//         element={<Navigate to={user ? "/dashboard" : "/login"} />}
//       />
//     </Routes>
//   );
// }

// function App() {
//   return (
//     <BrowserRouter>
//       <AppRoutes />
//     </BrowserRouter>
//   );
// }

// export default App;

import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TeamSetup from "./pages/TeamSetup";

function AppRoutes() {
  const [user, setUser] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      window.history.replaceState({}, "", "/dashboard");
    }

    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) {
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${storedToken}` };

    fetch(`${process.env.REACT_APP_API_URL}/auth/me`, { headers })
      .then((r) => r.json())
      .then(async (data) => {
        if (data.github_id) {
          setUser(data);
          // Check if user has a team
          const teamRes = await fetch(
            `${process.env.REACT_APP_API_URL}/teams/mine`,
            { headers },
          );
          const teamData = await teamRes.json();
          setTeam(teamData);
        } else {
          localStorage.removeItem("token");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading)
    return (
      <div
        style={{
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#0d1117",
        }}
      >
        Loading...
      </div>
    );

  return (
    <Routes>
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/dashboard" />}
      />
      <Route
        path="/dashboard"
        element={
          !user ? (
            <Navigate to="/login" />
          ) : !team ? (
            <TeamSetup user={user} onTeamJoined={(t) => setTeam(t)} />
          ) : (
            <Dashboard user={user} team={team} />
          )
        }
      />
      <Route
        path="*"
        element={<Navigate to={user ? "/dashboard" : "/login"} />}
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
