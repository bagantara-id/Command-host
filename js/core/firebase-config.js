import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAW-ovOKFFk2ovFMxzL-2lv0xHxAQTUr0k",
    authDomain: "the-voidforger.firebaseapp.com",
    databaseURL: "https://the-voidforger-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "the-voidforger",
    storageBucket: "the-voidforger.firebasestorage.app",
    messagingSenderId: "90281363893",
    appId: "1:90281363893:web:375db286f77332acdc31fc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const cloudinaryConfig = {
    cloudName: "e0wmrkhy",
    uploadPreset: "secure_chat_media",
    uploadUrl: "https://api.cloudinary.com/v1_1/e0wmrkhy/auto/upload"
};

// UTILITAS ANTI-FREEZE MUTLAK
// Menahan Promise agar tidak menggantung selamanya jika diblokir
const networkTacticalTimeout = (promise, ms = 8000) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("NETWORK_BLOCKED_OR_TIMEOUT")), ms);
    });
    return Promise.race([
        promise.finally(() => clearTimeout(timeoutId)), 
        timeoutPromise
    ]);
};

export { db, auth, cloudinaryConfig, networkTacticalTimeout };
