const express = require("express");

const path = require("path");

const bodyParser = require("body-parser");

const {check, validationResult} = require('express-validator')

const app = express();

app.set("view engine", "ejs");

const urlencodedParser = bodyParser.urlencoded({extended:false})

app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("home");
});

app.post('/', urlencodedParser, [

check(('full-name', 'email', 'password', 'confirm-password'), 'Please fill the remaining values')
  .exists()
  .notEmpty(),

check('email', 'Email is not valid')
.isEmail()
.normalizeEmail(),

check('password', 'Password must be 8 charatcters long at least')

.isLength({min:8}),


check('password', 'Password must have 1 capital letter at least')
.matches(/[A-Z]/),

// check('confirm-password', 'Passwords are not equal')
// .matches('password')




], (req, res)=>{


const errors = validationResult(req)

const PassWord = req.body['password'];

const ConfirmPassword = req.body['confirm-password']


if(!errors.isEmpty() || PassWord != ConfirmPassword){

  const alert = errors.array()

  res.render('sign-up',{alert})

}





else{

  res.render('home')
}

})

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
