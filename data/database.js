var mysql = require("mysql");
var install = require("./install/install");
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
  }
}
