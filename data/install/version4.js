var fs = require('fs');
module.exports = {
  install: function(connection, callback) {
    console.log("Installing version 4 of database");
    var query = fs.readFileSync("./data/install/version4.sql").toString();
    connection.query(query, function(err, rows, fields) {
      if(err) {
        throw err;
      }

      callback(connection, 4);//4 for version 4
    });
  }
}
