// src/ui/EventsPanel.js - Painel de eventos especiais

export class EventsPanel {
    constructor(eventSystem) {
        this.eventSystem = eventSystem;
        this.isVisible = false;
        this.createPanel();
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'events-panel';
        this.panel.className = 'events-panel';
        this.panel.style.display = 'none';
        
        this.panel.innerHTML = `
            <div class="events-header">
                <h2>📅 EVENTOS ESPECIAIS</h2>
                <button class="close-btn">×</button>
            </div>
            
            <div class="events-multipliers" id="events-multipliers">
                <!-- Multiplicadores ativos -->
            </div>
            
            <div class="events-list" id="active-events">
                <h3>🔥 Ativos Agora</h3>
                <div class="events-grid" id="active-events-grid"></div>
            </div>
            
            <div class="events-list" id="upcoming-events">
                <h3>📅 Próximos Eventos</h3>
                <div class="events-grid" id="upcoming-events-grid"></div>
            </div>
            
            <div class="events-list" id="completed-events">
                <h3>✅ Completados</h3>
                <div class="events-grid" id="completed-events-grid"></div>
            </div>
        `;
        
        document.body.appendChild(this.panel);
        this.addStyles();
        this.initEventListeners();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .events-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 800px;
                max-width: 90%;
                max-height: 80vh;
                background: rgba(30, 30, 30, 0.98);
                border: 2px solid #ff6b00;
                border-radius: 15px;
                color: white;
                z-index: 1000;
                overflow: hidden;
                backdrop-filter: blur(10px);
            }
            
