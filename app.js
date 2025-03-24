const express = require("express");
const app = express();
const dotenv = require("dotenv");
const userRouter = require("./routes/user.routes");
dotenv.config();
const connectDB = require("./config/db");
connectDB();
const cookieParser = require("cookie-parser");
const indexRouter = require("./routes/index.routes");
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", indexRouter);

app.use("/user", userRouter);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
