const express = require("express");
const path = require("path");

const bodyParser = require("body-parser");
const pg = require("pg");
const crypto = require('crypto');

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
var currentEmail = null; 
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "teamup",
  password: "",
  port: 5433,
});
db.connect();
const adminEmail = "teamup@gmail.com";
const adminPassword = "qwer";
app.get("/home_logout", (req,res)=>{
    currentEmail = null;
    res.render("home", {currentUser: currentEmail});
});
app.get("/", (req, res) => {
  res.render("home", {currentUser: currentEmail});
});

app.get("/SWE363_Project_Group17/views/profile.ejs", async(req, res) => {
  try {
    const result = await db.query('SELECT * FROM student WHERE email = $1', [currentEmail]);
    const student = result.rows[0]; // This will be the student record
    res.render("profile", { student: student, currentUser: currentEmail });
} catch (error) {
    console.error('Database query error', error);
    res.status(500).send('An error occurred');
}

});

app.get("/members", async (req, res) => {

  try {
    const result = await db.query('SELECT * FROM Student WHERE team_id IS NULL');
    const students = result.rows; // Use the rows from the query result
    res.render("members", { students: students, currentUser: currentEmail });
} catch (error) {
    console.error('Database query error', error);
    res.status(500).send('An error occurred');
}
  
});
app.get("/create_team", (req,res) => {
  console.log(currentEmail);

  res.render("create-team", {currentUser : currentEmail});
});

app.get("/admin-profile", (req,res) => {
  res.render("admin-profile", { currentUser: currentEmail});
});

app.get("/admin-dashboard", async (req, res) => {
  try {
      // Query the total number of students
      const totalStudentsResult = await db.query('SELECT COUNT(*) AS total FROM student');
      const totalStudents = totalStudentsResult.rows[0].total;

      // Query the total number of students without a team
      const studentsNoTeamResult = await db.query('SELECT COUNT(*) AS total FROM student WHERE team_id IS NULL');
      const totalStudentsNoTeam = studentsNoTeamResult.rows[0].total;

      // Query the total number of teams
      const totalTeamsResult = await db.query('SELECT COUNT(*) AS total FROM team');
      const totalTeams = totalTeamsResult.rows[0].total;

      // Render the admin-dashboard page with the fetched data
      res.render('admin-dashboard', {
          totalStudents: totalStudents,
          total_no_students: totalStudentsNoTeam,
          totalTeams: totalTeams,
          currentUser:currentEmail
      });
  } catch (error) {
      console.error('Database query error', error);
      // Handle the error - render the admin-dashboard page with an error message
      res.render('admin-dashboard', {currentUser: currentEmail});
  }
});


app.get("/my-team", async (req, res) => {
  try {
      // Check if the user is part of a team
      const studentResult = await db.query('SELECT team_id FROM student WHERE email = $1', [currentEmail]);

      if (studentResult.rows.length === 0 || studentResult.rows[0].team_id === null) {
          // User is not part of a team or user not found
          return res.render("my-team", { error: "You are not part of a team." , currentUser: currentEmail});
      }
      let teamId = studentResult.rows[0].team_id;
      // Get team information
      const teamInfo = await db.query('SELECT * FROM team WHERE id = $1', [teamId]);
      console.log(teamInfo.rows[0]);

      // Get all requests received by the team
      const requests = await db.query('SELECT * FROM request WHERE teamid = $1', [teamId]);
      console.log(requests.rows);
      // Get all students from the same team
      const teamMembers = await db.query('SELECT name FROM student WHERE team_id = $1', [teamId]);
      console.log( teamMembers.rows);
      console.log(currentEmail);
      // Render the page with the team info, requests, and team members
      res.render("my-team", {
        team: teamInfo.rows[0],
        requests: requests.rows,
        names: teamMembers.rows,
        currentUser: currentEmail // Include currentUser in the data object
    });
  } catch (error) {
      console.error('Database query error', error);
      res.render("my-team", { error: "An error occurred while fetching team information.", currentUser: currentEmail });
  }
});


app.get("/sign-in", (req, res) => {

  res.render("sign-in");
});

app.get("/sign-up", (req, res) => {
  // Text send to encrypt function
  
  //var password = encrypt("Ali Alyami")
  //console.log(hw)
  //console.log(decrypt(hw))
  res.render("sign-up");
});

app.get("/teams", async (req, res) => {
    try {
    const result = await db.query('SELECT id,name, seats FROM team WHERE seats > 0 and seats < 5');
    const teams = result.rows; // Use the rows from the query result
    console.log(teams)
    res.render("teams", { teams: teams, currentUser: currentEmail });
} catch (error) {
    console.error('Database query error', error);
    res.status(500).send('An error occurred');
}
});

