import firebase from "firebase";


import SheetEditor from "main/sheet-editor.class.js";
import { fbConfig } from "services/firebase-app.config.js";
// Initialize Firebase

firebase.initializeApp(fbConfig);

new SheetEditor();