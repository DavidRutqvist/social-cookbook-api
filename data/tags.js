var connectionPool;
module.exports = {
  init: function(dbPool) {
    connectionPool = dbPool;
  },
  addTags: function(recipeId, tags, callback){
    connectionPool.getConnection(function(err, connection){
      if(err){
        throw err;
      }
      addNextTag(connection, recipeId, 0, tags, function(success, numberOfAddedTags){
        callback(success, numberOfAddedTags);
      });
    });
  },
  addOrGet: function(tag, callback){
    connectionPool.getConnection(function(err,connection){
      if(err){
        throw err;
      }
      this.addOrGet(connection, tag, function(tagId){
        connection.release();
        callback(tagId);
      });
    });
  },

  addTagToRecipe: function(tagId, recipeId, callback){
    connectionPool.getConnection(function(err, connection){
      if(err){
        throw err;
      }
      this.addTagToRecipe(connection, tagId, recipeId, function(tagId){
        connection.release();
        callback(tagId);
      });
    });
  },

  removeTagsFromRecipe: function(recipeId, callback){
    connectionPool.getConnection(function(err, connection){
      if(err){
        throw err;
      }
      removeTagsFromRecipe(connection, recipeId, function(success){
        connection.release();
        callback(success);
      });
    });
  },

  removeTagsFromRecipe: function(connection, recipeId, callback){
    connection.query("DELETE FROM RecipeTags WHERE RecipeId = ?", [recipeId], function(err, result){
      if(err) {
        throw err;
      }
      if(result.affectedRows > 0){
        callback(true);
      }
      else{
        callback(false);
      }
    });
  },
  getRecipeTags: function(recipeId, callback){
    connectionPool.getConnection(function(err, connection){
      if(err){
        throw err;
      }
      getRecipeTags(connection, recipeId, function(success, tags){
        connection.release();
        callback(success, tags);
      });
    });
  },
  getRecipeTags: function(connection, recipeId, callback){
    connection.query("SELECT Tags.Name AS name FROM RecipeTags INNER JOIN Tags WHERE RecipeId = ? AND RecipeTags.TagId = Tags.Id", [recipeId], function(err, rows, fields){
      if(err){
        throw err;
      }
      var tags = [];
      if(rows.length > 0) {
        for(var i = 0; i < rows.length; i++){
          tags[i] = rows[i].name;
        }
      }
      callback(tags);
    });
  }
}

function addOrGet(connection, tag, callback){
  connection.query("SELECT Id FROM Tags WHERE Name = ? LIMIT 1", [tag.toLowerCase()], function(err, rows, fields){
    if(err){
      throw err;
    }

    if(rows.length > 0){
      callback(rows[0].Id);
    }
    else {
      connection.query("INSERT INTO Tags (Name) VALUES (?)", [tag.toLowerCase()], function(err, result){
        if(err){
          throw err;
        }

        if(result.affectedRows > 0){
          callback(result.insertId);
        }
        else {
          callback(null);
        }
      });
    }
  });
}

function addTagToRecipe(connection, tagId, recipeId, callback){
  connection.query("INSERT INTO RecipeTags (RecipeId, TagId) VALUES (?, ?)", [recipeId, tagId], function(err, result){
    if(err) {
      throw err;
    }
    if(result.affectedRows > 0){
      callback(true);
    }
    else{
      callback(false);
    }
  });
}

function addNextTag(connection, recipeId, index, tags, callback){
  if(index >= tags.length){
    callback(true, tags.length);
  }
  else {
    var tag = tags[index];
    addOrGet(connection, tag, function(tagId){
      if((tagId !== null) && (tagId !== undefined)){
        addTagToRecipe(connection, tagId, recipeId, function(success){
          if(success){
            addNextTag( connection, recipeId, index + 1, tags, callback);
          }
          else {
            callback(false, index);
          }
        });
      }
    });
  }
}
/*
CREATE TABLE Tags (
  Id INT NOT NULL AUTO_INCREMENT,
  Name VARCHAR(255) NOT NULL,

  PRIMARY KEY (Id)
);

CREATE TABLE RecipeTags (
  RecipeId INT NOT NULL,
  TagId INT NOT NULL,

  PRIMARY KEY (RecipeId, TagId),
  FOREIGN KEY (RecipeId) REFERENCES Recipes(Id),
  FOREIGN KEY (TagId) REFERENCES Tags(Id)
);
*/