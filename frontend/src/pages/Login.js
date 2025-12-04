import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/form.css";
import InputField from "../components/InputField";

export default function Login() {
    const [form, setForm] = useState({ usernameOrEmail: "", password: "" });
    const [errors, setErrors] = useState({});

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setErrors({});
        try {
            await axios.post("http://localhost:5000/api/auth/login", form);
            alert("Login Successful");
        } catch (err) {
            const { field, message } = err.response.data;
            setErrors(prev => ({ ...prev, [field]: message }));
        }
    };

    return (
        <div className="form-container">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <InputField
                    label="Username or Email"
                    type="text"
                    value={form.usernameOrEmail}
                    onChange={e => setForm({ ...form, usernameOrEmail: e.target.value })}
                    error={errors.usernameOrEmail}
                />

                <InputField
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    error={errors.password}
                />
                <button type="submit">Login</button>
            </form>

            <p>
                Dont have an account? <Link to="/register"> Register here </Link>
            </p>
        </div>
    );
}
