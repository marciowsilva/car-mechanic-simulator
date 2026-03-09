// src/events/EventSystem.js - Sistema de eventos especiais e conquistas avançadas

export const SPECIAL_EVENTS = {
    // Eventos sazonais
    christmas: {
        id: 'christmas',
        name: 'Natal na Oficina',
        description: 'Clientes especiais com presentes!',
        icon: '🎄',
        startDate: '12-20',
        endDate: '12-26',
        rewards: {
            money: 5000,
            parts: ['turbo', 'radiador'],
            decoration: 'árvore de natal'
        },
        multipliers: {
            money: 1.5,
            xp: 1.3
        }
    },
    newYear: {
        id: 'newYear',
        name: 'Ano Novo',
        description: 'Promoção de ano novo!',
        icon: '🎆',
        startDate: '12-31',
        endDate: '01-02',
        rewards: {
            money: 3000,
            xp: 2000,
            decoration: 'fogos de artifício'
        },
        multipliers: {
            money: 1.3,
            xp: 1.5
        }
    },
    carnaval: {
        id: 'carnaval',
        name: 'Carnaval',
        description: 'Clientes foliões!',
        icon: '🎭',
        startDate: '02-10',
        endDate: '02-14',
        rewards: {
            money: 2000,
            parts: ['suspensao', 'freios'],
            decoration: 'confetes'
        },
        multipliers: {
            money: 1.2
        }
    },

    // Eventos especiais
    fullMoon: {
        id: 'fullMoon',
        name: 'Lua Cheia',
        description: 'Clientes estranhos aparecem...',
        icon: '🌕',
        condition: 'lua cheia',
        rewards: {
            money: 1000,
            parts: ['bateria', 'alternador'],
            secret: true
        },
        multipliers: {
            xp: 1.2
        }
    },
    meteorShower: {
        id: 'meteorShower',
        name: 'Chuva de Meteoros',
        description: 'Peças raras podem cair do céu!',
        icon: '☄️',
        condition: 'aleatório 1%',
        rewards: {
            money: 5000,
            parts: ['motor', 'transmissao'],
            rare: true
        },
        multipliers: {
            money: 2.0
        }
    },

    // Desafios especiais
    marathon: {
        id: 'marathon',
        name: 'Maratona Mecânica',
        description: 'Complete 5 serviços em 30 minutos',
        icon: '🏃',
        duration: 30,
        target: 5,
        rewards: {
            money: 10000,
            xp: 5000,
            trophy: '🏆 Maratonista'
        }
    },
    perfectionist: {
        id: 'perfectionist',
        name: 'Desafio Perfeccionista',
        description: '3 serviços com 100% de qualidade',
        icon: '✨',
        target: 3,
        rewards: {
            money: 15000,
            xp: 8000,
            trophy: '🏆 Perfeccionista'
        }
    },
    speedDemon: {
        id: 'speedDemon',
        name: 'Demônio da Velocidade',
        description: 'Complete um serviço em menos de 2 minutos',
        icon: '⚡',
        target: 1,
        rewards: {
            money: 20000,
            xp: 10000,
            trophy: '🏆 Speed Demon'
        }
    }
};

export class EventSystem {
    constructor() {
        this.activeEvents = [];
        this.completedEvents = [];
        this.eventProgress = {};
        this.currentMultipliers = {
            money: 1.0,
            xp: 1.0,
            parts: 1.0
        };
        this.checkDailyEvents();
        this.startEventChecker();
    }

    checkDailyEvents() {
        const today = new Date();
        const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Verificar eventos sazonais
        Object.values(SPECIAL_EVENTS).forEach(event => {
            if (event.startDate && event.endDate) {
                if (monthDay >= event.startDate && monthDay <= event.endDate) {
                    this.activateEvent(event);
                }
            }
        });

        // Eventos aleatórios (5% de chance)
        if (Math.random() < 0.05) {
            const randomEvents = ['fullMoon', 'meteorShower'];
            const eventId = randomEvents[Math.floor(Math.random() * randomEvents.length)];
            this.activateEvent(SPECIAL_EVENTS[eventId]);
        }
    }

    startEventChecker() {
        // Verificar a cada hora se novos eventos começaram
        setInterval(() => {
            this.checkDailyEvents();
        }, 3600000);
    }

    activateEvent(event) {
        if (!this.activeEvents.find(e => e.id === event.id)) {
            this.activeEvents.push({
                ...event,
                activatedAt: Date.now()
            });

            // Aplicar multiplicadores
            if (event.multipliers) {
                Object.keys(event.multipliers).forEach(key => {
                    this.currentMultipliers[key] *= event.multipliers[key];
                });
            }

            this.notifyEvent(event);
        }
    }

    deactivateEvent(eventId) {
        const index = this.activeEvents.findIndex(e => e.id === eventId);
        if (index >= 0) {
            const event = this.activeEvents[index];
            
            // Remover multiplicadores
            if (event.multipliers) {
                Object.keys(event.multipliers).forEach(key => {
                    this.currentMultipliers[key] /= event.multipliers[key];
                });
            }

            this.activeEvents.splice(index, 1);
        }
    }

