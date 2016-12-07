var connectionPool;
module.exports = {
  init: function(dbPool) {
    connectionPool = dbPool;
  },
    addNewLike: function(userId, recipeId, type, callback) {
      connectionPool.getConnection(function(err, connection) {
      if(err) {
        throw err;
      }
      connection.query("INSERT INTO Likes (UserId, RecipeId, Type) VALUES (?, ?, ?)", [userId, recipeId, type], function(err, result){
        if(err) {
          throw err;
        }

        if(result.affectedRows > 0) {
          connection.release();
          callback(true, result.insertId);
        }
        else {
          connection.release();
          callback(false, null);
        }
      });
    });
  },
    getLikes: function(recipeId, callback) {
      connectionPool.getConnection(function(err, connection) {
        if(err) {
          throw err;
        }
        getLikes(connection, recipeId, function(success, likes) {
          connection.release();
          callback(success, likes);
        });
      });
    },
    getLikes: function(connection, recipeId, callback){
      connection.query("SELECT COUNT(*) AS count, Type AS type FROM Likes WHERE RecipeId = ? GROUP BY Type", [recipeId], function(err, rows, fields) {
        if(err) {
          throw err;
        }
        var likes = {
          yum: 0,
          yuck: 0
        };
        if(rows.length > 0) {
            for(var i = 0; i < rows.length; i++) {
              if(rows[i].type === 1) {
                likes.yum = rows[i].count;
              }
              else if(rows[i].type === 0) {
                likes.yuck = rows[i].count;
              }
              else {
                console.log("Unknown like type");
              }
            }

            callback(true, likes);
        }
        else  {
          callback(true, likes);
        }
      });
    },
    getLikeByUser: function(userId, recipeId, callback) {
      connectionPool.getConnection(function(err, connection){
          if(err) {
            throw err;
          }
          connection.query("SELECT Type AS type FROM Likes WHERE UserId = ? AND RecipeId =?", [userId, recipeId], function(err, rows, fields){
            if(err) {
              throw err;
            }
            if(rows.length > 0) {
              connection.release();
              callback(true, rows[0].type);
            }
            else {
              connection.release();
              callback(false, null);
            }
          });
      });
    },
    updateLike: function(userId, recipeId, like, callback) {
      connectionPool.getConnection(function(err, connection){
        if(err) {
          throw err;
        }
        connection.query("UPDATE Likes SET Type = ? WHERE UserId = ? AND RecipeId =?", [type, userId, recipeId], function(err, result){
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
    removeLikesFromRecipe: function(connection, recipeId, callback) {
      connection.query("DELETE FROM Likes WHERE RecipeId = ?", [recipeId], function(err, result) {
        if(err) {
          throw err;
        }

        callback(result.affectedRows);
      });
    },
    removeLikes: function(userId, recipeId, callback){
      connectionPool.getConnection(function(err, connection){
        if(err) {
          throw err;
        }
        connection.query("DELETE FROM Likes WHERE UserId = ? AND RecipeId =?", [userId, recipeId], function(err, result){
          if(err) {
            throw err;
          }
          if(affectedRows > 0) {
            connection.release();
            callback(true);
          }
          else {
            connection.release();
            callback(false);
          }
        });
      });
    }
};
