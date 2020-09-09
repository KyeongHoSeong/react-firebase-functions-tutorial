const functions = require('firebase-functions');

const app = require('express')();

const FBAuth = require('./utils/fbAuth');

const {
    getComment,
  getAllScreams,
  postOneScream,
  getScream,
} = require("./handlers/screams");

const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
} = require("./handlers/users");
//
app.get('/comment', getComment);
// screams routes
app.get('/screams', getAllScreams) 
app.post('/scream', FBAuth, postOneScream);
app.get('/scream/:screamId', FBAuth, getScream );
//ToDo: 
//delete
// like a scream
// unlike a scream
// comment on scream

// user routes
app.post("/signup", signup);
app.post('/login', login); 
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);


exports.api = functions.region('asia-northeast3').https.onRequest(app);
