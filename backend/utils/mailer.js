import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendLoginOTP = async (email, otp) => {
    const mailOptions = {
        from: `"TuneSpace" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your TuneSpace Login Code",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #6c5ce7;">Welcome back to TuneSpace!</h2>
        <p>Here is your one-time login code:</p>
        <h1 style="font-size: 32px; font-weight: bold; color: #6c5ce7; letter-spacing: 8px; text-align: center; margin: 30px 0;">
          ${otp}
        </h1>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <small style="color: #999;">© 2025 TuneSpace. All rights reserved.</small>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);
};

export const sendForgotPasswordOTP = async (email, otp) => {
    const mailOptions = {
        from: `"TuneSpace Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Reset Your TuneSpace Password",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e74c3c; border-radius: 10px;">
        <h2 style="color: #e74c3c;">Password Reset Request</h2>
        <p>We received a request to reset your TuneSpace password.</p>
        <p>Your verification code is:</p>
        <h1 style="font-size: 32px; font-weight: bold; color: #e74c3c; letter-spacing: 8px; text-align: center; margin: 30px 0;">
          ${otp}
        </h1>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p style="color: #e74c3c;"><strong>If you didn't request this, someone may be trying to access your account. Change your password immediately.</strong></p>
        <hr>
        <small style="color: #999;">© 2025 TuneSpace. All rights reserved.</small>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);
};