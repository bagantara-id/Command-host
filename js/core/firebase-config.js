import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Konfigurasi Infrastruktur Utama
const firebaseConfig = {
    apiKey: "AIzaSyAW-ovOKFFk2ovFMxzL-2lv0xHxAQTUr0k",
    authDomain: "the-voidforger.firebaseapp.com",
    databaseURL: "https://the-voidforger-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "the-voidforger",
    storageBucket: "the-voidforger.firebasestorage.app",
    messagingSenderId: "90281363893",
    appId: "1:90281363893:web:375db286f77332acdc31fc"
};

// Konfigurasi Penyimpanan Media Terenkripsi (Cloudinary)
export const cloudinaryConfig = {
    cloudName: "e0wmrkhy",
    uploadPreset: "secure_chat_media",
    uploadUrl: "https://api.cloudinary.com/v1_1/e0wmrkhy/auto/upload"
};

// Inisialisasi Layanan
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
