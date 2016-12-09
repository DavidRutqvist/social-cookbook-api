var connectionPool;
var globalConfig;
var uuid = require('node-uuid');
var fs = require('fs');
var pathHelper = require('path');
module.exports = {
  init: function(dbPool, config) {
    connectionPool = dbPool;
    globalConfig = config;
  },
  upload: function(unitId, file, callback) {
    var dirPath = "./" + globalConfig.uploadLocation;
    var filename = uuid.v4();
    var extension = pathHelper.extname(file.originalname);
    var path = dirPath + "/" + filename + extension;

    fs.writeFile(path, file.buffer, function(err) {
      if(err) {
        throw err;
      }

      connectionPool.getConnection(function(err, connection) {
        if(err) {
          throw err;
        }

        var originalAddress = globalConfig.staticAddress + "/" + filename + extension;
        connection.query("INSERT INTO Images (Original) VALUES (?)", [originalAddress], function(err, result) {
          if(err) {
            throw err;
          }

          connection.release();

          if(result.affectedRows > 0) {
            callback(result.insertId);
          }
          else {
            callback(null);
          }
        });
      });
    });
  }
};
