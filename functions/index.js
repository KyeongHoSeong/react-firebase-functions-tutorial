const functions = require('firebase-functions');

const app = require('express')();

const FBAuth = require('./utils/fbAuth');

const {
//    debugRoute,
  getAllScreams,
  postOneScream,
  getScream,
  commentOnScream,
  likeScream,
  unlikeScream,
  deleteScream
} = require("./handlers/screams");

const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
} = require("./handlers/users");
//
//app.get('/debuger', debugRoute);
// screams routes
app.get('/screams', getAllScreams) 
app.post('/scream', FBAuth, postOneScream);
app.get('/scream/:screamId', FBAuth, getScream );
app.post('/scream:screamId/comment', FBAuth, commentOnScream);
app.get('/scream:screamId/like', FBAuth, likeScream);
app.get('/scream:screamId/unlike', FBAuth, unlikeScream);
app.delete('scream/:screamId', FBAuth, deleteScream)


//ToDo: 
//delete
// like a scream
// unlike a scream

// user routes
app.post("/signup", signup);
app.post('/login', login); 
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);


exports.api = functions.region('asia-northeast3').https.onRequest(app);
