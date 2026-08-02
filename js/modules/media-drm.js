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
            const response = await fetch(this.uploadUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Integritas jaringan terkompromi. Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("[SISTEM] Payload berhasil diamankan. URL enkripsi diterbitkan.");
            return data.secure_url;

        } catch (error) {
            console.error("[ANOMALI] Kegagalan transmisi payload absolut:", error.message);
            throw error;
        }
    }
}

export const mediaTransmitter = new MediaTransmitter();
