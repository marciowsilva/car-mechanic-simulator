// audio.js - Sistema de áudio completo

export class AudioManager {
    constructor() {
        this.sounds = {};
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.currentMusic = null;
        this.init();
    }

    init() {
        // Criar elementos de áudio
        this.sounds = {
            // Ferramentas
            wrench: this.createSound('🔧', 0.3, 'square'),
            screwdriver: this.createSound('🪛', 0.2, 'sine'),
            hammer: this.createSound('🔨', 0.5, 'triangle'),
            welder: this.createSound('⚡', 0.4, 'sawtooth'),
            
            // Eventos
            success: this.createSound('✅', 0.3, 'sine', 0.2),
            error: this.createSound('❌', 0.3, 'sawtooth', 0.1),
            money: this.createSound('💰', 0.3, 'square', 0.15),
            newJob: this.createSound('🚗', 0.3, 'sine', 0.25),
            deliver: this.createSound('🏁', 0.4, 'triangle', 0.3),
            
            // UI
            click: this.createSound('👆', 0.1, 'sine', 0.05),
            upgrade: this.createSound('⬆️', 0.3, 'square', 0.2),
            achievement: this.createSound('🏆', 0.4, 'sawtooth', 0.3)
        };
    }

    createSound(type, volume = 0.3, waveType = 'sine', duration = 0.1) {
        return { type, volume, waveType, duration };
    }

    playSound(soundName) {
        if (!this.sfxEnabled) return;
        
        const sound = this.sounds[soundName];
        if (!sound) return;

        try {
            // Usar Web Audio API para sons sintéticos
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = sound.waveType;
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            gainNode.gain.setValueAtTime(sound.volume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + sound.duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + sound.duration);
        } catch (e) {
            console.log('Áudio não suportado:', e);
        }
    }

    playMusic(type = 'garage') {
        if (!this.musicEnabled) return;
        
        // Nota: Para música real, você precisaria de arquivos MP3
        // Por enquanto, vamos simular com uma nota sustentada
        console.log('🎵 Música ambiente:', type);
    }

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic = null;
        }
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (!this.musicEnabled) {
            this.stopMusic();
        } else {
            this.playMusic();
        }
        return this.musicEnabled;
    }

    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        return this.sfxEnabled;
    }
}
// Expor globalmente
if (typeof window !== 'undefined') {
    window.AudioManager = AudioManager;
    console.log('🌐 AudioManager disponível globalmente');
}
