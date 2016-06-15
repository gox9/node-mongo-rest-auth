
'use strict';

const passport = require('passport');
const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config/main');
const User = require('./models/user');
const requireAuth = passport.authenticate('jwt', { session: false });

module.exports = function(app) {

  app.use(passport.initialize());

  // Bring in defined Passport Strategy
  require('../config/passport')(passport);

  // Create API group routes
  const apiRoutes = express.Router();

  // Register new users
  apiRoutes.post('/register', function(req, res) {
    console.log(req.body);
    if(!req.body.email || !req.body.password) {
      res.status(400).json({ success: false, message: 'Please enter email and password.' });
    } else {
      const newUser = new User({
        email: req.body.email,
        password: req.body.password
      });

      // Attempt to save the user
      newUser.save(function(err) {
        if (err) {
          return res.status(400).json({ success: false, message: 'That email address already exists.'});
        }
        res.status(201).json({ success: true, message: 'Successfully created new user.' });
      });
    }
  });

  // Authenticate the user and get a JSON Web Token to include in the header of future requests.
  apiRoutes.post('/auth', function(req, res) {
    User.findOne({
      email: req.body.email
    }, function(err, user) {
      if (err) {throw err;}

      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication failed. User not found.' });
      } else {
        // Password Control
        user.comparePassword(req.body.password, function(err, isMatch) {
          if (isMatch && !err) {
            // Create token
            const token = jwt.sign(user, config.secret, {
              expiresIn: 10080 // in seconds
            });
            res.status(200).json({ success: true, token: 'JWT ' + token });
          } else {
            res.status(401).json({ success: false, message: 'Authentication failed. Passwords did not match.' });
          }
        });
      }
    });
  });

  // Protect user routes with JWT

  // GET User
  apiRoutes.get('/user', requireAuth, function(req, res) {
    var query = (req.query.email) ? {'email': req.query.email} : {};
    User.find(query, function(err, data) {
      if (err){
        res.status(400).send(err);
      }

      res.json(data);
    });
  });

  // Create New User
  apiRoutes.post('/user', requireAuth, function(req, res) {
    const user = new User({
        email: req.body.email,
        password: req.body.password
      });

    user.save(function(err) {
        if (err){
            res.status(400).send(err);
        }

        res.status(201).json({ message: 'User Created!' });
    });
  });

  // Update User Password
  apiRoutes.put('/user/:email', requireAuth, function(req, res) {

    if(!req.body.email && !req.body.password){
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    
    User.findOne({'email': req.params.email}, function(err, data) {
      if (err){
        return res.send(err);
      }

      if(!data){
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      var msg = '';
      if(req.body.email && (data.email !== req.body.email)){
        data.email = req.body.email;
        msg += 'Email ';
      }

      data.comparePassword(req.body.password, function(err, isMatch){
        if (err){
          return res.send(err);
        }

        if(!isMatch){
          data.password = req.body.password;
          if(msg===''){
            msg += 'Password ';
          }else{
            msg += 'and Password ';
          }

          data.save(function(err) {
            if (err){
              return res.send(err);
            }
            res.json({ message: msg + 'changed!' });
          });
        }else{
          if(msg !== ''){
            data.save(function(err) {
              if (err){
                return res.send(err);
              }
              res.json({ message: msg + 'changed!' });
            });
          }else{
            res.json({ message: 'Nothing changed!' });
          }
        }
      });
    });
  });

  // Delete User
  apiRoutes.delete('/user/:email', requireAuth, function(req, res) {
    User.findOneAndRemove({'email': req.params.email}, function(err, data) {
      if (err){
        return res.send(err);
      }

      if(!data){
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      res.json({ message: 'User deleted!' });
    });
  });

  // Set url for API group routes
  app.use('/api', apiRoutes);
};
