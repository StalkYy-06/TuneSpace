import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/form.css";
import InputField from "../components/InputField";

export default function Register() {
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [errors, setErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        try {
            await axios.post("http://localhost:5000/api/auth/register", form);
            alert("Registration Successful");
        } catch (err) {
            const { field, message } = err.response?.data || {};
            if (field && message) {
                setErrors(prev => ({ ...prev, [field]: message }));
            }
        }
    };

    return (
        <div className="form-container">
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <InputField
                    label="Username"
                    type="text"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    error={errors.username}
                />

                <InputField
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    error={errors.email}
                />

                <InputField
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    error={errors.password}
                />

                <InputField
                    label="Confirm Password"
                    type="password"
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    error={errors.confirmPassword}
                />
                <button type="submit">Register</button>
            </form>

            <p>
                Already have an account? <Link to="/"> Login here </Link>
            </p>
        </div>
    );
}
