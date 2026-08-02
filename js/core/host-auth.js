import { auth } from './firebase-config.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const AUTHORIZED_EMAIL = "ziaalifutaqi145@gmail.com";
const AUTHORIZED_UID = "0iUUK0qANPPcVhPCXjlso6gaGaI3";

export class HostAuthenticator {
    constructor() {
        this.isAuthenticated = false;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.monitorAuthState());
        } else {
            this.monitorAuthState();
        }
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
            
            const authGate = document.getElementById('authGate');
            const secureDashboard = document.getElementById('secureDashboard');
            if (authGate && secureDashboard) {
                authGate.style.display = 'none';
                secureDashboard.style.display = 'flex';
            }
            
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
            return true;
        } catch (error) {
            return false;
        }
    }

    async terminateSession() {
        try {
            await signOut(auth);
            window.location.reload();
        } catch (error) {}
    }

    lockdownSystem() {
        this.isAuthenticated = false;
        const authGate = document.getElementById('authGate');
        const secureDashboard = document.getElementById('secureDashboard');
        if (!authGate || !secureDashboard) return;
        
        secureDashboard.style.display = 'none';
        authGate.style.display = 'flex';
        
        authGate.innerHTML = `
            <div style="background: rgba(12, 16, 24, 0.9); padding: 30px; border-radius: 12px; border: 1px solid rgba(0, 243, 255, 0.3); box-shadow: 0 10px 30px rgba(0,0,0,0.8); display: flex; flex-direction: column; align-items: center;">
                <h2 style="color:#ff003c; letter-spacing:2px; margin-bottom:24px; text-align:center; font-family: monospace;">AKSES TERKUNCI</h2>
                <div style="width: 300px; display:flex; flex-direction:column; gap: 14px;">
                    <input type="email" id="tacticalEmail" placeholder="Email Otoritas" style="padding:14px; background:#000; border:1px solid rgba(0, 243, 255, 0.3); color:#00f3ff; outline:none; text-align:center; font-family: monospace; border-radius: 6px;">
                    <input type="password" id="tacticalPass" placeholder="Kata Sandi Kunci" style="padding:14px; background:#000; border:1px solid rgba(0, 243, 255, 0.3); color:#00f3ff; outline:none; text-align:center; font-family: monospace; border-radius: 6px;">
                    <button id="btnTacticalLogin" style="padding:14px; background: rgba(0, 243, 255, 0.1); border:1px solid #00f3ff; color:#00f3ff; cursor:pointer; font-weight:bold; letter-spacing:1px; margin-top:8px; border-radius: 6px; font-family: monospace; transition: all 0.2s;">DEKRIPSI AKSES</button>
                    <div id="loginStatus" style="color:#ff003c; font-size:12px; text-align:center; margin-top:12px; min-height:16px; font-family: monospace;"></div>
                </div>
            </div>
        `;

        const btnLogin = document.getElementById('btnTacticalLogin');
        if (btnLogin) {
            btnLogin.addEventListener('click', async () => {
                const email = document.getElementById('tacticalEmail').value.trim();
                const pass = document.getElementById('tacticalPass').value.trim();
                const status = document.getElementById('loginStatus');
                
                if (!email || !pass) {
                    status.innerText = "PARAMETER TIDAK LENGKAP.";
                    return;
                }

                btnLogin.innerText = "MEMVERIFIKASI...";
                btnLogin.disabled = true;
                btnLogin.style.opacity = "0.5";
                status.innerText = "";

                const success = await this.executeLogin(email, pass);
                if (!success) {
                    btnLogin.innerText = "DEKRIPSI AKSES";
                    btnLogin.disabled = false;
                    btnLogin.style.opacity = "1";
                    status.innerText = "KREDENSIAL DITOLAK.";
                }
            });
        }
    }
}

export const hostAuth = new HostAuthenticator();
