import { useEffect, useState } from "react";

interface User {
  name: string;
  email: string;
  picture: string;
}

export const Login = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/me", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleLogin = () => {
    window.location.href = "http://localhost:8000/auth/google";
  };

  const handleLogout = () => {
    fetch("http://localhost:8000/auth/logout", {
      method: "POST",
      credentials: "include",
    }).then(() => setUser(null));
  };

  return (
    <div style={{ textAlign: "center", marginTop: 50 }}>
      {user?.picture && (
        <img
          src={user.picture}
          alt="profile"
          style={{ borderRadius: "50%", width: 100, height: 100 }}
        />
      )}
      <h2>{user ? `Welcome, ${user.name}` : "not logged in"}</h2>

      {user ? (
        <button onClick={handleLogout} style={{ marginTop: 20 }}>
          Logout
        </button>
      ) : (
        <button onClick={handleLogin} style={{ marginTop: 20 }}>
          Login with Google
        </button>
      )}
    </div>
  );
};