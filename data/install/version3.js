var fs = require('fs');
module.exports = {
  install: function(connection, callback) {
    console.log("Installing version 3 of database");
    var query = fs.readFileSync("./data/install/version3.sql").toString();
    connection.query(query, function(err, rows, fields) {
      if(err) {
        throw err;
      }

      callback(connection, 3);//3 for version 3
    });
  }
}
