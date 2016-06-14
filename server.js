
'use strict';

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const config = require('./config/main');
const cors = require('cors');
const port = 3000;

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Log requests to console
app.use(morgan('dev'));

// Home route.
app.get('/', function(req, res) {
  res.send('Home page');
});

mongoose.connect(config.database);

require('./app/routes')(app);

// Start the server
app.listen(port);
console.log('Auth server is running on port ' + port + '.');
