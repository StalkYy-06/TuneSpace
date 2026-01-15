import React, { useState } from "react";

import UserIcon from "../icons/user.png";
import EmailIcon from "../icons/mail.png";
import LockIcon from "../icons/lock.png";
import EyeIcon from "../icons/v_on.png";
import EyeOffIcon from "../icons/v_off.png";

export default function InputField({ label, type, value, onChange, error }) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    const togglePassword = () => setShowPassword(!showPassword);

    let Icon;
    if (label.includes("Username")) Icon = UserIcon;
    else if (label.includes("Email")) Icon = EmailIcon;
    else Icon = LockIcon;

    return (
        <div className="input-wrapper">
            <div className={`input-container ${error ? "error" : ""}`}>
                <span className="input-icon">
                    <img src={Icon} alt="" />
                </span>
                <input
                    type={isPassword && showPassword ? "text" : type}
                    placeholder={label}
                    value={value}
                    onChange={onChange}
                />
                {isPassword && (
                    <button
                        type="button"
                        className="toggle-password"
                        onClick={togglePassword}
                        tabIndex="-1"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        <img src={showPassword ? EyeOffIcon : EyeIcon} alt="" />
                    </button>
                )}
            </div>
            {error && <div className="error-msg">{error}</div>}
        </div>
    );
}