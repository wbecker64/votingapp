var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var VOTINGAPP_COLLECTION = "votingapp";

var app = express();
app.use(bodyParser.json());

// Create link to Angular build directory
var distDir = __dirname + "/dist/votingapp/";
app.use(express.static(distDir));

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/votingapp", function (err, client) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = client.db();
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("Voting app running on port", port);
  });
});

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

/*  "/api/votes"
 *    GET: finds all votes
 *    POST: creates a new vote
 */

app.get("/api/votes", function(req, res) {
  db.collection(VOTINGAPP_COLLECTION).find({}).toArray(function(err, votes) {
    if (err) {
      handleError(res, err.message, "Failed to get votes.");
    } else {
      res.status(200).json(votes);
    }
  });
});

app.post("/api/votes", function(req, res) {
  var newVote = req.body;

  if (!req.body.name) {
    handleError(res, "Invalid territory input", "Must provide a name.", 400);
  }

  db.collection(VOTINGAPP_COLLECTION).insertOne(newVote, function(err, vote) {
    if (err) {
      handleError(res, err.message, "Failed to create new vote.");
    } else {
      res.status(201).json(vote.ops[0]);
    }
  });
});

/*  "/api/votes/:id"
 *    GET: find votes by id
 *    PUT: update votes by id
 *    DELETE: deletes votes by id
 */

app.get("/api/votes/:id", function(req, res) {
  db.collection(VOTINGAPP_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, vote) {
    if (err) {
      handleError(res, err.message, "Failed to get vote");
    } else {
      res.status(200).json(votes);
    }
  });
});

app.put("/api/votes/:id", function(req, res) {
  var updateDoc = req.body;
  delete updateDoc._id;

  db.collection(VOTINGAPP_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, {$set: updateDoc}, function(err, vote) {
    if (err) {
      handleError(res, err.message, "Failed to update territory");
    } else {
      updateDoc._id = req.params.id;
      res.status(200).json(updateDoc);
    }
  });
});

app.delete("/api/votes/:id", function(req, res) {
  db.collection(VOTINGAPP_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, vote) {
    if (err) {
      handleError(res, err.message, "Failed to delete vote");
    } else {
      res.status(200).json(req.params.id);
    }
  });
});