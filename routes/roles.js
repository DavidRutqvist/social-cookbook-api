module.exports = function(app, router, database) {

  /**
  * @api {post} /api/roles Get roles
  * @apiDescription Gets all roles defined in the system. Requires administrator privileges.
  * @apiName Get all roles
  * @apiGroup Roles
  * @apiHeader {String} x-access-token Token obtained using authentication process
  *
  * @apiSuccess {Boolean} success Indicates whether the request was successful
  * @apiSuccess {String} message Status message
  * @apiSuccess {Object[]} roles List of available roles
  * @apiSuccess {Number} roles.roleId Id of role
  * @apiSuccess {String} roles.roleName Name of role
  *
  * @apiError {Boolean} success Indicates whether the request was successful
  * @apiError {String} message Status message
  */
  router.get("/roles", function(req, res){
    database.isAdmin(req.decoded.userId, function(isAdmin){
      if(isAdmin){
        database.getRoles(function(roles){
          res.status(200).json({
            roles: roles,
            success: true,
            message: "Roles retrieved successfully"
          });
        });
      }
      else{
        res.status(401).json({
          success: false,
          message: "Not authorized"
        });
      }
    });
  });

  /**
  * @api {put} /api/users/:id Update user
  * @apiDescription Updates the provided fields for the given user. Currently only changing role is allowed. Requires administrator privileges.
  * @apiName Update user
  * @apiGroup Users
  * @apiHeader {String} x-access-token Token obtained using authentication process
  * @apiParam {Number} id Id of user to update
  * @apiParam {Number} role Id of role to set the user as
  *
  * @apiSuccess {Boolean} success Indicates whether the request was successful
  * @apiSuccess {String} message Status message
  *
  * @apiError {Boolean} success Indicates whether the request was successful
  * @apiError {String} message Status message
  */
  router.put("/users/:id", function(req, res){
    database.isAdmin(req.decoded.userId, function(isAdmin){
      if(isAdmin){
        database.setRole(req.params.id, req.body.role, function(success){
          if(success){
            res.status(200).json({
              success: success,
              message: "Role updated successfully"
            });
          }
          else{
            res.status(500).json({
              success: success,
              message: "Something went wrong"
            });
          }
        });
      }
      else{
        res.status(401).json({
          message: "Not authorized"
        });
      }
    });
  });
}
