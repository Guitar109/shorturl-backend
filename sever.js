const express = require("express");
const mongoose = require("mongoose");
const ShortUrl = require("./model/shortUrls");
const cors = require('cors'); 
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


mongoose.connect(`${process.env.DATABASE_URL}`)
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

app.set("view engine", "ejs");
app.set("trust proxy", true);

// 1. Route แสดงหน้าหลัก
app.get("/", async (req, res) => {
  try {
    const shortUrls = await ShortUrl.find().sort({ createdAt: -1 });
    console.log("Found URLs:", shortUrls);
    res.render("../views/index", { shortUrls: shortUrls });
  } catch (error) {
    console.error("Error fetching URLs:", error);
    res.render("../view/index", { shortUrls: [] });
  }
});

// 2. Route สำหรับสร้าง short URL
app.post("/shortUrls", async (req, res) => {
  const { fullUrl } = req.body;
  try {
    console.log("Received full URL:", fullUrl);
    await ShortUrl.create({ full: fullUrl });
    res.status(200).redirect("/");
  } catch (error) {
    console.error("Error creating short URL:", error);
    res.status(500).send("Internal Server Error");
  }
});

//3. route สำหรับลบข้อมูลเเยก
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

// 3. Route สำหรับลบข้อมูลทั้งหมด
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

// 4. Route สำหรับรับ IP
app.get("/userIp", (req, res) => {
  const userIP = req.ip;
  res.send(`Your IP address is ${userIP}`);
});

// 5. Route สำหรับ redirect 
app.get('/:shortUrl', async (req, res) => {
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

//start severที่Port 5000
app.listen(process.env.PORT || 5000);