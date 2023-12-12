const express = require("express");
const path = require("path");

const app = express();

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/members/:id", (req, res) => {
  res.render("profile");
});

app.get("/members", (req, res) => {
  res.render("members");
});

app.get("/members/:id/team/:teamId", (req, res) => {
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

app.get("/teams", (req, res) => {
  res.render("teams");
});

app.get("/create-team", (req, res) => {
  res.render("create-team");
});

app.listen(5000, () => {});
