const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const userModel = require("../models/user.models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config(); // Ensure dotenv is used for environment variables

router.get("/register", (req, res) => {
  res.render("register");
});

router.post(
  "/register",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Invalid email format")
      .isLength({ min: 10 }),
    body("password")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Password must be at least 5 characters long"),
    body("username")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Username must be at least 5 characters long")
      .matches(/^[a-zA-Z0-9]+$/)
      .withMessage("Username must contain only letters and numbers"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ errors: errors.array(), message: "Invalid data" });
    }

    try {
      const { username, email, password } = req.body;

      // ✅ Check if username already exists
      const existingUser = await userModel.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // ✅ Check if email already exists
      const existingEmail = await userModel.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // ✅ Hash the password before saving
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // ✅ Create a new user with the hashed password
      const newUser = await userModel.create({
        username,
        email,
        password: hashedPassword, // Store hashed password
      });

      console.log(req.body);
      return res.status(201).json({
        message: "User registered successfully",
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email, // Excluding password from response
        },
      });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Server error", error: err.message });
    }
  }
);

router.get("/login", (req, res) => {
  res.render("login");
});

router.post(
  "/login",
  [
    body("username")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),
    body("password")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Password must be at least 5 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ errors: errors.array(), message: "Invalid data" });
    }

    const { username, password } = req.body;

    try {
      const user = await userModel.findOne({ username });

      if (!user) {
        return res
          .status(400)
          .json({ message: "username and password is incorrect" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "username and password is incorrect" });
      }

      /* json web token */
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          username: user.username,
        },
        process.env.JWT_SECRET || "defaultSecret", // Ensure a default secret for development
        { expiresIn: "1h" } // Token expires in 1 hour
      );

      res.cookie("token", token);
      res.send("Login successful");
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Server error", error: err.message });
    }
  }
);

module.exports = router;
