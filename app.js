var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var app = express();

var jwt = require("jsonwebtoken");
var config = require("./config");

app.set("jwtSecret", config.secret);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var router = express.Router();
app.use("/api", router);//Prepend all calls with /api

//Add main routes here, splitted into several files
require("./routes/index")(app, router, jwt);//Important that this one is first since it provides authentication

/*
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
*/
module.exports = app;
