import { hostAuth } from './core/host-auth.js';
import { keyGenerator } from './modules/key-generator.js';
import { tacticalChat } from './modules/tactical-chat.js';
import { mediaTransmitter } from './modules/media-drm.js';
import { db } from './core/firebase-config.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const btnGenerateKey = document.getElementById('btnGenerateKey');
    const guestDomainInput = document.getElementById('guestDomainInput');
    const ttlInput = document.getElementById('ttlInput');
    const urlInput = document.getElementById('generatedUrlInput');
    
    // Semua Sakelar
    const redProtocolToggle = document.getElementById('redProtocolToggle');
    const geoTrackerToggle = document.getElementById('geoTrackerToggle');
    const burnDisconnectToggle = document.getElementById('burnDisconnectToggle');
    const stealthBlackoutToggle = document.getElementById('stealthBlackoutToggle');
    const devToolsExecutionerToggle = document.getElementById('devToolsExecutionerToggle');
    
    const btnKillSwitch = document.getElementById('btnKillSwitch');
    const btnThemeAdmin = document.getElementById('btnThemeAdmin');
    
    const btnAttachAdmin = document.getElementById('btnAttachAdmin');
    const adminMediaUpload = document.getElementById('adminMediaUpload');
    const adminUploadOverlay = document.getElementById('adminUploadOverlay');
    const btnPhantomLock = document.getElementById('btnPhantomLock');
    const btnVoiceNoteAdmin = document.getElementById('btnVoiceNoteAdmin');
    
    // Saraf Input Pesan Baru
    const btnSendMessage = document.getElementById('btnSendMessage');
    const chatMessageInput = document.getElementById('chatMessageInput');

    // KOREKSI MUTLAK: Mengembalikan path repositori Klien Anda agar tidak 404
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        if(guestDomainInput) guestDomainInput.value = 'http://localhost:8080'; 
    } else {
        if(guestDomainInput) guestDomainInput.value = 'https://bagantara-id.github.io/secure-comms';
    }

    if (btnThemeAdmin) {
        btnThemeAdmin.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            if (currentTheme === 'light') document.body.removeAttribute('data-theme');
            else document.body.setAttribute('data-theme', 'light');
        });
    }

    // FUNGSI SARAF REAL-TIME: Mengirim perintah Override ke Klien secara Instan
    const syncDRMState = async () => {
        if (!tacticalChat.currentRoomId) return; 
        const sessionRef = doc(db, "access_keys", tacticalChat.currentRoomId);
        try {
            await updateDoc(sessionRef, {
                "drm.redStrike": redProtocolToggle.checked,
                "drm.allowManualGPS": geoTrackerToggle.checked,
                "drm.burnOnClose": burnDisconnectToggle.checked,
                "drm.stealthBlackout": stealthBlackoutToggle.checked,
                "drm.devToolsExecutioner": devToolsExecutionerToggle.checked
            });
            console.log("[GOD'S EYE] Saraf DRM berhasil diperbarui ke sisi klien.");
        } catch (e) {
            console.error("[ANOMALI] Gagal mengirim sinyal saraf:", e);
        }
    };

    // Pasang alat penyadap pada setiap sakelar
    [redProtocolToggle, geoTrackerToggle, burnDisconnectToggle, stealthBlackoutToggle, devToolsExecutionerToggle].forEach(toggle => {
        if(toggle) toggle.addEventListener('change', syncDRMState);
    });

    if (btnGenerateKey) {
        btnGenerateKey.addEventListener('click', async () => {
            if (!hostAuth.isAuthenticated) { alert("Akses ditolak. Selesaikan otentikasi."); return; }

            const targetDomain = guestDomainInput.value.trim();
            const ttlMinutes = parseInt(ttlInput.value);

            if (!targetDomain || isNaN(ttlMinutes) || ttlMinutes <= 0) { alert("Parameter Domain dan TTL wajib valid."); return; }

            btnGenerateKey.innerText = "MEMPROSES...";
            btnGenerateKey.disabled = true;

            try {
                // Pengumpulan Data Sakelar Saat Inisiasi Sesi
                const drmSettings = {
                    redStrike: redProtocolToggle.checked, 
                    allowManualGPS: geoTrackerToggle.checked, 
                    burnOnClose: burnDisconnectToggle.checked,
                    stealthBlackout: stealthBlackoutToggle.checked,
                    devToolsExecutioner: devToolsExecutionerToggle.checked
                };

                const sessionData = await keyGenerator.generateSecureSession(targetDomain, ttlMinutes, drmSettings);
                urlInput.value = sessionData.url;
                tacticalChat.initialize(sessionData.roomId);
            } catch (error) {
                urlInput.value = `GAGAL: ${error.code || error.message}`;
                alert(`DIAGNOSIS SISTEM:\n${error.message}`);
            } finally {
                btnGenerateKey.innerText = "Eksekusi Enkripsi Sesi";
                btnGenerateKey.disabled = false;
            }
        });
    }

    // Pemusatan Logika Input Teks & Tombol Kirim
    if (btnSendMessage && chatMessageInput) {
        const executeSend = () => {
            const text = chatMessageInput.value.trim();
            if (text && tacticalChat.currentRoomId) { 
                tacticalChat.sendMessage(text); 
                chatMessageInput.value = ''; 
            }
        };
        btnSendMessage.addEventListener('click', executeSend);
        chatMessageInput.addEventListener('keypress', (e) => { 
            if (e.key === 'Enter') executeSend(); 
        });
    }

    // Pemusatan Logika Kill-Switch Tanpa Kloning Node
    if (btnKillSwitch) {
        btnKillSwitch.addEventListener('click', () => {
            if (!hostAuth.isAuthenticated || !tacticalChat.currentRoomId) return;
            if (confirm("PERINGATAN: Sesi dan seluruh data perangkat akan dihancurkan seketika. Lanjutkan?")) {
                tacticalChat.executeKillSwitch();
            }
        });
    }

    if (btnPhantomLock) {
        btnPhantomLock.addEventListener('click', () => {
            if (!tacticalChat.currentRoomId) return;
            tacticalChat.togglePhantomLock(btnPhantomLock);
        });
    }

    if (btnAttachAdmin && adminMediaUpload) {
        btnAttachAdmin.addEventListener('click', () => {
            if (!hostAuth.isAuthenticated) return;
            if (!tacticalChat.currentRoomId) { alert("Buat sesi enkripsi terlebih dahulu sebelum mengirim media."); return; }
            adminMediaUpload.click();
        });

        adminMediaUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            adminUploadOverlay.style.display = 'flex';
            try {
                const secureMediaUrl = await mediaTransmitter.uploadSecurePayload(file);
                await tacticalChat.sendMessage("[MEDIA DIKIRIM]", secureMediaUrl, false, "TEXT");
            } catch (error) {
                alert("GAGAL MENTRANSMISIKAN MEDIA: " + error.message);
            } finally {
                adminUploadOverlay.style.display = 'none';
                adminMediaUpload.value = '';
            }
        });
    }

    if (btnVoiceNoteAdmin) {
        let mediaRecorder;
        let audioChunks = [];
        let isRecording = false;
        let recordStartTime = 0;

        const startAdminRecording = async (e) => {
            if (isRecording) return;
            isRecording = true;
            recordStartTime = Date.now();

            if (!hostAuth.isAuthenticated) { isRecording = false; return; }
            if (!tacticalChat.currentRoomId) { isRecording = false; alert("Buat sesi terlebih dahulu."); return; }
            
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                
                mediaRecorder.ondataavailable = event => { if (event.data.size > 0) audioChunks.push(event.data); };
                mediaRecorder.onstop = async () => {
                    const duration = Date.now() - recordStartTime;
                    stream.getTracks().forEach(track => track.stop());

                    if (duration < 800) {
                        console.log("[SISTEM] Rekaman batal. Durasi terlalu singkat.");
                        return;
                    }

                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const audioFile = new File([audioBlob], `Admin_VN_${Date.now()}.webm`, { type: 'audio/webm' });
                    
                    adminUploadOverlay.style.display = 'flex';
                    try {
                        const secureUrl = await mediaTransmitter.uploadSecurePayload(audioFile);
                        await tacticalChat.sendMessage("[VOICE NOTE]", secureUrl, false, "AUDIO");
                    } catch (err) {
                        alert("Gagal mengirim Voice Note.");
                    } finally {
                        adminUploadOverlay.style.display = 'none';
                    }
                };
                
                mediaRecorder.start();
                tacticalChat.qAudio.playMechClick(); 
                btnVoiceNoteAdmin.classList.add('recording-pulse-admin');
            } catch (err) {
                isRecording = false;
                alert("Izin mikrofon ditolak oleh sistem.");
            }
        };

        const stopAdminRecording = (e) => {
            if (!isRecording) return;
            isRecording = false;
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                tacticalChat.qAudio.playMechClick();
                btnVoiceNoteAdmin.classList.remove('recording-pulse-admin');
            }
        };

        btnVoiceNoteAdmin.addEventListener('pointerdown', startAdminRecording);
        window.addEventListener('pointerup', stopAdminRecording);
        window.addEventListener('pointercancel', stopAdminRecording);
    }
});
