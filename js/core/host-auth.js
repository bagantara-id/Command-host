import { auth, networkTacticalTimeout } from './firebase-config.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const AUTHORIZED_EMAIL = "ziaalifutaqi145@gmail.com";
const AUTHORIZED_UID = "0iUUK0qANPPcVhPCXjlso6gaGaI3";

export class HostAuthenticator {
    constructor() {
        this.isAuthenticated = false;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initAuthListeners());
        } else {
            this.initAuthListeners();
        }
    }

    initAuthListeners() {
        const btnLogin = document.getElementById('btnTacticalLogin');
        const emailInput = document.getElementById('tacticalEmail');
        const passInput = document.getElementById('tacticalPass');
        const status = document.getElementById('loginStatus');

        if (btnLogin) {
            const triggerLogin = async () => {
                const email = emailInput ? emailInput.value.trim() : "";
                const pass = passInput ? passInput.value.trim() : "";
                
                if (!email || !pass) { if (status) status.innerText = "PARAMETER TIDAK LENGKAP."; return; }

                btnLogin.innerText = "MEMVERIFIKASI...";
                btnLogin.disabled = true;
                btnLogin.style.opacity = "0.5";
                if (status) status.innerText = "";

                const success = await this.executeLogin(email, pass);
                if (!success) {
                    btnLogin.innerText = "DEKRIPSI AKSES";
                    btnLogin.disabled = false;
                    btnLogin.style.opacity = "1";
                    if (status) status.innerText = "KREDENSIAL DITOLAK ATAU JARINGAN DIBLOKIR.";
                }
            };

            btnLogin.addEventListener('click', triggerLogin);
            if (passInput) passInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') triggerLogin(); });
            if (emailInput) emailInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') triggerLogin(); });
        }

        onAuthStateChanged(auth, (user) => { user ? this.verifyClearance(user) : this.lockdownSystem(); });
    }

    verifyClearance(user) {
        if (user.email === AUTHORIZED_EMAIL || user.uid === AUTHORIZED_UID) {
            this.isAuthenticated = true;
            const authGate = document.getElementById('authGate');
            const secureDashboard = document.getElementById('secureDashboard');
            if (authGate) authGate.style.display = 'none';
            if (secureDashboard) secureDashboard.style.display = 'flex';
        } else {
            this.terminateSession();
        }
    }

    async executeLogin(email, password) {
        try {
            // PERBAIKAN MUTLAK: Eksekusi dibungkus Timeout 10 Detik
            await networkTacticalTimeout(signInWithEmailAndPassword(auth, email, password), 10000);
            return true;
        } catch (error) {
            return false;
        }
    }

    async terminateSession() { try { await signOut(auth); window.location.reload(); } catch (error) {} }

    lockdownSystem() {
        this.isAuthenticated = false;
        const authGate = document.getElementById('authGate');
        const secureDashboard = document.getElementById('secureDashboard');
        if (secureDashboard) secureDashboard.style.display = 'none';
        if (authGate) authGate.style.display = 'flex';
    }
}
export const hostAuth = new HostAuthenticator();
