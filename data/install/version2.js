var fs = require('fs');
module.exports = {
  install: function(connection, callback) {
    console.log("Installing version 2 of database");
    var query = fs.readFileSync("./data/install/version2.sql").toString();
    connection.query(query, function(err, rows, fields) {
      if(err) {
        throw err;
      }

      callback(connection, 2);//2 for version 2
    });
  }
}
