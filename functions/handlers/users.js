const {admin, db} = require('../utils/admin');
const config = require('../utils/config');
const firebase = require('firebase');
firebase.initializeApp(config);

const { validateSignupData, validateLoginData, reduceUserDetails } = require('../utils/validators');
const { UserRecordMetadata } = require('firebase-functions/lib/providers/auth');

//////////////////
exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  const { valid, errors } = validateSignupData(newUser);
  if(!valid) return res.status(400).json(errors);

  const noImg = 'no-img.png';

  // TODO: validate data;
  // db:usrers handle <=> auth: userID
  let token, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then((doc) => {
      //if registered at users then err
      if (doc.exists) {
        return res.status(400).json({ handle: "this handle is already taken" });
      } else { // not registered user then create new users a
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => { 
        userId = data.user.uid;
        return data.user.getIdToken();
    })
    .then((idToken) => {// step 7
        //return res.status(201).json({ token });
        token = idToken;
        const userCredentials = {
            handle: newUser.handle,
            email: newUser.email,
            createdAt: new Date().toISOString(),
            imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
            userId // auth=>uid = users=>userId
        };
        // setting user credentials at (db => users)
        return db.doc(`/users/${newUser.handle}`).set(userCredentials);    
    })
    .then(() => {
        return res.status(201).json({token});
    })
    .catch((err) => {
      console.error(err);
      if(err.code === 'auth/email-already-in-use'){
          res.status(400).json( {email: 'Email is already is use'})
      } else {
        return res.status(500).json({ error: err.code });
        }
    });
}

exports.login = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };

    const { valid, errors } = validateLoginData(user);
    if(!valid) return res.status(400).json(errors);

    firebase
      .auth()
      .signInWithEmailAndPassword(user.email, user.password)
      .then((data) => {
        return data.user.getIdToken();
      })
      .then((token) => {
        return res.json({ token });
      })
      .catch((err) => {
        console.error(err);
        if (err.code === 'auth/user-not-found') {
          return res
            .status(403)
            .json({ general: 'Wrong user email, please try again' });
        } else if (err.code === "auth/wrong-password") {
          return res
            .status(403)
            .json({ general: "Wrong credentials, please try again" });
        } else
            return res.status(500).json({ error: err.code });
      });
}; 
  
 





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



exports.addUserDetails = (req, res) => {
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
exports.uploadImage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });

  let imageToBeUploaded = {};
  let imageFileName;
  // String for image token
  let generatedToken = uuid();

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    console.log(fieldname, file, filename, encoding, mimetype);
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong file type submitted" });
    }
    // my.image.png => ['my', 'image', 'png']
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    // 32756238461724837.png
    imageFileName = `${Math.round(
      Math.random() * 1000000000000
    ).toString()}.${imageExtension}`;
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
            firebaseStorageDownloadTokens: generatedToken,
          },
        },
      })
      .then(() => {
        // Append token to url
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media&token=${generatedToken}`;
        return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: "image uploaded successfully" });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: "something went wrong" });
      });
  });
  busboy.end(req.rawBody);
};