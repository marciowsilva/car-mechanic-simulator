// src/systems/achievements/AchievementSystem.js — Implementação completa

export class AchievementSystem {
  constructor() {
    this.achievements = this._buildAchievements();
    this.stats = {
      jobsCompleted:  0,
      perfectJobs:    0,
      fastJobs:       0,
      vipCustomers:   0,
      upgradesDone:   0,
      partsBought:    0,
      totalEarned:    0,
    };
    this._load();
  }

  _buildAchievements() {
    return {
      // Serviços
      firstJob:       { id:'firstJob',       name:'Primeiro Serviço',        description:'Complete seu primeiro serviço',              icon:'🔧', category:'service',  reward:{ money:500,   experience:50  }, unlocked:false, hidden:false },
      jobs10:         { id:'jobs10',          name:'Mecânico Dedicado',       description:'Complete 10 serviços',                       icon:'🏁', category:'service',  reward:{ money:1000,  experience:100 }, unlocked:false, hidden:false },
      jobs50:         { id:'jobs50',          name:'Veterano da Oficina',     description:'Complete 50 serviços',                       icon:'🏆', category:'service',  reward:{ money:5000,  experience:500 }, unlocked:false, hidden:false },
      jobs100:        { id:'jobs100',         name:'Mestre Mecânico',         description:'Complete 100 serviços',                      icon:'👑', category:'service',  reward:{ money:15000, experience:1000}, unlocked:false, hidden:false },
      // Qualidade
      perfectJob:     { id:'perfectJob',      name:'Perfeccionista',          description:'Entregue um carro com todas as peças em 100%',icon:'✨', category:'quality',  reward:{ money:2000,  experience:200 }, unlocked:false, hidden:false },
      perfect10:      { id:'perfect10',       name:'Artesão',                 description:'Complete 10 serviços perfeitos',              icon:'💎', category:'quality',  reward:{ money:10000, experience:1000}, unlocked:false, hidden:false },
      // Tempo
      fastJob:        { id:'fastJob',         name:'Relâmpago',               description:'Complete um serviço antes do prazo',          icon:'⚡', category:'time',     reward:{ money:500,   experience:50  }, unlocked:false, hidden:false },
      fastJobs10:     { id:'fastJobs10',      name:'Corredor',                description:'Complete 10 serviços antes do prazo',         icon:'🏎️', category:'time',     reward:{ money:3000,  experience:300 }, unlocked:false, hidden:false },
      // Dinheiro
      earn10k:        { id:'earn10k',         name:'Empreendedor',            description:'Acumule R$ 10.000',                           icon:'💰', category:'money',    reward:{ money:1000,  experience:100 }, unlocked:false, hidden:false },
      earn100k:       { id:'earn100k',        name:'Empresário',              description:'Acumule R$ 100.000',                          icon:'💵', category:'money',    reward:{ money:5000,  experience:500 }, unlocked:false, hidden:false },
      earn1m:         { id:'earn1m',          name:'Milionário',              description:'Acumule R$ 1.000.000',                        icon:'🤑', category:'money',    reward:{ money:50000, experience:2000}, unlocked:false, hidden:false },
      // Clientes
      vipCustomer:    { id:'vipCustomer',     name:'Atendimento VIP',         description:'Atenda um cliente VIP',                       icon:'👔', category:'customer', reward:{ money:2000,  experience:200 }, unlocked:false, hidden:false },
      happyCustomers: { id:'happyCustomers',  name:'Querido dos Clientes',    description:'Receba 5 estrelas 10 vezes',                  icon:'⭐', category:'customer', reward:{ money:3000,  experience:300 }, unlocked:false, hidden:false },
      // Ferramentas
      masterMechanic: { id:'masterMechanic',  name:'Ferramentas Perfeitas',   description:'Faça upgrade de todas as ferramentas ao nível máximo',icon:'🔩',category:'tools',reward:{ money:10000, experience:1000}, unlocked:false, hidden:false },
      // Peças
      parts50:        { id:'parts50',         name:'Comprador Compulsivo',    description:'Compre 50 peças novas',                       icon:'📦', category:'parts',    reward:{ money:2000,  experience:200 }, unlocked:false, hidden:false },
      // Secretas
      nightOwl:       { id:'nightOwl',        name:'Coruja da Mecânica',      description:'???',                                         icon:'🦉', category:'secret',   reward:{ money:5000,  experience:500 }, unlocked:false, hidden:true  },
      jobStarted:     { id:'jobStarted',      name:'Mãos à Obra',             description:'Inicie seu primeiro serviço',                 icon:'🚗', category:'service',  reward:{ money:0,     experience:10  }, unlocked:false, hidden:false },
      moneyEarned:    { id:'moneyEarned',     name:'Primeiro Pagamento',      description:'Receba seu primeiro pagamento',               icon:'💸', category:'money',    reward:{ money:0,     experience:25  }, unlocked:false, hidden:false },
    };
  }

  // ===== API PÚBLICA (usada pelo AchievementsPanel) =====

