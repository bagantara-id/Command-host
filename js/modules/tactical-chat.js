import { db, networkTacticalTimeout } from '../core/firebase-config.js';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, setDoc, getDocs, writeBatch, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

class QuantumAudio {
    constructor() { 
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = AudioContext ? new AudioContext() : null;
        } catch(e) { this.ctx = null; }
    }
    _playTone(freq, type, duration, vol, fadeOut) {
        if (!this.ctx) return;
        try {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + fadeOut);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch(e) {}
    }
    playDroplet() { this._playTone(880, 'sine', 0.15, 0.03, 0.1); }
    playSonar() { this._playTone(2000, 'sine', 0.1, 0.1, 0.1); setTimeout(()=>this._playTone(600, 'triangle', 0.6, 0.2, 0.2), 150); }
    playMechClick() { this._playTone(1200, 'sine', 0.05, 0.02, 0.04); }
    playAlarm() { this._playTone(150, 'square', 0.4, 0.05, 0.3); }
}

const qAudioAdmin = new QuantumAudio();
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', () => { 
        if(qAudioAdmin.ctx && qAudioAdmin.ctx.state === 'suspended') qAudioAdmin.ctx.resume(); 
    }, {once: true});
});

window.forceDownload = async (url, btnElement) => {
    try {
        btnElement.innerText = "⏳ MEMPROSES...";
        btnElement.style.opacity = "0.7";
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = `Intel_Media_${Date.now()}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
        
        qAudioAdmin.playMechClick();
        btnElement.innerText = "☑ TERUNDUH";
        btnElement.style.background = "rgba(0, 243, 255, 0.1)";
        btnElement.style.opacity = "1";
    } catch (e) {
        btnElement.innerText = "❌ GAGAL";
        alert("Gagal mengunduh file.");
    }
};

export class TacticalChat {
    constructor() {
        this.currentRoomId = null;
        this.unsubscribeChat = null;
        this.unsubscribeTelemetry = null;
        this.radarContext = null; 
        this.radarAnimationId = null;
        this.radarAngle = 0;
        this.targetCoords = null;
        this.isLocked = false;
        this.qAudio = qAudioAdmin; 
    }

    initialize(roomId) {
        if (this.currentRoomId) this.terminate();
        this.currentRoomId = roomId;
        this.isLocked = false;
        
        const canvas = document.getElementById('radarCanvas');
        if (canvas) {
            this.radarContext = canvas.getContext('2d');
            const observer = new IntersectionObserver((entries) => {
                if(entries[0].isIntersecting) {
                    this.animateRadar();
                    observer.disconnect();
                }
            });
            observer.observe(canvas);
        }
        
        const btnLock = document.getElementById('btnPhantomLock');
        if(btnLock) { btnLock.innerText = "🔓"; btnLock.style.background = "transparent"; btnLock.style.color = "#ff003c"; }

        this.startChatStream();
        this.startRadarTelemetry();
    }

    async togglePhantomLock(btnElement) {
        this.isLocked = !this.isLocked;
        try {
            await networkTacticalTimeout(setDoc(doc(db, "sessions", this.currentRoomId), { isLocked: this.isLocked }, { merge: true }), 5000);
            if (this.isLocked) {
                btnElement.innerText = "🔒";
                btnElement.style.background = "rgba(255, 0, 60, 0.2)";
            } else {
                btnElement.innerText = "🔓";
                btnElement.style.background = "transparent";
            }
        } catch (error) {
            this.isLocked = !this.isLocked; 
        }
    }

    startChatStream() {
        const q = query(collection(db, `sessions/${this.currentRoomId}/messages`), orderBy("timestamp", "asc"));
        const stream = document.getElementById('chatStream');
        if(stream) stream.innerHTML = ""; 

        this.unsubscribeChat = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const data = change.doc.data();
                    if (data.type === "PING") this.qAudio.playMechClick();
                    else if (data.type === "GPS_BEACON") this.qAudio.playSonar();
                    else {
                        if (data.sender === "GUEST") this.qAudio.playDroplet();
                        this.renderMessage(change.doc.id, data);
                    }
                }
                if (change.type === "removed") {
                    const msgEl = document.getElementById(`msg-${change.doc.id}`);
                    if (msgEl) {
                        msgEl.innerHTML = `<strong style="font-size: 10px; opacity: 0.5;">[ TRANSMISI DITARIK / DIHAPUS ]</strong>`;
                        msgEl.style.background = "transparent";
                        msgEl.style.border = "1px dashed var(--accent-danger)";
                        msgEl.style.color = "var(--accent-danger)";
                        msgEl.style.boxShadow = "none";
                    }
                }
            });
        });
    }

    async sendMessage(text, mediaUrl = null, drmActive = false, type = "TEXT") {
        if (!this.currentRoomId) return;
        try {
            await networkTacticalTimeout(addDoc(collection(db, `sessions/${this.currentRoomId}/messages`), { 
                sender: "ADMIN", text: text, media: mediaUrl, drm: drmActive, timestamp: serverTimestamp(), type: type 
            }), 8000);
            this.qAudio.playMechClick();
        } catch(e) {
            alert("Sistem gagal mengirim. Timeout jaringan.");
        }
    }

    async deleteMessage(msgId) {
        if (!this.currentRoomId || !msgId) return;
        try { 
            await networkTacticalTimeout(deleteDoc(doc(db, `sessions/${this.currentRoomId}/messages`, msgId)), 5000); 
        } catch (error) {}
    }

    renderMessage(msgId, data) {
        const stream = document.getElementById('chatStream');
        if(!stream) return;
        const msgDiv = document.createElement('div');
        msgDiv.id = `msg-${msgId}`;
        msgDiv.style.padding = "10px 14px";
        msgDiv.style.borderRadius = "12px";
        msgDiv.style.maxWidth = "85%";
        msgDiv.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
        msgDiv.style.marginBottom = "8px";
        msgDiv.style.position = "relative";
        
        const rawSender = data.sender || "UNKNOWN";
        const safeSender = rawSender.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag]));
        
        let content = `<strong style="font-size: 10px; opacity: 0.8; display: block; margin-bottom: 6px;">${safeSender}</strong>`;

        if (data.sender === "ADMIN") {
            msgDiv.className = "msg-bubble-admin"; 
            msgDiv.style.alignSelf = "flex-end";
            msgDiv.style.background = "var(--accent-main)";
            msgDiv.style.color = "#000";
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = "btn-delete-msg";
            deleteBtn.innerText = "TARIK";
            deleteBtn.onclick = () => this.deleteMessage(msgId);
            msgDiv.appendChild(deleteBtn);
        } else {
            msgDiv.style.alignSelf = "flex-start";
            msgDiv.style.background = "var(--surface)";
            msgDiv.style.border = "1px solid var(--border-color)";
            msgDiv.style.color = "var(--text-main)";
        }
        
        if (data.text && data.text !== "[MEDIA DIKIRIM]" && data.text !== "[VOICE NOTE]") {
            const safeText = data.text.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag]));
            content += `<span style="font-size: 13px;">${safeText}</span>`;
        }

        if (data.media) {
            if (data.type === "AUDIO") {
                content += `
                <div style="margin-top: 8px;">
                    <audio controls style="height: 35px; width: 220px; outline: none; border-radius: 20px;">
                        <source src="${data.media}" type="audio/webm">
                    </audio>
                </div>`;
            } else {
                const btnColor = data.sender === 'ADMIN' ? '#000' : 'var(--accent-cyan)';
                content += `
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                    <div style="background: rgba(0,0,0,0.5); border-radius: 8px; padding: 4px; pointer-events: none; user-select: none; -webkit-touch-callout: none;">
                        <img src="${data.media}" style="width: 100%; border-radius: 4px; display: block;" alt="Media">
                    </div>
                    <button onclick="forceDownload('${data.media}', this)" style="align-self: flex-end; background: transparent; border: 1px dashed ${btnColor}; color: ${btnColor}; padding: 6px 12px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer; transition: all 0.3s;">[ UNDUH MEDIA ]</button>
                </div>`;
            }
        }
        
        const contentWrapper = document.createElement('div');
        contentWrapper.innerHTML = content;
        msgDiv.appendChild(contentWrapper);
        stream.appendChild(msgDiv);
        stream.scrollTop = stream.scrollHeight;
    }

    startRadarTelemetry() {
        this.unsubscribeTelemetry = onSnapshot(doc(db, `sessions/${this.currentRoomId}/telemetry/data`), (docSnap) => {
            const display = document.getElementById('targetGeoDisplay');
            const btnCopyGeo = document.getElementById('btnCopyGeo');
            if(!display) return;

            if (docSnap.exists()) {
                const data = docSnap.data();
                const ip = data.ip || "SILUMAN";
                const isp = data.isp || "JARINGAN ANONIM";
                const device = data.userAgent ? this.parseDevice(data.userAgent) : "TIDAK DIKETAHUI";
                let geoText = "MENUNGGU PELANGGAN...";
                let rawCoords = "";
                
                if (data.lat && data.lng) {
                    this.targetCoords = { lat: data.lat, lng: data.lng };
                    geoText = `${data.lat}, ${data.lng} (Akurasi: ${Math.round(data.accuracy)}m)`;
                    rawCoords = `${data.lat}, ${data.lng}`;
                } else { this.targetCoords = null; }

                const status = data.alert || "TERKONEKSI AMAN";
                display.value = `[IP/ISP]  : ${ip} (${isp})\n[DIVAIS]  : ${device}\n[GPS/GEO] : ${geoText}\n[STATUS]  : ${status}`;
                
                if (btnCopyGeo && rawCoords) {
                    btnCopyGeo.onclick = () => { navigator.clipboard.writeText(rawCoords); btnCopyGeo.innerText = "DISALIN"; setTimeout(()=>btnCopyGeo.innerText="SALIN KOORDINAT", 1500); };
                }

                if (status.includes("TERPUTUS") || status.includes("DIHANCURKAN")) {
                    display.style.color = "#ff003c";
                    display.style.borderColor = "#ff003c";
                    display.style.background = "rgba(255,0,60,0.1)";
                    this.qAudio.playAlarm();
                } else if (status !== "TERKONEKSI AMAN") {
                    display.style.color = "#ff003c";
                    display.style.borderColor = "#ff003c";
                } else {
                    display.style.color = "var(--text-main)";
                    display.style.borderColor = "var(--border-color)";
                    display.style.background = "rgba(0,0,0,0.1)";
                }
            } else {
                display.value = "[ TARGET DIHANCURKAN / SESI KOSONG ]";
                display.style.color = "#ff003c";
                display.style.background = "rgba(255,0,60,0.1)";
            }
        });
    }

    parseDevice(ua) {
        if (/iphone/i.test(ua)) return "Apple iPhone";
        if (/ipad/i.test(ua)) return "Apple iPad";
        if (/android/i.test(ua)) { const match = ua.match(/Android.*?; (.*?) Build/); return match ? `Android (${match[1]})` : "Android"; }
        if (/windows/i.test(ua)) return "Windows PC";
        if (/mac/i.test(ua)) return "Mac OS";
        return "Perangkat Tidak Dikenali";
    }

    animateRadar() {
        if (!this.radarContext || !this.currentRoomId) return;
        const ctx = this.radarContext;
        const width = ctx.canvas.width = ctx.canvas.parentElement.clientWidth || 200;
        const height = ctx.canvas.height = ctx.canvas.parentElement.clientHeight || 200;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        const draw = () => {
            if (!this.currentRoomId) return;
            const style = getComputedStyle(document.body);
            const accentMain = style.getPropertyValue('--accent-main').trim() || '#00f3ff';
            const accentDanger = style.getPropertyValue('--accent-danger').trim() || '#ff003c';

            ctx.clearRect(0, 0, width, height);
            ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.strokeStyle = accentMain; ctx.globalAlpha = 0.3; ctx.stroke();

            const x = centerX + radius * Math.cos(this.radarAngle);
            const y = centerY + radius * Math.sin(this.radarAngle);
            ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(x, y); ctx.strokeStyle = accentMain; ctx.globalAlpha = 1.0; ctx.lineWidth = 2; ctx.stroke();

            if (this.targetCoords) {
                ctx.beginPath(); ctx.arc(centerX + 40, centerY - 30, 4, 0, Math.PI * 2); ctx.fillStyle = accentDanger; ctx.fill();
                ctx.shadowBlur = 10; ctx.shadowColor = accentDanger;
            } else { ctx.shadowBlur = 0; }

            this.radarAngle += 0.05;
            this.radarAnimationId = requestAnimationFrame(draw);
        };
        draw();
    }

    async executeKillSwitch() {
        if (!this.currentRoomId) return;
        const roomId = this.currentRoomId;
        this.qAudio.playAlarm();

        try {
            // LANGKAH 1: DETONATOR INSTAN (BUMI HANGUS KLIEN)
            // Menembakkan sinyal 'detonated: true' seketika tanpa menghapus data terlebih dahulu
            const keyRef = doc(db, "access_keys", roomId);
            await networkTacticalTimeout(updateDoc(keyRef, { detonated: true }), 3000);

            // LANGKAH 2: SAPU BERSIH LATAR BELAKANG
            // Klien sudah mati. Sekarang bersihkan pangkalan data tanpa memblokir UI Admin.
            const messagesRef = collection(db, `sessions/${roomId}/messages`);
            const messagesSnap = await networkTacticalTimeout(getDocs(messagesRef), 5000);
            const batch1 = writeBatch(db);
            messagesSnap.forEach((docSnap) => batch1.delete(docSnap.ref));
            await networkTacticalTimeout(batch1.commit(), 5000);

            const telemetryRef = collection(db, `sessions/${roomId}/telemetry`);
            const telemetrySnap = await networkTacticalTimeout(getDocs(telemetryRef), 5000);
            const batch2 = writeBatch(db);
            telemetrySnap.forEach((docSnap) => batch2.delete(docSnap.ref));
            await networkTacticalTimeout(batch2.commit(), 5000);

            await networkTacticalTimeout(deleteDoc(doc(db, "sessions", roomId)), 5000);
            await networkTacticalTimeout(deleteDoc(keyRef), 5000); // Cabut akar dokumen

        } catch (e) {
            console.error("[KILL-SWITCH] Eksekusi darurat fallback:", e);
            // Fallback mematikan sesi jika update gagal
            try { await deleteDoc(doc(db, "access_keys", roomId)); } catch(err) {}
        }

        this.terminate();
        const urlInput = document.getElementById('generatedUrlInput');
        if(urlInput) urlInput.value = "SESI DIHANCURKAN PERMANEN.";
    }

    terminate() {
        if (this.unsubscribeChat) this.unsubscribeChat();
        if (this.unsubscribeTelemetry) this.unsubscribeTelemetry();
        if (this.radarAnimationId) cancelAnimationFrame(this.radarAnimationId);
        this.currentRoomId = null;
        this.targetCoords = null;
        if (this.radarContext) {
            const ctx = this.radarContext;
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        const display = document.getElementById('targetGeoDisplay');
        if (display) display.value = "Sesi diakhiri.";
    }
}
export const tacticalChat = new TacticalChat();
