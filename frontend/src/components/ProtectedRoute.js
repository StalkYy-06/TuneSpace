import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config/api";

export default function ProtectedRoute({ children }) {
    const [status, setStatus] = useState("loading");

    useEffect(() => {
        axios
            .get(`${API_URL}/api/auth/me`, { withCredentials: true })
            .then((res) => setStatus(res.data.success ? "authed" : "guest"))
            .catch(() => setStatus("guest"));
    }, []);

    if (status === "loading") {
        return (
            <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
                Loading...
            </div>
        );
    }

    if (status === "guest") {
        return <Navigate to="/login" replace />;
    }

    return children;
}
