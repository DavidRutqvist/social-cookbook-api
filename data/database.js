var mysql = require("mysql");
var install = require("./install/install");
var recipes = require("./recipes");
var ingredients = require("./ingredients");
var likes = require("./likes");
var comments = require("./comments");
var tags = require("./tags");
var images = require("./images");
var favorites = require("./favorites");
var connectionPool = {};
var connectionConfig = require("mysql/lib/ConnectionConfig");
module.exports = {
  init: function(config) {
    var dbConfig = connectionConfig.parseUrl(config.databaseConnectionString);
    dbConfig.multipleStatements = true;
    dbConfig.supportBigNumbers = true;
    connectionPool = mysql.createPool(dbConfig);//Will create a pool of 10 connections (default)

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
    likes.init(connectionPool);
    comments.init(connectionPool);
    tags.init(connectionPool);
    favorites.init(connectionPool);
    images.init(connectionPool, config);
  },
  isAdmin(userId, callback){
    isAdmin(userId, callback);
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
  getUser: function(userId, callback) {
    connectionPool.getConnection(function(err, connection) {
      connection.query("SELECT * FROM Users JOIN Roles ON Users.RoleId = Roles.Id WHERE Users.Id = ? LIMIT 1", [userId], function(err, rows, fields) {
        if(err) {
          throw err;
        }

        if(rows.length > 0) {
          var user = {
            userId: userId,
            firstName: rows[0].FirstName,
            lastName: rows[0].LastName,
            email: rows[0].Email,
            role: rows[0].Name
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
  },
  getUsers: function(callback){
    connectionPool.getConnection(function(err, connection){
      if(err){
        throw err;
      }
      connection.query("SELECT Id AS userId, Email AS email, FirstName AS firstName, LastName AS lastName, Roles.Name AS roleName FROM USERS JOIN Roles ON Users.RoleId = Roles.Id", function(err, rows, fields) {
        if(err){
          throw err;
        }

        var users = [];
        for(var i = 0; i < rows.length; i++){
          var row = rows[i];
          var user = {
            userId : row.userId,
            email : row.email,
            firstName : row.firstName,
            lastName : row.lastName,
            role: row.roleName
          };
          users.push(user);
        }
        nextIsAdmin(users, 0, function(success, users){
          callback(success, users);
        });
      });
    });
  },
  getRoles: function(callback){
    connectionPool.getConnection(function(err, connection){
      if(err){
        throw err;
      }
      connection.query("SELECT Roles.Id AS roleId, Roles.Name AS roleName FROM Roles", function(err, rows, fields) {
        if(err){
          throw err;
        }
        var roles = [];
        for(var i = 0; i < rows.length; i++){
          var row = rows[i];
          var role = {
            roleId : row.roleId,
            roleName: row.roleName
          };
          roles.push(role);
        }
        callback(roles);
      });
    });
  },
  setRole: function(userId, role, callback){
    connectionPool.getConnection(function(err, connection){
      if(err){
        throw err;
      }
      console.log(role);
      connection.query("UPDATE Users SET RoleId = ? WHERE Id = ?", [role, userId], function(err, result){
        if(err){
          throw err;
        }
        if(result.affectedRows > 0){
          callback(true);
        }
        else{
          callback(false);
        }
      });
    });
  },
  recipes: recipes,
  ingredients: ingredients,
  likes: likes,
  comments : comments,
  tags : tags,
  images: images,
  favorites: favorites
}

function isAdmin(userId, callback) {
  connectionPool.getConnection(function(err, connection) {
    if(err) {
      throw err;
    }

    connection.query("SELECT Roles.Name AS roleName, Roles.InheritRoleId AS inheritedRole FROM Users JOIN Roles ON Users.RoleId = Roles.Id WHERE Users.Id = ? LIMIT 1", [userId], function(err, rows, fields) {
      if(err) {
        throw err;
      }

      if(rows.length > 0) {
        if(rows[0].roleName.toLowerCase() === "administrator") {
          connection.release();
          callback(true);
        }
        else if((rows[0].inheritedRole !== undefined) && (rows[0].inheritedRole !== null)) {
          checkInheritedRole(connection, rows[0].inheritedRole, function(isAdmin) {
            connection.release();
            callback(isAdmin);
          });
        }
        else {
          connection.release();
          callback(false);
        }
      }
      else {
        connection.release();
        callback(false);
      }
    });
  });
}

function nextIsAdmin(users, index, callback) {
  if(index < users.length){
    isAdmin(users[index].userId, function(isAdmin){
      users[index].isAdmin = isAdmin;
      nextIsAdmin(users, index + 1, callback);
    });
  }
  else{
    callback(true, users);
  }
}

function checkInheritedRole(connection, roleId, callback) {
  connection.query("SELECT Roles.Name AS roleName, Roles.InheritRoleId AS inheritedRole FROM Roles WHERE Roles.Id = ? LIMIT 1", [roleId], function(err, rows, fields) {
    if(err) {
      throw err;
    }

    if(rows.length > 0) {
      if(rows[0].roleName.toLowerCase() === "administrator") {
        callback(true);
      }
      else if((rows[0].inheritedRole !== undefined) && (rows[0].inheritedRole !== null)) {
        checkInheritedRole(connection, rows[0].inheritedRole, callback);
      }
      else {
        callback(false);
      }
    }
    else {
      callback(false);
    }
  });
}
