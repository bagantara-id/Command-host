import { db, networkTacticalTimeout } from '../core/firebase-config.js';
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

export class KeyGenerator {
    generateTacticalID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        console.warn("[SISTEM] Kriptografi Native diblokir. Menggunakan algoritma fallback...");
        // Perbaikan: Kriptografi taktis, tidak lagi menggunakan Math.random yang rentan
        const array = new Uint32Array(4);
        crypto.getRandomValues(array);
        return array.join('-').substring(0, 36);
    }

    async generateSecureSession(targetDomain, ttlMinutes, drmSettings) {
        try {
            const roomId = this.generateTacticalID();
            
            // Perhitungan waktu kadaluwarsa murni untuk UI Klien.
            // Kedaluwarsa sejati dikunci secara absolut oleh ServerTimestamp di Firebase Rules.
            const expiryTime = Date.now() + (ttlMinutes * 60 * 1000);
            
            const sessionRef = doc(db, "access_keys", roomId);
            
            // Perbaikan: Eksekusi Tulis dengan Pembatas Waktu (Anti-Freeze)
            await networkTacticalTimeout(setDoc(sessionRef, {
                createdAt: serverTimestamp(),
                expiresAt: expiryTime,
                isActive: true,
                fingerprint: null,
                drm: drmSettings // Menyuntikkan Opsi: redStrike, requireGPS, dll
            }), 10000);

            // KOREKSI MUTLAK: Menghapus index.html agar routing bekerja sempurna (Siluman)
            const cleanDomain = targetDomain.endsWith('/') ? targetDomain.slice(0, -1) : targetDomain;
            const guestUrl = `${cleanDomain}/?session=${roomId}`;
            
            console.log("[SISTEM] Sesi eksklusif diamankan dengan parameter taktis.");
            
            return { roomId, url: guestUrl };
        } catch (error) {
            console.error("[SISTEM] Kegagalan enkripsi sesi:", error.message);
            throw error;
        }
    }
}

export const keyGenerator = new KeyGenerator();