            .events-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background: #1a1a1a;
                border-bottom: 1px solid #ff6b00;
            }
            
            .events-header h2 {
                margin: 0;
                color: #ff6b00;
            }
            
            .events-multipliers {
                display: flex;
                gap: 20px;
                padding: 15px 20px;
                background: #2a2a2a;
                border-bottom: 1px solid #444;
            }
            
            .multiplier-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 15px;
                background: #333;
                border-radius: 20px;
            }
            
            .multiplier-icon {
                font-size: 18px;
            }
            
            .multiplier-value {
                color: #ffd700;
                font-weight: bold;
            }
            
            .events-list {
                padding: 15px 20px;
                border-bottom: 1px solid #444;
            }
            
            .events-list h3 {
                color: #ff6b00;
                margin-bottom: 15px;
                font-size: 16px;
            }
            
            .events-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 15px;
                max-height: 200px;
                overflow-y: auto;
                padding: 5px;
            }
            
            .event-card {
                background: #2a2a2a;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #444;
                transition: all 0.3s;
                position: relative;
                overflow: hidden;
            }
            
            .event-card.active {
                border-color: #ff6b00;
                background: linear-gradient(145deg, #2a2a2a, #332211);
            }
            
            .event-card.completed {
                opacity: 0.6;
                border-color: #4CAF50;
            }
            
            .event-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            }
            
            .event-icon {
                font-size: 32px;
                margin-bottom: 10px;
            }
            
            .event-name {
                font-size: 16px;
                font-weight: bold;
                color: #ff6b00;
                margin-bottom: 5px;
            }
            
            .event-desc {
                font-size: 12px;
                color: #888;
                margin-bottom: 10px;
            }
            
            .event-progress {
                height: 4px;
                background: #444;
                border-radius: 2px;
                overflow: hidden;
                margin: 10px 0;
            }
            
            .event-progress-bar {
                height: 100%;
                background: #ff6b00;
                transition: width 0.3s;
            }
            
            .event-rewards {
                display: flex;
                gap: 10px;
                font-size: 11px;
                color: #ffd700;
                margin-top: 10px;
            }
            
            .event-badge {
                position: absolute;
                top: 10px;
                right: 10px;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: bold;
            }
            
            .badge-active {
                background: #ff6b00;
                color: white;
            }
            
            .badge-soon {
                background: #2196F3;
                color: white;
            }
            
            .badge-days {
                background: #4CAF50;
                color: white;
            }
            
            .days-left {
                font-size: 11px;
                color: #ffd700;
                margin-top: 5px;
            }
        `;
        
        document.head.appendChild(style);
    }

    initEventListeners() {
        this.panel.querySelector('.close-btn').addEventListener('click', () => this.hide());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    show() {
        this.isVisible = true;
        this.panel.style.display = 'block';
        this.update();
    }

    hide() {
        this.isVisible = false;
        this.panel.style.display = 'none';
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    update() {
        this.updateMultipliers();
        this.updateActiveEvents();
        this.updateUpcomingEvents();
        this.updateCompletedEvents();
    }

    updateMultipliers() {
        const multipliers = this.eventSystem.currentMultipliers;
        const container = this.panel.querySelector('#events-multipliers');
        
        container.innerHTML = `
            <div class="multiplier-item">
                <span class="multiplier-icon">💰</span>
                <span>Dinheiro: <span class="multiplier-value">${multipliers.money.toFixed(1)}x</span></span>
            </div>
            <div class="multiplier-item">
                <span class="multiplier-icon">⭐</span>
                <span>XP: <span class="multiplier-value">${multipliers.xp.toFixed(1)}x</span></span>
            </div>
        `;
    }

    updateActiveEvents() {
        const events = this.eventSystem.getActiveEvents();
        const grid = this.panel.querySelector('#active-events-grid');
        
        grid.innerHTML = '';
        
        events.forEach(event => {
            const progress = this.eventSystem.getEventProgress(event.id);
            const target = event.target || 100;
            const progressPercent = (progress / target) * 100;
            
            const card = document.createElement('div');
            card.className = 'event-card active';
            
            card.innerHTML = `
                <div class="event-badge badge-active">🔥 ATIVO</div>
                <div class="event-icon">${event.icon}</div>
                <div class="event-name">${event.name}</div>
                <div class="event-desc">${event.description}</div>
                ${event.target ? `
                    <div class="event-progress">
                        <div class="event-progress-bar" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="event-rewards">
                        Progresso: ${progress}/${target}
                    </div>
                ` : ''}
                <div class="event-rewards">
                    ${event.multipliers ? Object.entries(event.multipliers).map(([k, v]) => 
                        `${k === 'money' ? '💰' : '⭐'} +${(v-1)*100}%`
                    ).join(' ') : ''}
                </div>
            `;
            
            grid.appendChild(card);
        });
        
        if (events.length === 0) {
            grid.innerHTML = '<div class="empty-state">Nenhum evento ativo no momento</div>';
        }
    }

    updateUpcomingEvents() {
        const nextEvent = this.eventSystem.getNextEvent();
        const grid = this.panel.querySelector('#upcoming-events-grid');
        
        grid.innerHTML = '';
        
        if (nextEvent) {
            const card = document.createElement('div');
            card.className = 'event-card';
            
            card.innerHTML = `
                <div class="event-badge badge-days">📅 em ${nextEvent.daysUntil} dias</div>
                <div class="event-icon">${nextEvent.icon}</div>
                <div class="event-name">${nextEvent.name}</div>
                <div class="event-desc">${nextEvent.description}</div>
                <div class="days-left">Começa em ${nextEvent.daysUntil} dias</div>
            `;
            
            grid.appendChild(card);
        } else {
            grid.innerHTML = '<div class="empty-state">Nenhum evento programado</div>';
        }
    }

    updateCompletedEvents() {
        const completed = this.eventSystem.completedEvents;
        const grid = this.panel.querySelector('#completed-events-grid');
        
        grid.innerHTML = '';
        
        completed.forEach(eventId => {
            const event = SPECIAL_EVENTS[eventId];
            if (!event) return;
            
            const card = document.createElement('div');
            card.className = 'event-card completed';
            
            card.innerHTML = `
                <div class="event-icon">${event.icon}</div>
                <div class="event-name">${event.name}</div>
                <div class="event-desc">${event.description}</div>
                <div class="event-rewards">
                    ✅ Completado
                </div>
            `;
            
            grid.appendChild(card);
        });
        
        if (completed.length === 0) {
            grid.innerHTML = '<div class="empty-state">Nenhum evento completado</div>';
        }
    }
}