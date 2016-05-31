/**
 * Created by Brumkorn on 28.05.2016.
 */
import firebase from "firebase";
// Initialize Firebase
let fbConfig = {
  apiKey: "AIzaSyAAxqgNU1XE3Tshw27qDr4JcRsJR-Ju4cM",
  authDomain: "the-handsome-spreadsheets.firebaseapp.com",
  databaseURL: "https://the-handsome-spreadsheets.firebaseio.com",
  storageBucket: "the-handsome-spreadsheets.appspot.com"
};

firebase.initializeApp(fbConfig);