    notifyEvent(event) {
        const notification = document.createElement('div');
        notification.className = 'event-notification';
        notification.innerHTML = `
            <div class="event-icon">${event.icon}</div>
            <div class="event-content">
                <div class="event-title">${event.name}</div>
                <div class="event-desc">${event.description}</div>
                ${event.multipliers ? `
                    <div class="event-multipliers">
                        ${event.multipliers.money ? `💰 +${(event.multipliers.money - 1) * 100}% ` : ''}
                        ${event.multipliers.xp ? `⭐ +${(event.multipliers.xp - 1) * 100}%` : ''}
                    </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 8000);

        // Adicionar estilo
        this.addNotificationStyle();
    }

    addNotificationStyle() {
        if (document.getElementById('event-notification-style')) return;

        const style = document.createElement('style');
        style.id = 'event-notification-style';
        style.textContent = `
            .event-notification {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #ff6b00, #ff8c00);
                color: white;
                padding: 30px;
                border-radius: 15px;
                display: flex;
                align-items: center;
                gap: 20px;
                z-index: 10000;
                opacity: 0;
                transition: all 0.5s ease;
                box-shadow: 0 0 50px rgba(255, 107, 0, 0.5);
                border: 2px solid gold;
                min-width: 400px;
                pointer-events: none;
            }
            
            .event-notification.show {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1.1);
            }
            
            .event-icon {
                font-size: 64px;
            }
            
            .event-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            
            .event-desc {
                font-size: 14px;
                margin-bottom: 10px;
                opacity: 0.9;
            }
            
            .event-multipliers {
                font-size: 16px;
                color: gold;
                font-weight: bold;
            }
            
            @keyframes eventGlow {
                0% { box-shadow: 0 0 50px rgba(255, 215, 0, 0.5); }
                50% { box-shadow: 0 0 80px rgba(255, 215, 0, 0.8); }
                100% { box-shadow: 0 0 50px rgba(255, 215, 0, 0.5); }
            }
        `;

        document.head.appendChild(style);
    }

    // Conquistas especiais
    checkSpecialAchievements() {
        const achievements = [];

        // Verificar conquistas baseadas em eventos
        if (this.activeEvents.length >= 3) {
            achievements.push({
                id: 'partyTime',
                name: 'Tempo de Festa',
                description: '3 eventos ativos simultaneamente',
                icon: '🎉',
                reward: { money: 5000, xp: 2000 }
            });
        }

        // Verificar conquistas de tempo
        const totalPlayTime = this.getTotalPlayTime();
        if (totalPlayTime >= 3600000) { // 1 hora
            achievements.push({
                id: 'dedication',
                name: 'Dedicação',
                description: 'Jogue por 1 hora',
                icon: '⏰',
                reward: { money: 10000, xp: 5000 }
            });
        }

        // Verificar conquistas de clientes
        if (window.customerSystem) {
            const stats = window.customerSystem.getStats();
            if (stats.vipCustomers >= 10) {
                achievements.push({
                    id: 'vipMaster',
                    name: 'Mestre VIP',
                    description: 'Atenda 10 clientes VIP',
                    icon: '👑',
                    reward: { money: 20000, xp: 10000 }
                });
            }
        }

        return achievements;
    }

    getTotalPlayTime() {
        if (!window.gameState) return 0;
        // Implementar lógica de tempo de jogo
        return Date.now() - (window.gameState.startTime || Date.now());
    }

    applyEventBonus(baseValue, type) {
        return Math.floor(baseValue * this.currentMultipliers[type] || baseValue);
    }

    getActiveEvents() {
        return this.activeEvents;
    }

    getEventProgress(eventId) {
        return this.eventProgress[eventId] || 0;
    }

    updateEventProgress(eventId, progress) {
        this.eventProgress[eventId] = (this.eventProgress[eventId] || 0) + progress;

        const event = SPECIAL_EVENTS[eventId];
        if (event && this.eventProgress[eventId] >= event.target) {
            this.completeEvent(eventId);
        }
    }

    completeEvent(eventId) {
        const event = SPECIAL_EVENTS[eventId];
        if (!event || this.completedEvents.includes(eventId)) return;

        this.completedEvents.push(eventId);

        // Dar recompensas
        if (event.rewards && window.gameState) {
            if (event.rewards.money) {
                window.gameState.money += event.rewards.money;
            }
            if (event.rewards.xp) {
                window.gameState.addExperience(event.rewards.xp);
            }
            if (event.rewards.parts && window.inventory) {
                event.rewards.parts.forEach(part => {
                    window.inventory.addPart(part);
                });
            }
        }

        // Notificar
        window.uiManager?.showNotification(
            `🎉 Evento concluído: ${event.name}!`,
            'achievement',
            8000
        );
    }

    getStats() {
        return {
            activeEvents: this.activeEvents.length,
            completedEvents: this.completedEvents.length,
            currentMultipliers: { ...this.currentMultipliers },
            nextEvent: this.getNextEvent()
        };
    }

    getNextEvent() {
        const today = new Date();
        const currentMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        let nextEvent = null;
        let daysUntil = Infinity;

        Object.values(SPECIAL_EVENTS).forEach(event => {
            if (event.startDate && event.endDate) {
                if (event.startDate > currentMonthDay) {
                    const [month, day] = event.startDate.split('-').map(Number);
                    const eventDate = new Date(today.getFullYear(), month - 1, day);
                    const diff = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
                    
                    if (diff < daysUntil) {
                        daysUntil = diff;
                        nextEvent = { ...event, daysUntil };
                    }
                }
            }
        });

        return nextEvent;
    }
}