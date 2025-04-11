const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

// Serve your index.html for form submission
app.use(express.static('public'));

// POST route to handle form submission
app.post('/submit', async (req, res) => {
  const { username, email, password, current_height, current_weight, sex, date_of_birth } = req.body;
  
  try {
    // Insert form data into the database
    const [rows, fields] = await pool.execute(
      'INSERT INTO users (username, email, password, current_height, current_weight, sex, date_of_birth) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [username, email, password, current_height, current_weight, sex, date_of_birth]
    );
    res.send('Data successfully inserted into the database!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error inserting data');
  }
});

const server = app.listen(3000, () => {
    console.log(`Express running → PORT ${server.address().port}`);
  });

  