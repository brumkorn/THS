import SheetEditor from "main/sheet-editor.js";
import { fbConfig } from "services/firebase-app.config.js";
// Initialize Firebase

firebase.initializeApp(fbConfig);

new SheetEditor();