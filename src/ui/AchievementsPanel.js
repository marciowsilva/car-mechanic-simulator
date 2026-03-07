// src/ui/AchievementsPanel.js - Painel de conquistas

export class AchievementsPanel {
    constructor(achievementSystem) {
        this.achievementSystem = achievementSystem;
        this.isVisible = false;
        this.currentCategory = 'all';
        this.createPanel();
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'achievements-panel';
        this.panel.className = 'achievements-panel';
        this.panel.style.display = 'none';
        
        this.panel.innerHTML = `
            <div class="achievements-header">
                <h2>🏆 CONQUISTAS</h2>
                <div class="header-stats">
                    <span class="progress" id="achievement-progress">0/0 (0%)</span>
                    <button class="close-btn">×</button>
                </div>
            </div>
            
            <div class="achievements-categories">
                <button class="category-btn active" data-category="all">Todas</button>
                <button class="category-btn" data-category="service">🚗 Serviços</button>
                <button class="category-btn" data-category="money">💰 Dinheiro</button>
                <button class="category-btn" data-category="quality">✨ Qualidade</button>
                <button class="category-btn" data-category="customer">👥 Clientes</button>
                <button class="category-btn" data-category="tools">🔧 Ferramentas</button>
                <button class="category-btn" data-category="parts">🛒 Peças</button>
                <button class="category-btn" data-category="time">⏰ Tempo</button>
                <button class="category-btn" data-category="secret">🕵️ Secretas</button>
            </div>
            
            <div class="achievements-stats" id="achievements-stats">
                <!-- Estatísticas serão inseridas aqui -->
            </div>
            
            <div class="achievements-grid" id="achievements-grid">
                <!-- Conquistas serão inseridas aqui -->
            </div>
        `;
        
        document.body.appendChild(this.panel);
        this.addStyles();
        this.initEventListeners();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .achievements-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 900px;
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
            
            .achievements-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background: #1a1a1a;
                border-bottom: 1px solid #ff6b00;
            }
            
            .achievements-header h2 {
                margin: 0;
                color: #ff6b00;
            }
            
            .header-stats {
                display: flex;
                align-items: center;
                gap: 20px;
            }
            
            .header-stats .progress {
                color: #ffd700;
                font-weight: bold;
            }
            
            .close-btn {
                background: none;
                border: none;
                color: #888;
                font-size: 24px;
                cursor: pointer;
                padding: 0 10px;
                transition: color 0.3s;
            }
            
            .close-btn:hover {
                color: #ff6b00;
            }
            
            .achievements-categories {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                padding: 15px 20px;
                background: #222;
                border-bottom: 1px solid #444;
            }
            
            .category-btn {
                padding: 6px 12px;
                background: #333;
                color: white;
                border: none;
                border-radius: 15px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.3s;
            }
            
            .category-btn:hover {
                background: #444;
            }
            
            .category-btn.active {
                background: #ff6b00;
                color: white;
            }
            
