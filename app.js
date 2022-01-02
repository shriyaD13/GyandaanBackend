const express = require('express');
const app = express();
const firebase = require("firebase/app");
require("firebase/auth");
// const path = require('path');
const { urlencoded } = require('express');

app.use(urlencoded({ extended: true }));

// Firebase Firestore
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require("./gyandaan-19f42-firebase-adminsdk-s3gqj-96d164c7c6.json");
initializeApp({
    credential: cert(serviceAccount)
});
const db = getFirestore();

// Firebase Auth
const firebaseConfig = {
    apiKey: "AIzaSyA73VSwU-UKQVOFm2bEZO93iYEfjDhWuF8",
  authDomain: "gyandaan-19f42.firebaseapp.com",
  projectId: "gyandaan-19f42",
  storageBucket: "gyandaan-19f42.appspot.com",
  messagingSenderId: "246523796593",
  appId: "1:246523796593:web:c0b0ace676e21f65cf8fd0"
}
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const courses = {
    class9th: {
        Math: ['Trignometry', 'circles'],
        Science: ['Heriditary', 'Respiration'],
        Sst: ['Climate', 'India Revoulation'],
    },
    class10th: {
        Math: ['Surface Area', 'Triangles'],
        Science: ['Electricity', 'Magnetism'],
        Sst: ['Industries', 'Food Revoulation'],
    }
}

app.get('/', async (req, res) => {
    res.send('Working....');
})

app.get('/courses', async (req, res) => {
    var listOfCourses = [];

    const courseDb = await db.collection('courses').get();
    courseDb.forEach((course) => {
        listOfCourses.push({
            courseName: course.id,
            courseInfo: course.data(),
        })
    });
    // listOfCourses.forEach((ele) => console.log(ele))
    res.send(JSON.stringify(listOfCourses));


})

app.get('/students/:id', async (req, res) => {
    const { id } = req.params;
    console.log(id);
    const stdData = await db.collection('students').doc(id).get();
    // await  db.collection('students').doc(id).update({mentor: 'Rock'});
    res.send(JSON.stringify(stdData.data()));
})

app.post('/addMentor/:id', async (req, res) => {

})

app.get('/mentors/:id', async (req, res) => {
    const { id } = req.params;
    console.log(id);
    const mentorData = await db.collection('mentors').doc(id).get();
    res.send(JSON.stringify(mentorData.data()));
})

app.post('/addMentee/:id', async (req, res) => {

})


app.post('/findMentor', async (req, res) => {

})

app.get('/authSucc/:id', (req,res)=>{
    res.send(req.params.id);
})

app.post('/signIn', async(req,res) => {
    const {email, password} = req.body;
    console.log(email,password);
    try{
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    console.log(userCredential," --> Signin successful");
    // res.redirect(`/authSucc/${email}`);
    res.redirect('/');
    } catch(error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode,errorMessage);
    };
    // res.send(userCredential);
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`serving on port ${port}`);
})