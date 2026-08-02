import { cloudinaryConfig } from '../core/firebase-config.js';

export class MediaTransmitter {
    constructor() {
        this.uploadUrl = cloudinaryConfig.uploadUrl;
        this.uploadPreset = cloudinaryConfig.uploadPreset;
        this.cloudName = cloudinaryConfig.cloudName;
    }

    async uploadSecurePayload(file) {
        if (!file) {
            console.error("[ANOMALI] Upaya transmisi tanpa payload terdeteksi.");
            throw new Error("Payload kosong.");
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', this.uploadPreset);

        console.log("[SISTEM] Menginisiasi enkripsi dan transmisi payload media ke Node eksternal...");

        try {
            // PERBAIKAN MUTLAK: Pembatas waktu (AbortController) untuk mencegah Panel Admin membeku saat jaringan putus
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 detik batas waktu maksimal

            const response = await fetch(this.uploadUrl, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId); // Bersihkan bom waktu jika fetch berhasil

            if (!response.ok) {
                throw new Error(`Integritas jaringan terkompromi. Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("[SISTEM] Payload berhasil diamankan. URL enkripsi diterbitkan.");
            return data.secure_url;

        } catch (error) {
            let errorMsg = error.message;
            if (error.name === 'AbortError') {
                errorMsg = "Koneksi terputus tiba-tiba atau waktu tunggu habis (15 detik).";
            }
            console.error("[ANOMALI] Kegagalan transmisi payload absolut:", errorMsg);
            throw new Error(errorMsg);
        }
    }
}

export const mediaTransmitter = new MediaTransmitter();
