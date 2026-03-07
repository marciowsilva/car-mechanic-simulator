// src/systems/SoundSystem.js - Sistema de áudio

export class SoundSystem {
    constructor() {
        this.enabled = true;
        this.volume = 0.5;
        this.sounds = {};
        this.music = null;
        this.init();
    }

    init() {
        // Verificar suporte a áudio
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Carregar sons (usando Web Audio API para sons sintéticos)
        this.createSounds();
    }

    createSounds() {
        // Sons sintéticos para não depender de arquivos
        this.sounds = {
            click: this.createClickSound(),
            repair: this.createRepairSound(),
            money: this.createMoneySound(),
            success: this.createSuccessSound(),
            error: this.createErrorSound(),
            upgrade: this.createUpgradeSound(),
            unlock: this.createUnlockSound()
        };
    }

    createClickSound() {
        return (volume = this.volume) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = 800;
            
            gain.gain.value = volume * 0.1;
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.1);
        };
    }

    createRepairSound() {
        return (volume = this.volume) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.value = 200;
            osc.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.2);
            
            gain.gain.value = volume * 0.2;
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.3);
        };
    }

    createMoneySound() {
        return (volume = this.volume) => {
            const now = this.audioContext.currentTime;
            
            for (let i = 0; i < 3; i++) {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = 600 + i * 100;
                
                gain.gain.value = volume * 0.1;
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + i * 0.05);
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.start(now + i * 0.05);
                osc.stop(now + 0.15 + i * 0.05);
            }
        };
    }

    createSuccessSound() {
        return (volume = this.volume) => {
            const now = this.audioContext.currentTime;
            
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = 600;
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
            
            gain.gain.value = volume * 0.2;
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.start();
            osc.stop(now + 0.3);
        };
    }

    createErrorSound() {
        return (volume = this.volume) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.value = 200;
            osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
            
            gain.gain.value = volume * 0.2;
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.2);
        };
    }

    createUpgradeSound() {
        return (volume = this.volume) => {
            const now = this.audioContext.currentTime;
            
            for (let i = 0; i < 5; i++) {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'triangle';
                osc.frequency.value = 400 + i * 150;
                
                gain.gain.value = volume * 0.15;
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + i * 0.05);
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.start(now + i * 0.05);
                osc.stop(now + 0.15 + i * 0.05);
            }
        };
    }

    createUnlockSound() {
        return (volume = this.volume) => {
            const now = this.audioContext.currentTime;
            
            // Fanfarra simples
            const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00];
            
            notes.forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                gain.gain.value = volume * 0.1;
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + i * 0.1);
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.start(now + i * 0.1);
                osc.stop(now + 0.2 + i * 0.1);
            });
        };
    }

    play(soundName) {
        if (!this.enabled) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            try {
                sound();
            } catch (e) {
                console.warn('Erro ao reproduzir som:', e);
            }
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
    }
}