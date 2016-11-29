var mysql = require("mysql");
var connection = {};
module.exports = {
  init: function(config) {
    connection = mysql.createConnection(config.databaseConnectionString);

    //Test connection
    console.log("Trying to connect to database");
    connection.connect(function(err) {
      if (err) {
        console.error('Error connecting');
        throw err;
      }

      console.log('Connected as id ' + connection.threadId);
    });
  }
}
