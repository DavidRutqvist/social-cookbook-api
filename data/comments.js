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
      connection.query("INSERT INTO Comments (UserId, RecipeId, Content) VALUES (?, ?, ?)", [userId, recipeId, content], function(err, result){
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
  removeCommentFromRecipe: function(commentId, userId, recipeId, callback){
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
  removeCommentsFromRecipe: function(recipeId, callback){
    connectionPool.getConnection(function(err, connection){
      if(err){
        throw err;
      }
      removeCommentsFromRecipe(connection, recipeId, function(success) {
        connection.release();
        callback(success);
      });
    });
  },
  removeCommentsFromRecipe: function(connection, recipeId, callback){
    connection.query("DELETE FROM Comments WHERE RecipeId = ?", [recipeId], function(err, result){
      if(err){
        throw err;
      }

      if(result.affectedRows > 0){
        callback(true);
      }
      else {
        callback(false);
      }
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
    connection.query("SELECT Comments.Id As id, Content AS content, FirstName AS firstName, LastName AS lastName, CreationTime AS creationTime, UserId AS userId FROM Comments INNER JOIN Users ON Users.Id = Comments.UserId WHERE RecipeId = ?", [recipeId], function(err, rows, fields){
      if(err){
        throw err;
      }
      callback(rows);
    });
  }
}
