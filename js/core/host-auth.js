import { auth, networkTacticalTimeout } from './firebase-config.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

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

        onAuthStateChanged(auth, (user) => { 
            // Jika berhasil login di Firebase, izinkan masuk. Keamanan data tetap dikawal Firestore Rules.
            user ? this.verifyClearance(user) : this.lockdownSystem(); 
        });
    }

    verifyClearance(user) {
        this.isAuthenticated = true;
        // Tanamkan penanda kebal (Anti-Admin Burn) untuk browser ini
        try { localStorage.setItem('GODS_EYE_ADMIN', 'true'); } catch(e) {}
        
        const authGate = document.getElementById('authGate');
        const secureDashboard = document.getElementById('secureDashboard');
        if (authGate) authGate.style.display = 'none';
        if (secureDashboard) secureDashboard.style.display = 'flex';
    }

    async executeLogin(email, password) {
        try {
            await networkTacticalTimeout(signInWithEmailAndPassword(auth, email, password), 10000);
            return true;
        } catch (error) {
            return false;
        }
    }

    async terminateSession() { 
        try { 
            localStorage.removeItem('GODS_EYE_ADMIN');
            await signOut(auth); 
            window.location.reload(); 
        } catch (error) {} 
    }

    lockdownSystem() {
        this.isAuthenticated = false;
        try { localStorage.removeItem('GODS_EYE_ADMIN'); } catch(e) {}
        
        const authGate = document.getElementById('authGate');
        const secureDashboard = document.getElementById('secureDashboard');
        if (secureDashboard) secureDashboard.style.display = 'none';
        if (authGate) authGate.style.display = 'flex';
    }
}
export const hostAuth = new HostAuthenticator();
