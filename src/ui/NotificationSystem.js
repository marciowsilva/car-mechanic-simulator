// src/ui/NotificationSystem.js - Sistema avançado de notificações (CORRIGIDO)

export class NotificationSystem {
    constructor() {
        this.container = this.createContainer();
        this.notifications = [];
        this.maxNotifications = 5;
    }

    createContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        return container;
    }

    show(message, type = 'info', duration = 3000) {
        const notification = this.createNotification(message, type, duration); // ← PASSA duration como parâmetro
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);

        // Remover após duração
        setTimeout(() => {
            this.remove(notification);
        }, duration);

        return notification;
    }

    createNotification(message, type, duration) { // ← RECEBE duration como parâmetro
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Configurar estilos base
        notification.style.cssText = `
            transform: translateX(400px);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            min-width: 300px;
            max-width: 400px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 12px;
            backdrop-filter: blur(5px);
            border-left: 4px solid;
            pointer-events: auto;
            cursor: pointer;
        `;

        // Configurar cores por tipo
        const colors = {
            success: { bg: '#4CAF50', border: '#45a049' },
            error: { bg: '#f44336', border: '#d32f2f' },
            warning: { bg: '#ff9800', border: '#f57c00' },
            info: { bg: '#2196F3', border: '#1976D2' },
            achievement: { bg: '#ff6b00', border: '#ff8c00' },
            money: { bg: '#4CAF50', border: '#45a049' }
        };

        const color = colors[type] || colors.info;
        notification.style.backgroundColor = color.bg;
        notification.style.borderLeftColor = color.border;

        // Ícones por tipo
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            achievement: '🏆',
            money: '💰'
        };

        const icon = icons[type] || '📌';

        // Calcular segundos para mostrar no timer
        const seconds = Math.floor(duration / 1000);

        notification.innerHTML = `
            <span style="font-size: 20px;">${icon}</span>
            <span style="flex: 1;">${message}</span>
            <span style="font-size: 12px; opacity: 0.7;">${seconds}s</span>
        `;

        // Remover ao clicar
        notification.addEventListener('click', () => this.remove(notification));

        return notification;
    }

    remove(notification) {
        notification.style.transform = 'translateX(400px)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications = this.notifications.filter(n => n !== notification);
        }, 300);
    }

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 3500) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }

    achievement(message, duration = 5000) {
        return this.show(message, 'achievement', duration);
    }

    money(message, duration = 3000) {
        return this.show(message, 'money', duration);
    }

    clear() {
        this.notifications.forEach(n => this.remove(n));
    }
}