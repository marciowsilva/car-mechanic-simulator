// src/systems/AnimationSystem.js - Sistema de animações

export class AnimationSystem {
    constructor() {
        this.animations = new Map();
        this.frameId = null;
        this.lastTime = performance.now();
    }

    start() {
        if (this.frameId) return;
        
        const animate = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;

            // Atualizar todas as animações ativas
            this.animations.forEach((animation, id) => {
                if (animation.active) {
                    animation.progress += deltaTime / animation.duration;
                    
                    if (animation.progress >= 1) {
                        animation.progress = 1;
                        animation.active = false;
                        animation.onComplete?.();
                    }

                    // Calcular valor interpolado
                    const value = this.ease(
                        animation.from,
                        animation.to,
                        animation.progress,
                        animation.easing
                    );
                    
                    animation.onUpdate(value);
                }
            });

            // Limpar animações concluídas
            this.animations.forEach((animation, id) => {
                if (!animation.active) {
                    this.animations.delete(id);
                }
            });

            this.frameId = requestAnimationFrame(animate);
        };

        this.frameId = requestAnimationFrame(animate);
    }

    stop() {
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
    }

    add(id, options) {
        const {
            from = 0,
            to = 1,
            duration = 1000,
            easing = 'linear',
            onUpdate = () => {},
            onComplete = null
        } = options;

        this.animations.set(id, {
            from,
            to,
            duration,
            easing,
            onUpdate,
            onComplete,
            progress: 0,
            active: true
        });

        this.start();
    }

    remove(id) {
        this.animations.delete(id);
    }

    ease(from, to, progress, type) {
        const t = progress;
        
        switch(type) {
            case 'linear':
                return from + (to - from) * t;
                
            case 'quadraticIn':
                return from + (to - from) * t * t;
                
            case 'quadraticOut':
                return from + (to - from) * (t * (2 - t));
                
            case 'cubicIn':
                return from + (to - from) * t * t * t;
                
            case 'cubicOut':
                return from + (to - from) * ((t - 1) * (t - 1) * (t - 1) + 1);
                
            case 'bounce':
                const bounce = (t) => {
                    if (t < 0.3636) return 7.5625 * t * t;
                    if (t < 0.7272) return 7.5625 * (t - 0.5454) * (t - 0.5454) + 0.75;
                    if (t < 0.909) return 7.5625 * (t - 0.8181) * (t - 0.8181) + 0.9375;
                    return 7.5625 * (t - 0.9545) * (t - 0.9545) + 0.984375;
                };
                return from + (to - from) * bounce(t);
                
            case 'elastic':
                const elastic = (t) => {
                    const p = 0.3;
                    const s = p / 4;
                    return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
                };
                return from + (to - from) * elastic(t);
                
            default:
                return from + (to - from) * t;
        }
    }

    // Métodos de utilidade
    fadeIn(element, duration = 300, onComplete = null) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        this.add(`fade_${Date.now()}`, {
            from: 0,
            to: 1,
            duration,
            onUpdate: (value) => {
                element.style.opacity = value;
            },
            onComplete
        });
    }

    fadeOut(element, duration = 300, onComplete = null) {
        this.add(`fade_${Date.now()}`, {
            from: 1,
            to: 0,
            duration,
            onUpdate: (value) => {
                element.style.opacity = value;
            },
            onComplete: () => {
                element.style.display = 'none';
                onComplete?.();
            }
        });
    }

    slideIn(element, direction = 'left', duration = 300, onComplete = null) {
        const start = direction === 'left' ? '-100px' : '100px';
        element.style.transform = `translateX(${start})`;
        element.style.opacity = '0';
        element.style.display = 'block';
        
        this.add(`slide_${Date.now()}`, {
            from: 0,
            to: 1,
            duration,
            onUpdate: (value) => {
                element.style.transform = `translateX(${(1 - value) * 100}px)`;
                element.style.opacity = value;
            },
            onComplete
        });
    }

    pulse(element, scale = 1.1, duration = 200) {
        const originalScale = element.style.transform || 'scale(1)';
        
        this.add(`pulse_${Date.now()}`, {
            from: 1,
            to: scale,
            duration: duration / 2,
            onUpdate: (value) => {
                element.style.transform = `scale(${value})`;
            },
            onComplete: () => {
                this.add(`pulse_return_${Date.now()}`, {
                    from: scale,
                    to: 1,
                    duration: duration / 2,
                    onUpdate: (value) => {
                        element.style.transform = `scale(${value})`;
                    },
                    onComplete: () => {
                        element.style.transform = originalScale;
                    }
                });
            }
        });
    }

    shake(element, intensity = 5, duration = 200) {
        const startX = 0;
        let count = 0;
        const maxShakes = 6;
        
        const shakeStep = () => {
            if (count >= maxShakes) {
                element.style.transform = 'translateX(0)';
                return;
            }
            
            const direction = count % 2 === 0 ? 1 : -1;
            element.style.transform = `translateX(${direction * intensity}px)`;
            
            count++;
            setTimeout(shakeStep, duration / maxShakes);
        };
        
        shakeStep();
    }
}