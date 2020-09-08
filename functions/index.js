const functions = require('firebase-functions');

const app = require('express')();

const FBAuth = require('./utils/fbAuth');

const { getAllscreams, postOneScream } = require('./handlers/screams');
const { signup, login } = require('./handlers/users');

//scream routes
app.get('/screams', getAllscreams) 
app.post('/scream', FBAuth, postOneScream);

//users route
app.post('/signup', signup);
app.post('/login', login);

exports.api = functions.region('asia-northeast3').https.onRequest(app);
