import { db, networkTacticalTimeout } from '../core/firebase-config.js';
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

export class KeyGenerator {
    generateTacticalID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        const array = new Uint32Array(4);
        crypto.getRandomValues(array);
        return array.join('-').substring(0, 36);
    }

    async generateSecureSession(targetDomain, ttlMinutes, drmSettings) {
        try {
            const roomId = this.generateTacticalID();
            const expiryTime = Date.now() + (ttlMinutes * 60 * 1000);
            const sessionRef = doc(db, "access_keys", roomId);
            
            await networkTacticalTimeout(setDoc(sessionRef, {
                createdAt: serverTimestamp(),
                expiresAt: expiryTime,
                isActive: true,
                fingerprint: null,
                drm: drmSettings
            }), 10000);

            const cleanDomain = targetDomain.endsWith('/') ? targetDomain.slice(0, -1) : targetDomain;
            
            // TAKTIK HASH HIJACK: Menggunakan /# menggantikan /?session=
            // Ini menjamin ID sesi buta terhadap pencatat riwayat browser.
            const guestUrl = `${cleanDomain}/#${roomId}`;
            
            return { roomId, url: guestUrl };
        } catch (error) {
            console.error("[SISTEM] Kegagalan enkripsi sesi:", error.message);
            throw error;
        }
    }
}

export const keyGenerator = new KeyGenerator();
