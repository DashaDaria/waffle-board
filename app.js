var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var request = require("request");
var session = require("express-session");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// app.use("/", indexRouter);
// app.use("/login", indexRouter);
app.get("/", function(req, res, next) {
  res.render("index", { title: "Express" });
});
// app.use("/users", usersRouter);

// app.use("/login");
// catch 404 and forward to error handler

const tenant = "express-example";
const client_id = "USycC2noNic1zGZXxlWXSWqKPI4gvakp";
const client_secret =
  "KFn29bWEmu6iXVPjj5PMYmBp-yj9EDEDsHM0kjNv5gnNMPSfVj7Tpvl1vhxgcUh1";
const redirect_uri = "http://localhost:3000/callback";

function randomString() {
  let rnd = "";
  for (a = 0; a < 10; a++) {
    rnd += parseInt(Math.random() * 10);
  }
  return rnd;
}

app.get("/login", function(req, res) {
  req.session.states = req.session.states || [];

  const state = randomString();

  req.session.states.push(state);

  res.redirect(
    `https://${tenant}.auth0.com/authorize?client_id=${client_id}&response_type=code&state=${state}&redirect_uri=${redirect_uri}`
  );
});

app.get("/callback", function(req, res, next) {
  const code = req.query.code;
  const callbackSTate = req.query.state;

  req.session.states = req.session.states || [];

  if (req.session.states.indexOf(callbackSTate) === -1) {
    return res.send("INVALID STATE");
  }

  req.session.states = req.session.states.filter(i => i !== callbackSTate);

  request.post(
    `https://${tenant}.auth0.com/oauth/token`,
    {
      form: {
        client_id,
        client_secret,
        redirect_uri,
        grant_type: "authorization_code",
        code
      }
    },
    function(err, httpResponse, body) {
      const json = JSON.parse(body);
      const token = json.access_token;

      request.post(
        `https://${tenant}.auth0.com/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        function(err, httpResponse, body) {
          res.json(body);
        }
      );
    }
  );
});

app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
