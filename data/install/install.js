var version1 = require("./version1");
var version2 = require("./version2");

module.exports = {
  install: function(connectionPool) {
    connectionPool.getConnection(function(err, connection) {
      if(err) {
        throw err;
      }

      getCurrentVersion(connection, function(currentVersion) {
        doInstallStep(connection, currentVersion);
      });
    });
  }
}

function doInstallStep(connection, currentVersion) {
  console.log("Install step " + currentVersion);
  if(currentVersion == 0) {
    version1.install(connection, doInstallStep);
  }
  else if(currentVersion == 1) {
    version2.install(connection, doInstallStep);
  }
  else if(currentVersion == 2) {
    finalizeInstallation(connection, currentVersion);
  }
  else {
    console.log("Invalid version supplied to install step");
  }
  /*
  if(currentVersion == 1) {
    //Upgrade
    version2.install(connection, doInstallStep);
  }
  etc.
  */

}

function finalizeInstallation(connection, currentVersion) {
  console.log("Finalizing installation");
  connection.query("UPDATE SchemaVersion SET Version=?", [currentVersion], function(err, rows, fields) {
    if(err) {
      throw err;
    }

    console.log("Releasing connection");
    connection.release();
    console.log("Database install finished");
    console.log("Database now at version " + currentVersion);
  });
}

function getCurrentVersion(connection, callback) {
  //The following function checks whether there is a schema table if so then it selecets the current version, otherwise it creats the table and inserts a row with version 0
  console.log("Getting current database version");
  connection.query("SELECT COUNT(*) AS 'count' FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SchemaVersion'", function(err, rows, fields) {
    if(err) {
      throw err;
    }

    if(rows[0].count >= 1) {
      console.log("Schema table exists");
      connection.query("SELECT Version AS version FROM SchemaVersion LIMIT 1", function(err, rows, fields) {
        if(err) {
          throw err;
        }

        console.log("Current version: " + rows[0].version);
        callback(rows[0].version);
      });
    }
    else {
      console.log("Schema table does not exist, will try creating one");
      connection.query("CREATE TABLE SchemaVersion (Version INT);", function(err, rows, fields) {
        if(err) {
          throw err;
        }

        console.log("Schema table created, inserting new version row with value 0");
        connection.query("INSERT INTO SchemaVersion (Version) VALUES (0)", function(err, rows, fields) {
          if(err) {
            throw err;
          }

          console.log("Schema row inserted successfully");
          callback(0);
        });
      });
    }
  });
}
