const express = require("express");
const mongoose = require("mongoose");
const ShortUrl = require("./model/shortUrls");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("trust proxy", true);

// MongoDB Connection
mongoose
  .connect(`${process.env.DATABASE_URL}`)
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error("Could not connect to MongoDB...", err));

// Routes
// 1. Home page route
app.get("/", async (req, res) => {
  try {
    const userIP = req.ip;
    const shortUrls = await ShortUrl.find({ userIp: userIP }).sort({
      createdAt: -1,
    });
    console.log("Found URLs:", shortUrls);
    console.log("User IP:", userIP);
    res.render("../views/index", { shortUrls: shortUrls, userIP: userIP });
  } catch (error) {
    console.error("Error fetching URLs:", error);
    res.render("../views/index", { shortUrls: [], userIP: null });
  }
});

// 2. Create short URL route
app.post("/shortUrls", async (req, res) => {
  const { fullUrl } = req.body;
  const userIP = req.ip;
  try {
    console.log("Received full URL:", fullUrl);
    await ShortUrl.create({ full: fullUrl, userIp: userIP });
    res.status(200).redirect("/");
  } catch (error) {
    console.error("Error creating short URL:", error);
    res.status(500).send("Internal Server Error");
  }
});

// 3. Delete single URL route
app.get("/delete/:shortUrl", async (req, res) => {
  try {
    await ShortUrl.findOneAndDelete({ shortUrl: req.params.shortUrl });
    console.log("Deleted URL:", req.params.shortUrl);
    res.redirect("/");
  } catch (error) {
    console.error("Error deleting URL:", error);
    res.status(500).send("Error deleting URL");
  }
});

// 4. Delete all URLs route
app.get("/delete-all", async (req, res) => {
  try {
    await ShortUrl.deleteMany({});
    console.log("All records deleted");
    res.redirect("/");
  } catch (error) {
    console.error("Error deleting records:", error);
    res.status(500).send("Error deleting records");
  }
});

// 5. Get user IP route
app.get("/userIp", (req, res) => {
  const userIP = req.ip;
  res.send(`Your IP address is ${userIP}`);
});

// 6. Redirect route
app.get("/:shortUrl", async (req, res) => {
  try {
    const shortUrl = await ShortUrl.findOne({ shortUrl: req.params.shortUrl });
    if (shortUrl == null) return res.sendStatus(404);
    shortUrl.clicks++;
    await shortUrl.save();
    res.redirect(shortUrl.full);
  } catch (error) {
    console.error("Error redirecting:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});