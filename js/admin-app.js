import { hostAuth } from './core/host-auth.js';
import { keyGenerator } from './modules/key-generator.js';
import { tacticalChat } from './modules/tactical-chat.js';
import { mediaTransmitter } from './modules/media-drm.js';

document.addEventListener('DOMContentLoaded', () => {
    const btnGenerateKey = document.getElementById('btnGenerateKey');
    const guestDomainInput = document.getElementById('guestDomainInput');
    const ttlInput = document.getElementById('ttlInput');
    const urlInput = document.getElementById('generatedUrlInput');
    
    const redProtocolToggle = document.getElementById('redProtocolToggle');
    const geoTrackerToggle = document.getElementById('geoTrackerToggle');
    const burnDisconnectToggle = document.getElementById('burnDisconnectToggle');
    
    const btnKillSwitch = document.getElementById('btnKillSwitch');
    const btnThemeAdmin = document.getElementById('btnThemeAdmin');
    
    const btnAttachAdmin = document.getElementById('btnAttachAdmin');
    const adminMediaUpload = document.getElementById('adminMediaUpload');
    const adminUploadOverlay = document.getElementById('adminUploadOverlay');
    const btnPhantomLock = document.getElementById('btnPhantomLock');
    const btnVoiceNoteAdmin = document.getElementById('btnVoiceNoteAdmin');

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

    if (btnGenerateKey) {
        btnGenerateKey.addEventListener('click', async () => {
            if (!hostAuth.isAuthenticated) { alert("Akses ditolak. Selesaikan otentikasi."); return; }

            const targetDomain = guestDomainInput.value.trim();
            const ttlMinutes = parseInt(ttlInput.value);

            if (!targetDomain || isNaN(ttlMinutes) || ttlMinutes <= 0) { alert("Parameter Domain dan TTL wajib valid."); return; }

            btnGenerateKey.innerText = "MEMPROSES...";
            btnGenerateKey.disabled = true;

            try {
                const drmSettings = {
                    redStrike: redProtocolToggle.checked, 
                    allowManualGPS: geoTrackerToggle.checked, 
                    burnOnClose: burnDisconnectToggle.checked 
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

    if (btnKillSwitch) {
        btnKillSwitch.addEventListener('click', () => {
            if (!hostAuth.isAuthenticated) return;
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

        const startAdminRecording = async (e) => {
            e.preventDefault(); 
            if (!hostAuth.isAuthenticated) return;
            if (!tacticalChat.currentRoomId) { alert("Buat sesi terlebih dahulu."); return; }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                
                mediaRecorder.ondataavailable = event => { if (event.data.size > 0) audioChunks.push(event.data); };
                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    stream.getTracks().forEach(track => track.stop());
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
                alert("Izin mikrofon ditolak oleh sistem.");
            }
        };

        const stopAdminRecording = () => {
            // PERBAIKAN MUTLAK: Tidak ada e.preventDefault() di sini agar tidak memblokir input login
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                tacticalChat.qAudio.playMechClick();
                btnVoiceNoteAdmin.classList.remove('recording-pulse-admin');
            }
        };

        btnVoiceNoteAdmin.addEventListener('mousedown', startAdminRecording);
        window.addEventListener('mouseup', stopAdminRecording);
        btnVoiceNoteAdmin.addEventListener('touchstart', startAdminRecording, {passive: false});
        window.addEventListener('touchend', stopAdminRecording);
    }
});