app.post("/registerUser", async (req, res) => {
  let { name, email, password, major } = req.body;
  console.log(req.body)

  if (!name || !email || !password || !major) {
      // Render sign-up page with error message
      res.render("sign-up", { error: "All fields are required" });
      return;
  }

  try {
      const emailCheck = await db.query('SELECT email FROM student WHERE email = $1', [email]);
      if (emailCheck.rows.length > 0) {
          // Render sign-up page with error message
          res.render("sign-up", { error: "Email already registered" });
          return;
      }

      const encryptedPassword = encrypt(password);
      await db.query(
        "INSERT INTO student (name, email,  password,major, team_id) VALUES ($1, $2, $3, $4, $5)",
        [name, email, JSON.stringify(encryptedPassword), major,null]
      );

      // Redirect to sign-in page on successful registration
      res.redirect("/sign-in");
  } catch (error) {
      console.error('Database query error', error);
      // Render sign-up page with error message
      res.render("sign-up", { error: "An error occurred during registration" });
  } 
});

app.post("/signIn", async (req, res) => {
  let { email, password } = req.body;

  try {
      if (email === adminEmail && password === adminPassword) {
          res.redirect('/admin-dashboard');
          return;
      }

      const result = await db.query('SELECT password FROM student WHERE email = $1', [email]);

      if (result.rows.length === 0) {
          //res.status(404).send('Email not found');
          res.render("sign-in", { error: "Email not found" });
      } else {
          const storedPassword = JSON.parse(result.rows[0].password);
          const decryptedPassword = decrypt(storedPassword);
          if (password === decryptedPassword) {
              currentEmail = email;
              console.log("success");
              res.redirect("/")
              //res.redirect("/signed-in");
          } else {
              //res.status(401).send('Password is incorrect');
              res.render("sign-in", { error: "Password is incorrect" });
          }
      }
  } catch (error) {
      console.error('Database query error', error);
      res.status(500).send('An error occurred');
  } 
});

app.post("/updateProfile", async (req, res) => {
  let name = req.body["name"];
  let email = req.body["email"];
  console.log(req.body);

  try {
    // Check if any of the fields are empty
    if (!name || !email) {
      res.render("profile", { error: "Both name and email are required" });
      return;
    }

    // Check if the email is in the correct format
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailRegex.test(email)) {
      res.render("profile", { error: "Invalid email format." });
      return;
    }

    // SQL query to update the student's name and email
    const updateQuery = 'UPDATE student SET name = $1, email = $2 WHERE email = $3';
    await db.query(updateQuery, [name, email, currentEmail]);

    // Update the currentEmail if the email was changed
    currentEmail = email;

    res.redirect("/SWE363_Project_Group17/views/profile.ejs")
  } catch (error) {
    console.error('Database query error', error);
    res.status(500).send("An error occurred while updating the profile.");
  }
});

app.post("/requestJoin", async (req, res) => {
  let teamId = parseInt(req.body["teamId"], 10); 
  console.log(req.body)

  try {
      // Fetch the name of the student with currentEmail
      const studentResult = await db.query('SELECT name FROM student WHERE email = $1', [currentEmail]);
      if (studentResult.rows.length === 0) {
          // No student found with currentEmail, handle appropriately
          console.error('Student not found');
          return; // Exit the function without changing the page
      }
      const studentName = studentResult.rows[0].name;

      // Insert new request
      const insertQuery = 'INSERT INTO request (senderemail, teamid, status, studentname) VALUES ($1, $2, $3, $4)';
      await db.query(insertQuery, [currentEmail, teamId, false, studentName]);

      
  } catch (error) {
      console.error('Database query error', error);
      // Catch the error and do nothing, keeping the user on the same page
  }
});


app.post("/createTeam", async (req, res) => {
  let idea = req.body["idea"];
  let description = req.body["description"];  // Corrected spelling

  try {
      // Check if the user is already in a team
      const studentCheck = await db.query('SELECT team_id FROM student WHERE email = $1', [currentEmail]);
      if (studentCheck.rows.length > 0 && studentCheck.rows[0].team_id !== null) {
          return res.render("my-team", { error: "You are already part of a team.", currentUser: currentEmail });
      }

      // Check if idea and description are not empty
      if (!idea || !description) {
          return res.render("my-team", { error: "Idea and description are required.", currentUser: currentEmail });
      }

      // Insert new team and get its ID
      const insertQuery = 'INSERT INTO team (name, projectDescription, leaderEmail, seats) VALUES ($1, $2, $3, $4) RETURNING id';
      const teamInsertResult = await db.query(insertQuery, [idea, description, currentEmail, 4]);
      const newTeamId = teamInsertResult.rows[0].id;

      // Update the student's team_id with the new team ID
      const updateStudentQuery = 'UPDATE student SET team_id = $1 WHERE email = $2';
      await db.query(updateStudentQuery, [newTeamId, currentEmail]);

      // Redirect to the my-team page
      res.redirect("/my-team");
  } catch (error) {
      console.error('Database query error', error);
      // Render the my-team page with an error message
      res.render("my-team", { error: "An error occurred while creating the team.", currentUser: currentEmail }); 
  }
});

