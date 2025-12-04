import React from "react";

export default function InputField({ label, type, value, onChange, error }) {
    return (
        <div style={{ width: "100%", marginBottom: "10px" }}>
            <input
                type={type}
                placeholder={label}
                value={value}
                onChange={onChange}
                className={error ? "error" : ""}
            />
            {error && <div className="error-msg">{error}</div>}
        </div>
    );
}
