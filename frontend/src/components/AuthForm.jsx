import { useState } from "react";
import api from "../api";
import { useAuth } from "../state/AuthContext";

const AuthForm = () => {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/signup";
      const payload = mode === "login" ? { email: formData.email, password: formData.password } : formData;
      const { data } = await api.post(endpoint, payload);
      login(data.token, data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
    }
  };

  return (
    <div className="card auth-card">
      <h2>{mode === "login" ? "Login" : "Sign Up"}</h2>
      <form onSubmit={onSubmit}>
        {mode === "signup" && (
          <input
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          />
        )}
        <input
          placeholder="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
        />
        <input
          placeholder="Password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">{mode === "login" ? "Login" : "Create Account"}</button>
      </form>
      <button className="link-button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
        {mode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
      </button>
    </div>
  );
};

export default AuthForm;
