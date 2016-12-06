var mysql = require("mysql");
var install = require("./install/install");
var recipes = require("./recipes");
var ingredients = require("./ingredients");
var connectionPool = {};
module.exports = {
  init: function(config) {
    connectionPool = mysql.createPool(config.databaseConnectionString);//Will create a pool of 10 connections (default)

    //Test connection
    console.log("Trying to connect to database");
    connectionPool.getConnection(function(err, connection) {
      if (err) {
        console.error('Error connecting');
        throw err;
      }

      console.log('Connected as id ' + connection.threadId);

      connection.release();
    });

    //Set up database Schema
    install.install(connectionPool);
    recipes.init(connectionPool, ingredients);
    ingredients.init(connectionPool);
  },
  register: function(userId, firstName, lastName, email, callback) {
    connectionPool.getConnection(function(err, connection) {
      connection.query("INSERT INTO Users (Id, FirstName, LastName, Email) VALUES (?, ?, ?, ?)", [userId, firstName, lastName, email], function(err, result) {
        if(err) {
          throw err;
        }

        if(result.affectedRows > 0) {
          connection.release();
          callback(true);
        }
        else {
          connection.release();
          callback(false);
        }
      });
    });
  },
  recipes: recipes,
  getUser: function(userId, callback) {
    connectionPool.getConnection(function(err, connection) {
      connection.query("SELECT * FROM Users WHERE Id = ? LIMIT 1", [userId], function(err, rows, fields) {
        if(err) {
          throw err;
        }

        if(rows.length > 0) {
          var user = {
            userId: userId,
            firstName: rows[0].FirstName,
            lastName: rows[0].LastName,
            email: rows[0].Email
          };

          connection.release();
          callback(true, user);
        }
        else {
          connection.release();
          callback(false, null);
        }
      });
    });
  }
}