  getProgress() {
    const all = Object.values(this.achievements);
    const unlocked = all.filter(a => a.unlocked).length;
    const total = all.length;
    return {
      unlocked,
      total,
      percentage: total > 0 ? Math.round(unlocked / total * 100) : 0,
    };
  }

  getStats() {
    return {
      jobsCompleted:  window.gameState?.jobsCompleted  || this.stats.jobsCompleted,
      perfectJobs:    this.stats.perfectJobs,
      fastJobs:       this.stats.fastJobs,
      vipCustomers:   this.stats.vipCustomers,
      upgradesDone:   this.stats.upgradesDone,
      partsBought:    this.stats.partsBought,
    };
  }

  getAllAchievements() {
    return Object.values(this.achievements);
  }

  getAchievementsByCategory(category) {
    return Object.values(this.achievements).filter(a => a.category === category);
  }

  // ===== UNLOCK =====

  checkAchievement(id, value) {
    const ach = this.achievements[id];
    if (!ach || ach.unlocked) return false;

    let shouldUnlock = false;
    const gs = window.gameState;

    switch(id) {
      case 'firstJob':
      case 'jobStarted':    shouldUnlock = true; break;
      case 'moneyEarned':   shouldUnlock = true; break;
      case 'jobs10':        shouldUnlock = (gs?.jobsCompleted || 0) >= 10; break;
      case 'jobs50':        shouldUnlock = (gs?.jobsCompleted || 0) >= 50; break;
      case 'jobs100':       shouldUnlock = (gs?.jobsCompleted || 0) >= 100; break;
      case 'perfectJob':    shouldUnlock = true; this.stats.perfectJobs++; break;
      case 'perfect10':     shouldUnlock = this.stats.perfectJobs >= 10; break;
      case 'fastJob':       shouldUnlock = true; this.stats.fastJobs++; break;
      case 'fastJobs10':    shouldUnlock = this.stats.fastJobs >= 10; break;
      case 'earn10k':       shouldUnlock = (gs?.money || 0) >= 10000; break;
      case 'earn100k':      shouldUnlock = (gs?.money || 0) >= 100000; break;
      case 'earn1m':        shouldUnlock = (gs?.money || 0) >= 1000000; break;
      case 'vipCustomer':   shouldUnlock = true; this.stats.vipCustomers++; break;
      case 'masterMechanic':shouldUnlock = true; this.stats.upgradesDone++; break;
      case 'parts50':       shouldUnlock = this.stats.partsBought >= 50; break;
      case 'nightOwl': {
        const h = new Date().getHours();
        shouldUnlock = h >= 22 || h < 5;
        break;
      }
      default: shouldUnlock = true;
    }

    if (shouldUnlock) {
      this._unlock(ach);
      return true;
    }
    return false;
  }

  checkAchievements() {
    // Verificar conquistas baseadas no estado atual
    const gs = window.gameState;
    if (!gs) return;

    if (gs.jobsCompleted >= 1)   this.checkAchievement('firstJob');
    if (gs.jobsCompleted >= 10)  this.checkAchievement('jobs10');
    if (gs.jobsCompleted >= 50)  this.checkAchievement('jobs50');
    if (gs.jobsCompleted >= 100) this.checkAchievement('jobs100');
    if (gs.money >= 10000)       this.checkAchievement('earn10k');
    if (gs.money >= 100000)      this.checkAchievement('earn100k');
    if (gs.money >= 1000000)     this.checkAchievement('earn1m');
  }

  unlockAchievement(id) {
    this.checkAchievement(id);
  }

  _unlock(ach) {
    ach.unlocked = true;
    ach.unlockedAt = new Date().toISOString();

    // Recompensas
    if (ach.reward?.money && window.gameState) {
      window.gameState.money += ach.reward.money;
      window.gameState.updateMoney?.(0);
    }
    if (ach.reward?.experience && window.gameState) {
      window.gameState.addExperience?.(ach.reward.experience);
    }

    // Notificar painel
    window.uiManager?.achievementsPanel?.showUnlockedNotification?.(ach);
    window.uiManager?.showNotification?.(`🏆 ${ach.name} desbloqueada!`, 'achievement', 5000);

    this._save();
  }

  // ===== PERSISTÊNCIA =====
  _save() {
    try {
      const data = {
        achievements: Object.fromEntries(
          Object.entries(this.achievements).map(([k,v]) => [k, { unlocked: v.unlocked, unlockedAt: v.unlockedAt }])
        ),
        stats: this.stats,
      };
      localStorage.setItem('cms_achievements', JSON.stringify(data));
    } catch(e) {}
  }

  _load() {
    try {
      const raw = localStorage.getItem('cms_achievements');
      if (!raw) return;
      const data = JSON.parse(raw);
      // Restaurar estado de unlock
      Object.entries(data.achievements || {}).forEach(([id, val]) => {
        if (this.achievements[id]) {
          this.achievements[id].unlocked   = val.unlocked   || false;
          this.achievements[id].unlockedAt = val.unlockedAt || null;
        }
      });
      if (data.stats) Object.assign(this.stats, data.stats);
    } catch(e) {}
  }
}

if (typeof window !== 'undefined') window.AchievementSystem = AchievementSystem;
