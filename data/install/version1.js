var fs = require('fs');
module.exports = {
  install: function(connection, callback) {
    console.log("Installing version 1 of database");
    var query = fs.readFileSync("./data/install/version1.sql").toString();
    connection.query(query, function(err, rows, fields) {
      if(err) {
        throw err;
      }

      callback(connection, 1);//1 for version 1
    });
  }
}
