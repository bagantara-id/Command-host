import { auth } from './firebase-config.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const AUTHORIZED_EMAIL = "ziaalifutaqi145@gmail.com";
const AUTHORIZED_UID = "0iUUK0qANPPcVhPCXjlso6gaGaI3";

export class HostAuthenticator {
    constructor() {
        this.isAuthenticated = false;
        this.monitorAuthState();
    }

    monitorAuthState() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.verifyClearance(user);
            } else {
                this.lockdownSystem();
            }
        });
    }

    verifyClearance(user) {
        if (user.email === AUTHORIZED_EMAIL || user.uid === AUTHORIZED_UID) {
            this.isAuthenticated = true;
            
            // Buka Gembok Secara Visual
            document.getElementById('authGate').style.display = 'none';
            document.getElementById('secureDashboard').style.display = 'flex';
            
            const userDisplay = document.getElementById('adminUserDisplay');
            if (userDisplay) {
                userDisplay.innerText = `AUTHENTICATED: ${user.email}`;
            }
            console.log("[SYSTEM] Otoritas Eksekutif Dikonfirmasi.");
        } else {
            console.warn("[SECURITY] Akses Ditolak. Kredensial tidak valid.");
            this.terminateSession();
        }
    }

    async executeLogin(email, password) {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Tidak butuh window.reload() lagi, onAuthStateChanged otomatis memicu verifyClearance
            return true;
        } catch (error) {
            console.error("[SECURITY] Otentikasi Gagal: ", error.message);
            return false;
        }
    }

    async terminateSession() {
        try {
            await signOut(auth);
            window.location.reload();
        } catch (error) {
            console.error("[SYSTEM] Kesalahan Terminasi: ", error.message);
        }
    }

    lockdownSystem() {
        this.isAuthenticated = false;
        const authGate = document.getElementById('authGate');
        const secureDashboard = document.getElementById('secureDashboard');
        
        // Kunci DOM Utama
        secureDashboard.style.display = 'none';
        authGate.style.display = 'flex';
        
        // Render Form Login ke dalam authGate
        authGate.innerHTML = `
            <h2 style="color:#ff003c; letter-spacing:2px; margin-bottom:24px; text-align:center;">AKSES TERKUNCI // OTORISASI DIBUTUHKAN</h2>
            <div style="width: 320px; display:flex; flex-direction:column; gap: 12px;">
                <input type="email" id="tacticalEmail" placeholder="Email Otoritas" style="padding:12px; background:#090d14; border:1px solid rgba(0, 243, 255, 0.3); color:#00f3ff; outline:none; text-align:center;">
                <input type="password" id="tacticalPass" placeholder="Kata Sandi Kunci" style="padding:12px; background:#090d14; border:1px solid rgba(0, 243, 255, 0.3); color:#00f3ff; outline:none; text-align:center;">
                <button id="btnTacticalLogin" style="padding:12px; background:transparent; border:1px solid #00f3ff; color:#00f3ff; cursor:pointer; font-weight:bold; letter-spacing:1px; margin-top:8px;">DEKRIPSI AKSES</button>
                <div id="loginStatus" style="color:#ff003c; font-size:12px; text-align:center; margin-top:12px; min-height:16px;"></div>
            </div>
        `;

        const btnLogin = document.getElementById('btnTacticalLogin');
        btnLogin.addEventListener('click', async () => {
            const email = document.getElementById('tacticalEmail').value;
            const pass = document.getElementById('tacticalPass').value;
            const status = document.getElementById('loginStatus');
            
            if (!email || !pass) {
                status.innerText = "PARAMETER TIDAK LENGKAP.";
                return;
            }

            btnLogin.innerText = "MEMVERIFIKASI...";
            btnLogin.disabled = true;
            status.innerText = "";

            const success = await this.executeLogin(email, pass);
            if (!success) {
                btnLogin.innerText = "DEKRIPSI AKSES";
                btnLogin.disabled = false;
                status.innerText = "KREDENSIAL DITOLAK.";
            }
        });
    }
}

export const hostAuth = new HostAuthenticator();
