const express = require("express");
const path = require("path");

const app = express();

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/members/profile", (req, res) => {
  res.render("profile");
});

app.get("/members", (req, res) => {
  res.render("members");
});

app.get("/members/myTeam", (req, res) => {
  res.render("my-team");
});

app.get("/members/:id/invitations", (req, res) => {
  res.render("invitations");
});

app.get("/sign-in", (req, res) => {
  res.render("sign-in");
});

app.get("/sign-up", (req, res) => {
  res.render("sign-up");
});

app.get("/teams", async (req, res) => {
  // get teams array
  res.render("teams");
});

app.get("/create-team", (req, res) => {
  res.render("create-team");
});

app.get("/admin", (req, res) => {
  res.render("admin-profile");
});

app.get("/dashboard", (req, res) => {
  res.render("admin-dashboard");
});
app.listen(4000, () => {});
