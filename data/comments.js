var connectionPool;
module.exports = {
  init: function(dbPool) {
    connectionPool = dbPool;
  },
  addNewComment: function(userId, recipeId, content, callback){
    connectionPool.getConnection(function(err, connection){
      if(err){
        throw err;
      }
      connection.query("INSERT INTO Comments (UserId, RecipeId, Content) VALUES ?, ?, ?", [userId, recipeId, content], function(err, result){
        if(err){
          throw err;
        }

        if(result.affectedRows > 0){
          connection.release();
          callback(true, result.insertId);
        }
        else {
          connection.release();
          callback(false, result);
        }
      });
    });
  },
  removeComment: function(commentId, userId, recipeId, callback){
    connectionPool.getConnection(function(err, connection){
      if(err){
        throw err;
      }
      connection.query("DELETE FROM Comments WHERE Id = ? AND UserId = ? AND RecipeId = ?", [commentId, userId, recipeId], function(err, result){
        if(err){
          throw err;
        }

        if(result.affectedRows > 0){
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
  removeCommentFromRecipe: function(commentId, recipeId, callback){
    connectionPool.getConnection(function(err, connection){
      if(err){
        throw err;
      }
      connection.query("DELETE FROM Comments WHERE Id = ? AND RecipeId = ?", [commentId, recipeId], function(err, result){
        if(err){
          throw err;
        }

        if(result.affectedRows > 0){
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
  updateComment: function(commentId, userId, recipeId, content, callback){
    connectionPool.getConnection(function(err, connection){
      if(err){
        throw err;
      }
      connection.query("UPDATE Comments SET Content = ? WHERE Id = ? AND UserId = ? AND RecipeId = ?", [conent, commentId, userId, recipeId], function(err, result){
        if(err){
          throw err;
        }

        if(result.affectedRows > 0){
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
  getComments: function(recipeId, callback){
    connectionPool.getConnection(function(err, connection) {
      if(err) {
        throw err;
      }
      getComments(connection, recipeId, function(success, comments) {
        connection.release();
        callback(success, comments);
      });
    });
  },
  getComments: function(connection, recipeId, callback){
    connection.query("SELECT Comments.Id As commentId, Content AS content, FirstName AS firstName, LastName AS lastName FROM Comments INNER JOIN Users WHERE RecipeId = ? AND Comments.UserId = Users.Id", [recipeId], function(err, rows, fields){
      if(err){
        throw err;
      }
      callback(rows);
    });
  }
}
