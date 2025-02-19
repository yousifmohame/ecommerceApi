const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bcrypt = require("bcrypt"); // For hashing passwords
const app = express();

app.use(cors());
app.use(express.json());

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ym8999109@gmail.com", // Replace with your Gmail address
    pass: "jjolkubvjmoxzcrh", // Replace with your Gmail app password
  },
});

// In-memory storage for verification codes
const verificationCodes = new Map(); // Stores email -> { code, expiry }

// Mock database for users (replace with a real database in production)
const users = new Map(); // Stores email -> { password }

// Generate a random 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// API endpoint to send verification code
app.post("/send-verification-code", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  const verificationCode = generateVerificationCode();
  const expiry = Date.now() + 10 * 60 * 1000; // Code expires in 10 minutes

  // Store the code and expiry time
  verificationCodes.set(email, { code: verificationCode, expiry });

  const mailOptions = {
    from: "ym8999109@gmail.com", // Replace with your Gmail address
    to: email,
    subject: "Your Verification Code",
    text: `Your verification code is: ${verificationCode}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to send verification code" });
    }

    console.log("Verification code sent:", verificationCode);
    res
      .status(200)
      .json({ success: true, message: "Verification code sent successfully" });
  });
});

// API endpoint to verify the code
app.post("/verify-code", (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res
      .status(400)
      .json({ success: false, message: "Email and code are required" });
  }

  const storedData = verificationCodes.get(email);

  if (!storedData) {
    return res.status(400).json({
      success: false,
      message: "No verification code found for this email",
    });
  }

  const { code: storedCode, expiry } = storedData;

  // Check if the code has expired
  if (Date.now() > expiry) {
    verificationCodes.delete(email); // Remove expired code
    return res
      .status(400)
      .json({ success: false, message: "Verification code has expired" });
  }

  // Compare the codes
  if (code === storedCode) {
    verificationCodes.delete(email); // Remove the code after successful verification
    return res
      .status(200)
      .json({ success: true, message: "Verification successful" });
  } else {
    return res
      .status(400)
      .json({ success: false, message: "Invalid verification code" });
  }
});

// API endpoint to reset password
app.post("/reset-password", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required" });
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds: 10

  // Update the user's password in the database
  users.set(email, { password: hashedPassword });

  res
    .status(200)
    .json({ success: true, message: "Password reset successfully" });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
