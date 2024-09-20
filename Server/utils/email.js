// utils/emailService.js
const nodemailer = require("nodemailer");

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.NODEMAILER_HOST, // Gmail's SMTP server
  port: process.env.NODEMAILER_PORT, // Port for secure connections
  secure: true, // Use SSL/TLS for secure connection
  auth: {
    user: process.env.NODEMAILER_SENDING_EMAIL_FROM, // Your email address
    pass: process.env.NODEMAILER_SENDING_EMAIL_APPPASSWORD, // Your app password in gmail
    // pass: "B1bek K0ir@l@", // Your app password in gmail
  },
});

// Function to send a verification email
const sendVerificationEmail = async (email, token) => {
  console.log("Sending email to:", email, "with token:", token);

  const mailOptions = {
    from: process.env.NODEMAILER_SENDING_EMAIL_FROM, // email that we send from
    to: email,
    subject: "Email Verification",
    html: `<h1>Your verification token is: ${token}</h1>`, // Better representation
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Error sending email");
  }
};

// Function to send a reset password email
const sendResetPasswordEmail = async (email, token) => {
  console.log("Sending reset password email to:", email, "with token:", token);

  const mailOptions = {
    from: "www.culturalarcher2058@gmail.com",
    to: email,
    subject: "Reset Your Password",
    html: `<p>You requested to reset your password. Use the following token to reset it:</p>
           <h1>${token}</h1>
           <a href="http://localhost:5173/auth/reset-password/${token}">Click here to reset</a>
           <p>This token is valid for 1 hour.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Reset password email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Error sending reset password email");
  }
};

module.exports = { sendVerificationEmail, sendResetPasswordEmail };