app.post("/leaveTeam", async (req, res) => {
  let studentEmail = req.body["email"];
  let teamId = req.body["teamid"];

  try {
    
     

      // Increase the seats of the team by one
      const updateTeamQuery = 'UPDATE team SET seats = seats + 1 WHERE id = $1';
      await db.query(updateTeamQuery, [teamId]);

      // Set the student's team_id to null
      const updateStudentQuery = 'UPDATE student SET team_id = NULL WHERE email = $1';
      await db.query(updateStudentQuery, [studentEmail]);

      

      // Redirect or render a page after successful operation
      res.redirect('my-team');
  } catch (error) {
      
      
      console.error('Database query error', error);
      res.render('/my-team', {currentUser : currentEmail, error : error}); 
  }
});

app.post("/rejectRequest", async (req, res) => {
  let senderEmail = req.body["senderEmail"];
  let teamId = req.body["teamid"];
  console.log(senderEmail);
  console.log(teamId);

  try {
      // Delete the request
      const deleteQuery = 'DELETE FROM request WHERE senderemail = $1 AND teamid = $2';
      await db.query(deleteQuery, [senderEmail, teamId]);
      

      // Redirect to the my-team route after successful deletion
      res.redirect('/my-team');
  } catch (error) {
      console.error('Database query error', error);
      // Handle the error appropriately.
      console.log("error");
      res.render('/my-team', {currentUser : currentEmail, error : error}); 
  }
});


app.post("/acceptRequest", async (req, res) => {
  let senderEmail = req.body["senderEmail"];
  let teamId = req.body["teamid"];

  try {

      // Check if the sender is already in a team
      const senderCheck = await db.query('SELECT team_id FROM student WHERE email = $1', [senderEmail]);
      if (senderCheck.rows.length > 0 && senderCheck.rows[0].team_id != null) {
          // Sender is already in a team, delete the request
          await db.query('DELETE FROM request WHERE senderemail = $1', [senderEmail]);
          return res.redirect('/my-team');
      }

      // Check the available seats in the team
      const teamCheck = await db.query('SELECT seats FROM team WHERE id = $1', [teamId]);
      if (teamCheck.rows.length > 0 && teamCheck.rows[0].seats <= 0) {
          // No available seats, delete the request
          await db.query('DELETE FROM request WHERE teamid = $1', [teamId]);
          return res.redirect('/my-team');
      }

      // Update the student's team_id and decrease the team's seats
      await db.query('UPDATE student SET team_id = $1 WHERE email = $2', [teamId, senderEmail]);
      await db.query('UPDATE team SET seats = seats - 1 WHERE id = $1', [teamId]);
      await db.query('DELETE FROM request WHERE senderemail = $1', [senderEmail]);
      console.log('accepted requests to joing');

    

      // Redirect to the my-team page
      res.redirect('/my-team');
  } catch (error) {
      

      console.error('Database query error', error);
      // Handle the error 
      res.render('/my-team', {currentUser : currentEmail, error : error}); 
  }
});

app.post("/adminDeleteStudent", async (req, res) => {
  let email = req.body["email"];

  try {
      

      // Check if the email belongs to a student and if they have a team
      const studentResult = await db.query('SELECT team_id FROM student WHERE email = $1', [email]);
      if (studentResult.rows.length > 0) {
          const teamId = studentResult.rows[0].team_id;
          if (teamId) {
              // Increase the team's available seats by 1
              await db.query('UPDATE team SET seats = seats + 1 WHERE id = $1', [teamId]);
          }

          // Delete the student
          await db.query('DELETE FROM student WHERE email = $1', [email]);
      } else {
          // If no student found
          return res.render('admin-profile', {currentUser : currentEmail, error: "No student found with the provided email." });
      }

      // Render the admin-profile page
      res.render('admin-profile', { currentUser : currentEmail, message: "Student deleted successfully." });
  } catch (error) {
      console.error('Database query error', error);
      // Handle the error - render the admin-profile page with an error message
      res.render('admin-profile', {currentUser: currentEmail, error: "An error occurred while deleting the student." });
  }

});





// Correctly formatted 32-byte key for AES-256-CBC (64 hex characters)
const key = Buffer.from('00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff', 'hex');

const algorithm = 'aes-256-cbc';

function encrypt(text) {
    const iv = crypto.randomBytes(16); // IV is 16 bytes for AES
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted; // The IV is needed for decryption
}

function decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}


app.listen(3000, () => {});