            .achievements-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                padding: 15px;
                background: #2a2a2a;
                border-bottom: 1px solid #444;
            }
            
            .stat-card {
                text-align: center;
                padding: 10px;
                background: #333;
                border-radius: 5px;
            }
            
            .stat-card .value {
                font-size: 20px;
                font-weight: bold;
                color: #ff6b00;
            }
            
            .stat-card .label {
                font-size: 11px;
                color: #888;
                margin-top: 5px;
            }
            
            .achievements-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 15px;
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .achievement-card {
                background: #2a2a2a;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #444;
                transition: all 0.3s;
                position: relative;
            }
            
            .achievement-card.unlocked {
                border-color: gold;
                background: #2a2a2a;
            }
            
            .achievement-card.hidden {
                opacity: 0.5;
            }
            
            .achievement-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            }
            
            .achievement-icon {
                font-size: 32px;
                margin-bottom: 10px;
            }
            
            .achievement-name {
                font-size: 16px;
                font-weight: bold;
                color: #ff6b00;
                margin-bottom: 5px;
            }
            
            .achievement-desc {
                font-size: 12px;
                color: #888;
                margin-bottom: 10px;
            }
            
            .achievement-reward {
                display: flex;
                gap: 10px;
                font-size: 11px;
                color: #ffd700;
                margin-bottom: 10px;
            }
            
            .achievement-status {
                font-size: 12px;
                padding: 4px 8px;
                border-radius: 12px;
                display: inline-block;
            }
            
            .status-unlocked {
                background: #4CAF50;
                color: white;
            }
            
            .status-locked {
                background: #666;
                color: white;
            }
            
            .secret-badge {
                position: absolute;
                top: 10px;
                right: 10px;
                background: gold;
                color: black;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: bold;
            }
            
            .recent-unlocked {
                margin-top: 5px;
                font-size: 10px;
                color: #4CAF50;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
        `;
        
        document.head.appendChild(style);
    }

    initEventListeners() {
        // Fechar
        const closeBtn = this.panel.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
        
        // Categorias
        const categoryBtns = this.panel.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.currentCategory = btn.dataset.category;
                this.update();
            });
        });
        
        // ESC
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
        this.updateProgress();
        this.updateStats();
        this.updateAchievements();
    }

    updateProgress() {
        const progress = this.achievementSystem.getProgress();
        const progressEl = this.panel.querySelector('#achievement-progress');
        if (progressEl) {
            progressEl.textContent = `${progress.unlocked}/${progress.total} (${progress.percentage}%)`;
        }
    }

    updateStats() {
        const stats = this.achievementSystem.getStats();
        const statsEl = this.panel.querySelector('#achievements-stats');
        
        statsEl.innerHTML = `
            <div class="stat-card">
                <div class="value">${stats.jobsCompleted}</div>
                <div class="label">Serviços</div>
            </div>
            <div class="stat-card">
                <div class="value">${stats.perfectJobs}</div>
                <div class="label">Perfeitos</div>
            </div>
            <div class="stat-card">
                <div class="value">${stats.vipCustomers}</div>
                <div class="label">VIPs</div>
            </div>
            <div class="stat-card">
                <div class="value">${stats.upgradesDone}</div>
                <div class="label">Upgrades</div>
            </div>
            <div class="stat-card">
                <div class="value">${stats.partsBought}</div>
                <div class="label">Peças</div>
            </div>
            <div class="stat-card">
                <div class="value">${stats.fastJobs}</div>
                <div class="label">Rápidos</div>
            </div>
        `;
    }

    updateAchievements() {
        const grid = this.panel.querySelector('#achievements-grid');
        const achievements = this.currentCategory === 'all' 
            ? this.achievementSystem.getAllAchievements()
            : this.achievementSystem.getAchievementsByCategory(this.currentCategory);
        
        grid.innerHTML = '';
        
        achievements.forEach(ach => {
            const card = document.createElement('div');
            card.className = `achievement-card ${ach.unlocked ? 'unlocked' : ''} ${ach.hidden && !ach.unlocked ? 'hidden' : ''}`;
            
            let statusHtml = '';
            if (ach.unlocked) {
                statusHtml = '<span class="achievement-status status-unlocked">✅ Desbloqueada</span>';
            } else {
                statusHtml = '<span class="achievement-status status-locked">🔒 Bloqueada</span>';
            }
            
            let secretHtml = '';
            if (ach.secret && !ach.unlocked) {
                secretHtml = '<div class="secret-badge">🔮 Secreta</div>';
            } else if (ach.secret && ach.unlocked) {
                secretHtml = `<div class="secret-badge">✨ ${ach.secret}</div>`;
            }
            
            card.innerHTML = `
                ${secretHtml}
                <div class="achievement-icon">${ach.icon}</div>
                <div class="achievement-name">${ach.name}</div>
                <div class="achievement-desc">${ach.description}</div>
                <div class="achievement-reward">
                    ${ach.reward.money ? `💰 ${ach.reward.money}` : ''}
                    ${ach.reward.experience ? ` ⭐ ${ach.reward.experience} XP` : ''}
                </div>
                ${statusHtml}
            `;
            
            grid.appendChild(card);
        });
    }

    showUnlockedNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-notif-icon">${achievement.icon}</div>
            <div class="achievement-notif-content">
                <div class="achievement-notif-title">🏆 Conquista Desbloqueada!</div>
                <div class="achievement-notif-name">${achievement.name}</div>
                <div class="achievement-notif-reward">
                    ${achievement.reward.money ? `💰 +${achievement.reward.money}` : ''}
                    ${achievement.reward.experience ? ` ⭐ +${achievement.reward.experience} XP` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Adicionar estilo
        const style = document.createElement('style');
        style.textContent = `
            .achievement-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 300px;
                background: linear-gradient(135deg, #ff6b00, #ff8c00);
                color: white;
                padding: 15px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                gap: 15px;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                z-index: 2000;
                box-shadow: 0 0 20px rgba(0,0,0,0.5);
                border-left: 4px solid gold;
            }
            
            .achievement-notification.show {
                transform: translateX(0);
            }
            
            .achievement-notif-icon {
                font-size: 32px;
            }
            
            .achievement-notif-title {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .achievement-notif-name {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .achievement-notif-reward {
                font-size: 12px;
                color: gold;
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Expor globalmente
if (typeof window !== 'undefined') {
    window.AchievementsPanel = AchievementsPanel;
}