const {admin, db} = require('../utils/admin');

const config = require('../utils/config');

const firebase = require('firebase');
firebase.initializeApp(config);

const { validateSignupData, validateLoginData } = require('../utils/validators');
const { UserRecordMetadata } = require('firebase-functions/lib/providers/auth');
const { request } = require('http');

//////////////////
exports.signup = (request, response) => {
  const newUser = {
    email: request.body.email,
    password: request.body.password,
    confirmPassword: request.body.confirmPassword,
    handle: request.body.handle,
  };

const { valid, errors } = validateSignupData(newUser);

if(!valid)  return response.status(400).json(errors);

const noImg = 'no-img.png';

  //validate data
  let token, userId;
  //db.collection('users').doc()
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) { //handle이 존재하면 리턴
        return response
          .status(400)
          .json({ handle: "this handle is already taken" });
      } else { // handle 존재하지 않으면 새로운 계정 만들기
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      //return response.status(201).json({ token });
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
        //userId: userId
        userId,
      };
      return db
        .doc(`/users/${newUser.handle}`)
        .set(userCredentials);
    })
    .then(() => {
      return response.status(201).json({ token });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return response.status(400).json({ email: "email is already exist" });
      } else {
        return response.status(500).json({ error: err.code });
      }
    });
}

exports.login = (request, response) => {
  const user = {
    email: request.body.email,
    password: request.body.password
  };

  const { valid, errors } = validateLoginData(user);

  if(!valid)  return response.status(400).json(errors);

  firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return response.json({token});
    })
    .catch((err) =>{
      console.error(err);
      if(err.code === 'auth/wrong-password') {
          return response.status(403).json({ general: 'Wrong credentials, please try again'});
      } else {
        return response.status(500).json({error: err.code});
      }
    });
}
  
exports.getAuthenticatedUser = (req, res) => {
  let userData = {};

  db.doc(`/users/${req.user.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        userData.credentials = doc.data();
        return db
          .collection("likes")
          .where("userHandle", "==", req.user.handle)
          .get();
      }
    })
    .then((data) => {
      userData.likes = [];
      data.forEach((doc) => {
        userData.likes.push(doc.data());
      });
      
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.addUserDetails = (request, response) => {
  let userDetails = reduceUserDetails(req.body);

  db.doc(`/users/${req.user.handle}`).update(userDetails)
    .then(() => {
      return res.json({message: 'Details added successufly'});
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({error: err.code});
    });
};

// Upload a profile image for user
// npm install --save busboy, at functions
exports.uploadImage = (request, respose) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: request.headers });

  let imageToBeUploaded = {};
  let imageFileName;
  // // String for image token
  // let generatedToken = uuid();

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    console.log(fieldname, file, filename, encoding, mimetype);
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong file type submitted" });
    }
    // my.image.png => ['my', 'image', 'png']
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    // 32756238461724837.png
    imageFileName = `${Math.round(Math.random() * 1000000000000).toString()}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
            //Generate token to be appended to imageUrl
            //firebaseStorageDownloadTokens: generatedToken,
          },
        },
      })
      .then(() => {
        // Append token to url
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        //const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media&token=${generatedToken}`;
        //return db.doc(`/users/${request.user.handle}`).update({ imageUrl: imageUrl });
        return db.doc(`/users/${request.user.handle}`).update({ imageUrl });
      })
      .then(() => {
        return response.json({ message: "image uploaded successfully" });
      })
      .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: "something went wrong" });
      });
  });
  busboy.end(request.rawBody);
};