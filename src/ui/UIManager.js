// src/ui/UIManager.js - Versão completa e corrigida

import { UpgradeManager } from "/src/systems/UpgradeManager.js";
import { UpgradePanel } from "/src/ui/UpgradePanel.js";
import { CustomersPanel } from "/src/ui/CustomersPanel.js";
import { NotificationSystem } from "/src/ui/NotificationSystem.js";
import { SoundSystem } from "/src/systems/SoundSystem.js";
import { TooltipSystem } from "/src/ui/TooltipSystem.js";
import { AnimationSystem } from "/src/systems/AnimationSystem.js";
import { GarageManager } from "/src/garage/GarageManager.js";
import { GarageUpgradePanel } from "/src/ui/GarageUpgradePanel.js";
import { EquipmentInteractionSystem } from "/src/systems/EquipmentInteractionSystem.js";
import { EquipmentPanel } from "/src/ui/EquipmentPanel.js";

export class UIManager {
  constructor() {
    this.elements = {};
    this.notificationTimeout = null;
    this.parts = [];
    this.challengesInterval = null;
    this.marketInterval = null;
    this.tournamentInterval = null;

    this.cacheElements();
    this.initEventListeners();
    this.loadSystems();
    this.updateAllDisplays();
    this.initTooltips();
    this._timerInterval = null;
    this.jobHistory = this._loadHistory();

    setInterval(() => this.updateTimer(), 1000);
  }

  // ===== SISTEMA DE CACHE DE ELEMENTOS =====
  cacheElements() {
    const elementosIds = [
      // Painéis principais
      "game-container",
      "ui-overlay",
      "top-panel",
      "tool-panel",
      "car-parts-panel",
      "bottom-panel",
      "interaction-info",

      // Estatísticas
      "money",
      "level",
      "reputation",
      "jobs-completed",

      // Informações de serviço
      "job-info",
      "parts-list",

      // Botões
      "new-job",
      "deliver-car",
      "upgrade-shop-btn",
      "inventory-btn",
      "customers-btn",
      "shop-btn",
      "achievements-btn",
      "garage-upgrade-btn",

      // Áudio
      "toggle-music",
      "toggle-sfx",

      // Notificações
      "notification",

      // Loading
      "loading-screen",
      "loading-progress",
      "loading-tip",
    ];

    elementosIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        this.elements[id] = el;
      } else {
        this.elements[id] = this.createFallbackElement(id);
      }
    });
  }

  createFallbackElement(id) {
    return {
      id: id,
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false,
      },
      textContent: "",
      innerHTML: "",
      addEventListener: () => {},
      removeEventListener: () => {},
      disabled: false,
      dataset: {},
    };
  }

  getElement(id) {
    return this.elements[id] || this.createFallbackElement(id);
  }

  // ===== SISTEMA DE TOOLTIPS =====
  initTooltips() {
    setTimeout(() => {
      const tooltips = [
        {
          selector: "#new-job",
          content: "🚗 Iniciar um novo serviço com um cliente",
        },
        {
          selector: "#deliver-car",
          content:
            "✅ Entregar o carro quando todos os reparos estiverem prontos",
        },
        {
          selector: "#upgrade-shop-btn",
          content: "🛠️ Melhorar suas ferramentas e garagem",
        },
        {
          selector: "#inventory-btn",
          content: "📦 Gerenciar seu estoque de peças",
        },
        {
          selector: "#customers-btn",
          content: "👥 Ver lista de clientes e estatísticas",
        },
        { selector: "#shop-btn", content: "🛒 Comprar peças novas e raras" },
        {
          selector: "#achievements-btn",
          content: "🏆 Ver suas conquistas e progresso",
        },
        {
          selector: "#garage-upgrade-btn",
          content: "🏢 Expandir sua garagem com novos equipamentos",
        },
      ];

      tooltips.forEach(({ selector, content }) => {
        const el = document.querySelector(selector);
        if (el && this.tooltips) {
          this.tooltips.attach(el, content, { delay: 500, position: "top" });
        }
      });

      document.querySelectorAll(".tool-item").forEach((tool) => {
        const toolId = tool.dataset.tool;
        const toolNames = {
          wrench: "🔧 Chave Inglesa - Reparo básico",
          screwdriver: "🪛 Chave de Fenda - Reparo preciso",
          hammer: "🔨 Martelo - Reparo pesado",
          welder: "⚡ Maçarico - Reparo avançado",
          diagnostic: "📊 Diagnóstico - Inspecionar problemas",
        };

        if (this.tooltips) {
          this.tooltips.attach(tool, toolNames[toolId] || "Ferramenta", {
            delay: 300,
          });
        }
      });
    }, 2000);
  }

  // ===== CARREGAMENTO DE SISTEMAS =====
  async loadSystems() {
    try {
      // 1. Sistemas de UI (sempre primeiros)
      this.notifications = new NotificationSystem();
      this.sounds = new SoundSystem();
      this.tooltips = new TooltipSystem();
      this.animations = new AnimationSystem();

      // 2. ACHIEVEMENT SYSTEM (CARREGAR PRIMEIRO)
      try {
        const achievementModule =
          await import("/src/systems/AchievementSystem.js");
        const AchievementSystem =
          achievementModule.AchievementSystem || achievementModule.default;
        this.achievementSystem = new AchievementSystem();

        // EXPOR GLOBALMENTE IMEDIATAMENTE
        window.achievementSystem = this.achievementSystem;

        const AchievementsPanel = (await import("/src/ui/AchievementsPanel.js"))
          .AchievementsPanel;
        this.achievementsPanel = new AchievementsPanel(this.achievementSystem);
      } catch (err) {}

      // 3. UpgradeManager
      const upgradeModule = await import("/src/systems/UpgradeManager.js");
      const UpgradeManager =
        upgradeModule.UpgradeManager || upgradeModule.default;
      this.upgradeManager = new UpgradeManager();
      this.upgradePanel = new UpgradePanel(this.upgradeManager);

      // 4. CustomerSystem
      const customerModule =
        await import("/src/systems/customers/CustomerSystem.js");
      const CustomerSystem =
        customerModule.CustomerSystem || customerModule.default;
      this.customerSystem = new CustomerSystem();
      this.customersPanel = new CustomersPanel(this.customerSystem);

      // 5. EconomySystem
      try {
        const economyModule = await import("/src/systems/EconomySystem.js");
        const EconomySystem =
          economyModule.EconomySystem || economyModule.default;
        this.economySystem = new EconomySystem();

        const ShopPanel = (await import("/src/ui/ShopPanel.js")).ShopPanel;
        this.shopPanel = new ShopPanel(this.economySystem);
      } catch (err) {}

      // 6. Inventory
      try {
        const inventoryModule = await import("/src/systems/Inventory.js");
        const Inventory = inventoryModule.Inventory || inventoryModule.default;
        this.inventory = new Inventory();
      } catch (err) {}

      // 7. GARAGE MANAGER (CARREGAR DEPOIS DO ACHIEVEMENT)
      try {
        const garageModule = await import("/src/garage/GarageManager.js");
        const GarageManager =
          garageModule.GarageManager || garageModule.default;
        this.garageManager = new GarageManager(
          this.getElement("game-container"),
        );

        this.garageUpgradePanel = new GarageUpgradePanel(this.garageManager);

        // 8. INTERAÇÃO COM EQUIPAMENTOS
        this.equipmentInteractionSystem = new EquipmentInteractionSystem(
          this.garageManager,
        );
        this.equipmentPanel = new EquipmentPanel(
          this.equipmentInteractionSystem,
          this.garageManager,
        );

        // Sincronizar com o 3D
        if (window.scene3D) {
          window.scene3D.equipmentSystem = this.equipmentInteractionSystem;
        }
      } catch (err) {}

      // 9. Sistemas adicionais
      this.loadAdditionalSystems();

      // 10. Minigame
      try {
        const { MinigameSystem } = await import("/src/systems/MinigameSystem.js");
        this.minigame = new MinigameSystem();
        console.log("✅ MinigameSystem carregado");
      } catch (err) {
        console.error("❌ Erro ao carregar MinigameSystem:", err);
      }

      // 11. Carregar progresso salvo
      setTimeout(() => {
        this._loadProgress();
        this.jobHistory = this._loadHistory();
        // Auto-save a cada 60s
        setInterval(() => this._saveProgress(), 60000);
      }, 1000);
    } catch (err) {
      console.error("❌ Erro ao carregar sistemas:", err);
    }
  }

  async loadAdditionalSystems() {
    setTimeout(() => {
      import("/src/systems/achievements/AchievementSystem.js")
        .then((module) => {
          if (!this.achievementSystem) {
            const AchievementSystem =
              module.AchievementSystem || module.default;
            this.achievementSystem = new AchievementSystem();
          }
        })
        .catch(() => {});

      import("/src/systems/challenges/DailyChallenges.js")
        .then((module) => {
          const DailyChallenges = module.DailyChallenges || module.default;
          this.dailyChallenges = new DailyChallenges();
        })
        .catch(() => {});

      import("/src/systems/market/used-parts-market.js")
        .then((module) => {
          const UsedPartsMarket = module.UsedPartsMarket || module.default;
          this.usedPartsMarket = new UsedPartsMarket();
        })
        .catch(() => {});
    }, 1000);
  }

  // ===== INICIALIZAÇÃO DE EVENTOS =====
  initEventListeners() {
    // Botão Novo Cliente
    this.getElement("new-job").addEventListener("click", () => {
      this.sounds?.play("click");
      this.createNewJob();
    });

    // Botão Entregar Carro
    this.getElement("deliver-car").addEventListener("click", () => {
      this.sounds?.play("click");
      this.deliverCar();
    });

    // Botão Upgrades
    this.getElement("upgrade-shop-btn").addEventListener("click", () => {
      this.sounds?.play("click");
      if (this.upgradePanel) {
        this.upgradePanel.toggle();
      } else {
        this.showNotification("❌ Sistema de upgrades não disponível", "error");
      }
    });

    // Botão Clientes
    const customersBtn = this.getElement("customers-btn");
    if (customersBtn) {
      customersBtn.addEventListener("click", () => {
        this.sounds?.play("click");
        if (this.customersPanel) {
          this.customersPanel.toggle();
        } else {
          this.showNotification(
            "❌ Sistema de clientes não disponível",
            "error",
          );
        }
      });
    }

    // Botão Loja
    const shopBtn = this.getElement("shop-btn");
    if (shopBtn) {
      shopBtn.addEventListener("click", () => {
        this.sounds?.play("click");
        if (this.shopPanel) {
          this.shopPanel.toggle();
        } else {
          this.showNotification("❌ Loja não disponível", "error");
        }
      });
    }

    // Botão Conquistas
    const achievementsBtn = this.getElement("achievements-btn");
    if (achievementsBtn) {
      achievementsBtn.addEventListener("click", () => {
        this.sounds?.play("click");
        if (this.achievementsPanel) {
          this.achievementsPanel.toggle();
        } else {
          this.showNotification(
            "❌ Sistema de conquistas não disponível",
            "error",
          );
        }
      });
    }

    // Botão Garagem
    const garageUpgradeBtn = this.getElement("garage-upgrade-btn");
    if (garageUpgradeBtn) {
      garageUpgradeBtn.addEventListener("click", () => {
        this.sounds?.play("click");
        if (this.garageUpgradePanel) {
          this.garageUpgradePanel.toggle();
        } else {
          this.showNotification(
            "❌ Sistema de garagem não disponível",
            "error",
          );
        }
      });
    }

    // Botão Estoque
    this.getElement("inventory-btn").addEventListener("click", () => {
      this.sounds?.play("click");
      if (this.inventory) {
        this.showNotification(
          "📦 Sistema de estoque em desenvolvimento",
          "info",
        );
      } else {
        this.showNotification("❌ Inventário não disponível", "error");
      }
    });

    // Seleção de ferramentas
    document.querySelectorAll(".tool-item").forEach((tool) => {
      tool.addEventListener("click", (e) => {
        document
          .querySelectorAll(".tool-item")
          .forEach((t) => t.classList.remove("selected"));
        tool.classList.add("selected");
        const toolId = tool.dataset.tool;
        if (window.gameState) {
          window.gameState.selectedTool = toolId;
        }
        this.showNotification(
          `🔧 Ferramenta: ${this.getToolName(toolId)}`,
          "info",
        );
        this.sounds?.play("click");

        if (this.animations) {
          this.animations.pulse(tool);
        }
      });
    });

    // Controles de áudio
    this.initAudioControls();

    // Tecla ESC para fechar painéis
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (this.upgradePanel?.isVisible) this.upgradePanel.hide();
        if (this.customersPanel?.isVisible) this.customersPanel.hide();
        if (this.shopPanel?.isVisible) this.shopPanel.hide();
        if (this.achievementsPanel?.isVisible) this.achievementsPanel.hide();
        if (this.garageUpgradePanel?.isVisible) this.garageUpgradePanel.hide();
        this.showNotification("🔧 Painéis fechados", "info");
      }
    });
  }

  initAudioControls() {
    const musicBtn = this.getElement("toggle-music");
    const sfxBtn = this.getElement("toggle-sfx");

    if (musicBtn && this.sounds) {
      musicBtn.addEventListener("click", () => {
        const enabled = this.sounds.toggle();
        musicBtn.textContent = enabled ? "🔊" : "🔇";
        this.showNotification(
          enabled ? "🔊 Som ativado" : "🔇 Som desativado",
          "info",
        );
        this.sounds?.play("click");
      });
    }

    if (sfxBtn && this.sounds) {
      sfxBtn.addEventListener("click", () => {
        this.sounds?.play("click");
        this.showNotification("🔧 Efeitos sonoros", "info");
      });
    }
  }

  getToolName(toolId) {
    const names = {
      wrench: "Chave Inglesa",
      screwdriver: "Chave de Fenda",
      hammer: "Martelo",
      welder: "Maçarico",
      diagnostic: "Diagnóstico",
    };
    return names[toolId] || toolId;
  }

  // ===== GERENCIAMENTO DE JOBS =====
  createNewJob() {
    if (!window.gameState) {
      this.showNotification("❌ Jogo não inicializado", "error");
      return;
    }

    if (window.gameState.currentJob) {
      if (
        !confirm(
          "Já existe um serviço ativo. Deseja cancelá-lo e iniciar um novo?",
        )
      ) {
        return;
      }
    }

    if (this.customerSystem) {
      const job = this.customerSystem.generateJob();
      if (!job) {
        this.showNotification("❌ Erro ao gerar job", "error");
        return;
      }

      window.gameState.currentJob = job;
      window.gameState.currentCar = { parts: job.parts };
      if (window.scene3D) window.scene3D.createCar(job.car || job, job);

      const customer = job.customer;
      const personalityIcon = customer.icon || "👤";
      this.showNotification(
        `🚗 ${personalityIcon} ${customer.name} - R$ ${job.payment}`,
        "success",
      );
      this.sounds?.play("success");

      if (this.achievementSystem) {
        this.achievementSystem.checkAchievement("jobStarted");
      }
    } else {
      const job = {
        id: Date.now(),
        customerName: this.generateCustomerName(),
        carModel: this.generateCarModel(),
        difficulty: "Fácil",
        payment: Math.floor(1000 + Math.random() * 2000),
        parts: this.generateParts(),
      };

      window.gameState.currentJob = job;
      window.gameState.currentCar = { parts: job.parts };
      if (window.scene3D) window.scene3D.createCar(job, job);
      this.showNotification(`🚗 Novo cliente: ${job.customerName}`, "success");
      this.sounds?.play("success");
    }

    this.updateJobInfo();
    this.updatePartsList();
    this.getElement("deliver-car").disabled = false;

    // Iniciar timer visual
    const timeLimit = window.gameState.currentJob?.timeLimit
      || this.customerSystem?.currentJob?.timeLimit
      || 5 * 60 * 1000;
    this.startJobTimer(timeLimit);

    const deliverBtn = this.getElement("deliver-car");
    if (this.animations) {
      this.animations.pulse(deliverBtn);
    }
  }

  deliverCar() {
    if (!window.gameState?.currentJob) {
      this.showNotification("❌ Nenhum serviço ativo", "error");
      return;
    }

    let result = null; // VARIÁVEL DEFINIDA AQUI

    // Capturar dados do job ANTES de completar (serão zerados depois)
    const currentJob = window.gameState.currentJob;
    const jobCustomerName = this.customerSystem?.currentJob?.customer?.name
      || currentJob?.customer?.name
      || currentJob?.customerName
      || 'Cliente';
    const jobCar = this.customerSystem?.currentJob?.car || currentJob?.car;
    const jobCarModel = jobCar
      ? `${jobCar.brand} ${jobCar.model} (${jobCar.year})`
      : currentJob?.carModel || 'Veículo';

    if (this.customerSystem && this.customerSystem.currentJob) {
      const parts = window.gameState.currentCar.parts;
      let totalCondition = 0;
      let count = 0;

      Object.values(parts).forEach((part) => {
        totalCondition += part.condition || 0;
        count++;
      });

      const quality = count > 0 ? totalCondition / count : 0;
      result = this.customerSystem.completeJob(quality);

      if (result) {
        // Aplicar multiplicadores de eventos
        let payment = result.payment;
        if (this.eventSystem) {
          payment = this.eventSystem.applyEventBonus(payment, "money");
        }

        window.gameState.money += payment;
        window.gameState.jobsCompleted++;

        if (this.achievementSystem) {
          this.achievementSystem.checkAchievement("jobCompleted");
          this.achievementSystem.checkAchievement("moneyEarned", payment);

          if (quality >= 95) {
            this.achievementSystem.checkAchievement("perfectJob");
          }

          if (result.timeBonus > 0) {
            this.achievementSystem.checkAchievement("fastJob");
          }

          if (result.customer?.isVIP) {
            this.achievementSystem.checkAchievement("vipCustomer");
          }
        }

        this.sounds?.play("money");

        // Calcular qualidade média das peças
        const partsArr = Object.values(window.gameState.currentCar?.parts || {});
        const avgQuality = partsArr.length
          ? partsArr.reduce((a, p) => a + (p.condition || 0), 0) / partsArr.length
          : 80;

        // Parar timer antes de mostrar resultado
        this.stopJobTimer();

        // Mostrar tela de resultado
        this.showJobResult({
          payment:      payment,
          satisfaction: result.satisfaction || 80,
          quality:      avgQuality,
          timeBonus:    result.timeBonus || 0,
          customerName: jobCustomerName,
          carModel:     jobCarModel,
        });
      }
    } else {
      const payment = window.gameState.currentJob.payment || 1000;
      window.gameState.money += payment;
      window.gameState.jobsCompleted++;
      this.sounds?.play("money");

      const partsArr2 = Object.values(window.gameState.currentCar?.parts || {});
      const avgQ2 = partsArr2.length
        ? partsArr2.reduce((a, p) => a + (p.condition || 0), 0) / partsArr2.length
        : 80;

      // Parar timer antes de mostrar resultado
      this.stopJobTimer();

      this.showJobResult({
        payment:      payment,
        satisfaction: 85,
        quality:      avgQ2,
        timeBonus:    0,
        customerName: jobCustomerName,
        carModel:     jobCarModel,
      });

      result = { payment, satisfaction: 85 };
    }

    window.gameState.currentJob = null;
    window.gameState.currentCar = null;
    if (window.scene3D) window.scene3D.removeCar();

    this.updateMoney();
    this.updateJobsCompleted();
    this.updateJobInfo();
    this.updatePartsList();
    this.getElement("deliver-car").disabled = true;

    const jobInfo = this.getElement("job-info");
    if (this.animations) {
      this.animations.fadeOut(jobInfo, 200, () => {
        this.updateJobInfo();
        this.animations.fadeIn(jobInfo, 200);
      });
    }
  }

  // ===== GERADORES (FALLBACK) =====
  generateCustomerName() {
    const names = [
      "João Silva",
      "Maria Santos",
      "Carlos Oliveira",
      "Ana Souza",
      "Pedro Costa",
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  generateCarModel() {
    const models = [
      "Fiat Uno",
      "VW Gol",
      "Chevrolet Onix",
      "Ford Ka",
      "Renault Sandero",
    ];
    return models[Math.floor(Math.random() * models.length)];
  }

  generateParts() {
    return {
      motor: { condition: 30 + Math.random() * 70, maxCondition: 100 },
      transmissao: { condition: 30 + Math.random() * 70, maxCondition: 100 },
      freios: { condition: 30 + Math.random() * 70, maxCondition: 100 },
      suspensao: { condition: 30 + Math.random() * 70, maxCondition: 100 },
      bateria: { condition: 30 + Math.random() * 70, maxCondition: 100 },
      alternador: { condition: 30 + Math.random() * 70, maxCondition: 100 },
    };
  }

  // ===== ATUALIZAÇÕES DE DISPLAY =====
  updateAllDisplays() {
    this.updateMoney();
    this.updateLevel();
    this.updateReputation();
    this.updateJobsCompleted();
    this.updateJobInfo();
    this.updatePartsList();
  }

  updateMoney() {
    const moneyEl = this.getElement("money");
    if (window.gameState) {
      // Garantir que o valor é um número
      let value = window.gameState.money;

      // Se for NaN ou undefined, resetar
      if (isNaN(value) || value === undefined || value === null) {
        console.warn("💰 Dinheiro inválido, resetando...");
        window.gameState.money = 5000;
        value = 5000;
      }

      // Formatar valor
      moneyEl.textContent = `R$ ${value.toLocaleString()}`;

      // Animação opcional
      if (this.animations) {
        this.animations.pulse(moneyEl);
      }
    } else {
      moneyEl.textContent = "R$ 5.000";
    }
  }

  updateLevel() {
    const levelEl = this.getElement("level");
    if (window.gameState) {
      levelEl.textContent = window.gameState.level;
    }
  }

  updateReputation() {
    const repEl = this.getElement("reputation");
    if (window.gameState) {
      const stars =
        "★".repeat(window.gameState.reputation) +
        "☆".repeat(5 - window.gameState.reputation);
      repEl.textContent = stars;
    }
  }

  updateJobsCompleted() {
    const jobsEl = this.getElement("jobs-completed");
    if (window.gameState) {
      jobsEl.textContent = window.gameState.jobsCompleted || 0;
    }
  }

  updateJobInfo() {
    const el = this.getElement("job-info");
    if (!window.gameState?.currentJob) {
      el.innerHTML = '<div class="empty-state">🚗 Nenhum serviço ativo</div>';
      return;
    }

    const job = window.gameState.currentJob;

    if (this.customerSystem && this.customerSystem.currentJob) {
      const customer = job.customer;
      const timeLeft = this.customerSystem.getTimeRemaining();
      const timeStr = this.customerSystem.formatTime(timeLeft);

      const personalityIcon = customer.icon || "👤";
      const isUrgent = timeLeft < 60000 ? "urgent" : "";

      el.innerHTML = `
                <div class="job-header">
                    <span class="job-customer">${personalityIcon} ${customer.name}</span>
                    <span class="job-difficulty">${job.difficulty || "Normal"}</span>
                </div>
                <div class="job-info-item">
                    <span>Carro:</span>
                    <span>${job.car?.brand || ""} ${job.car?.model || "Desconhecido"} (${job.car?.year || ""})</span>
                </div>
                <div class="job-info-item">
                    <span>Personalidade:</span>
                    <span>${customer.name || "Normal"}</span>
                </div>
                <div class="job-payment">
                    Pagamento: R$ ${job.payment}
                </div>
            `;
    } else {
      el.innerHTML = `
                <div class="job-header">
                    <span class="job-customer">${job.customerName || "Cliente"}</span>
                    <span class="job-difficulty">${job.difficulty || "Normal"}</span>
                </div>
                <div class="job-info-item">
                    <span>Carro:</span>
                    <span>${job.carModel || "Desconhecido"}</span>
                </div>
                <div class="job-payment">
                    Pagamento: R$ ${job.payment || 1000}
                </div>
            `;
    }
  }

  updatePartsList() {
    const el = this.getElement("parts-list");
    if (!window.gameState?.currentCar) {
      el.innerHTML =
        '<div class="empty-state">🔧 Nenhum carro na oficina</div>';
      return;
    }

    const parts = window.gameState.currentCar.parts;
    const gameState = window.gameState;

    let totalCondition = 0;
    let totalParts = 0;
    let perfectCount = 0;

    Object.values(parts).forEach((part) => {
      totalCondition += part.condition || 0;
      totalParts++;
      if ((part.condition || 0) >= 100) perfectCount++;
    });

    const averageCondition =
      totalParts > 0 ? Math.round(totalCondition / totalParts) : 0;

    const overallState = averageCondition >= 70 ? { label: 'Bom estado', color: 'var(--green)', icon: '✅' }
                      : averageCondition >= 40 ? { label: 'Precisa atenção', color: 'var(--amber)', icon: '⚠️' }
                      : { label: 'Estado crítico', color: 'var(--red)', icon: '🚨' };

    let html = `
            <div class="car-status">
                <div class="progress-info">
                    <span style="display:flex;align-items:center;gap:6px">
                      ${overallState.icon}
                      <span style="color:${overallState.color};font-weight:600">${overallState.label}</span>
                    </span>
                    <span>${perfectCount}/${totalParts} perfeitas</span>
                </div>
                <div class="overall-progress">
                    <div class="progress-bar" style="width:${averageCondition}%;background:${overallState.color}"></div>
                </div>
            </div>
            <div class="parts-list">
        `;

    Object.entries(parts).forEach(([name, data]) => {
      const condition = Math.round(data.condition || 0);
      let conditionClass = "condition-good";
      let conditionText = "Bom";

      if (condition < 30) {
        conditionClass = "condition-bad";
        conditionText = "Péssimo";
      } else if (condition < 60) {
        conditionClass = "condition-medium";
        conditionText = "Regular";
      } else if (condition < 90) {
        conditionClass = "condition-medium";
        conditionText = "Desgastado";
      }

      let repairCost = 5;
      let canRepair = gameState.money >= 5;

      if (this.upgradeManager) {
        const tool = this.upgradeManager.getToolEfficiency(
          gameState.selectedTool,
        );
        repairCost = tool.cost;
        canRepair = gameState.money >= repairCost && condition < 100;
      }

      // Ícone e label de dano baseado na condição
      const dmgIcon  = condition >= 70 ? '' : condition >= 40 ? '🔴' : '💀';
      const oilDrip  = condition < 30  ? '<span style="color:#f59e0b;font-size:10px">🛢 Vazamento</span>' : '';
      const rustBadge= condition < 50  ? '<span style="color:#ef4444;font-size:10px">⚠ Desgaste</span>' : '';
      const barColor = condition >= 70 ? 'var(--green)' : condition >= 40 ? 'var(--amber)' : 'var(--red)';

      html += `
                <div class="part-item ${gameState.selectedPart === name ? "selected" : ""}" 
                     data-part="${name}">
                    <div class="part-header">
                        <span class="part-name">${dmgIcon} ${this.getPartDisplayName(name)}</span>
                        <span class="part-condition ${conditionClass}">${condition}%</span>
                    </div>
                    ${oilDrip || rustBadge ? `<div style="display:flex;gap:8px;margin-bottom:6px">${rustBadge}${oilDrip}</div>` : ''}
                    <div class="part-progress">
                        <div class="progress-bar" style="width:${condition}%;background:${barColor}"></div>
                    </div>
                    <div class="part-actions">
                        <button class="part-btn repair-btn" data-part="${name}">
                            🔧 Reparar (R$ ${repairCost})
                        </button>
                        <button class="part-btn buy-btn" data-part="${name}">
                            🛒 Nova (R$ 500)
                        </button>
                    </div>
                </div>
            `;
    });

    html += "</div>";
    el.innerHTML = html;

    el.querySelectorAll(".repair-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const partName = btn.dataset.part;
        const mgSystem = window.uiManager?.minigame;
        const toolId   = window.gameState?.selectedTool || 'wrench';

        // Tocar som da ferramenta
        window.uiManager?.sounds?.playToolSound?.(toolId);

        // Verificar se minigame está habilitado
        const minigameEnabled = localStorage.getItem('minigame_enabled') !== 'false';

        if (mgSystem && !mgSystem.active && minigameEnabled) {
          mgSystem.start(partName, toolId, (quality) => {
            const result = window.gameState?.repairPart(partName);
            if (result?.success) {
              // Aplicar bônus de qualidade
              const bonus = Math.round((quality - 50) / 10);
              if (bonus > 0 && window.gameState.currentCar?.parts?.[partName]) {
                window.gameState.currentCar.parts[partName].condition = Math.min(
                  100,
                  window.gameState.currentCar.parts[partName].condition + bonus
                );
              }
              const label = quality >= 90 ? '🎯 Perfeito!' : quality >= 70 ? '✅ Bom reparo!' : '🔧 Reparo básico';
              window.uiManager?.showNotification(`${label} (${quality}%)`, quality >= 70 ? 'success' : 'info');
              window.uiManager?.updatePartsList();
              window.uiManager?.updateMoney();
              window.createRepairEffect?.(partName);
              // Atualizar label 3D da peça reparada
              const updatedParts = window.gameState?.currentCar?.parts;
              if (updatedParts && window.scene3D?.showPartLabels) {
                window.scene3D.showPartLabels(updatedParts);
              }
              const status = window.gameState.checkCarReady?.();
              if (status?.ready) {
                document.getElementById("deliver-car").disabled = false;
                window.uiManager?.showNotification("🎉 Carro pronto para entrega!", "success");
              }
            } else {
              window.uiManager?.showNotification(result?.message || "❌ Erro ao reparar", "error");
            }
          });
        } else if (window.repairPart) {
          window.repairPart(partName);
        }
      });
    });

    el.querySelectorAll(".buy-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const partName = btn.dataset.part;
        if (window.buyNewPart) {
          window.buyNewPart(partName);
        }
      });
    });

    el.querySelectorAll(".part-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (!e.target.classList.contains("part-btn")) {
          const partName = item.dataset.part;
          if (window.selectPart) {
            window.selectPart(partName);
          }
        }
      });
    });
  }

  getPartDisplayName(partName) {
    const names = {
      motor: "Motor",
      transmissao: "Transmissão",
      freios: "Freios",
      suspensao: "Suspensão",
      bateria: "Bateria",
      alternador: "Alternador",
      radiador: "Radiador",
      escapamento: "Escapamento",
      turbo: "Turbo",
      diferencial: "Diferencial",
      embreagem: "Embreagem",
      sensor: "Sensor",
      eletronica: "Eletrônica",
    };
    return names[partName] || partName;
  }

  // ===== TIMER VISUAL =====
  startJobTimer(timeLimit) {
    this.stopJobTimer();
    const timerEl    = document.getElementById('job-timer');
    const display    = document.getElementById('timer-display');
    const text       = document.getElementById('timer-text');
    const bar        = document.getElementById('timer-bar-fill');
    const label      = document.getElementById('timer-label');

    if (!timerEl) return;
    timerEl.classList.add('show');

    const startTime = Date.now();

    this._timerInterval = setInterval(() => {
      const elapsed   = Date.now() - startTime;
      const remaining = Math.max(0, timeLimit - elapsed);
      const pct       = (remaining / timeLimit) * 100;

      // Atualizar texto
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      if (text) text.textContent = `${mins}:${secs.toString().padStart(2,'0')}`;

      // Atualizar barra
      if (bar) {
        bar.style.width = pct + '%';
        bar.style.background = pct > 50
          ? 'var(--green)'
          : pct > 25
          ? 'var(--amber)'
          : 'var(--red)';
      }

      // Classes de estado
      if (display) {
        display.classList.remove('warning', 'critical');
        if (pct <= 25) display.classList.add('critical');
        else if (pct <= 50) display.classList.add('warning');
      }

      // Label
      if (label) {
        label.textContent = pct <= 25
          ? '⚠️ Urgente!'
          : pct <= 50
          ? 'Atenção'
          : 'Tempo restante';
      }

      // Tempo esgotado
      if (remaining <= 0) {
        this.stopJobTimer();
        this._onTimerExpired();
      }
    }, 500);
  }

  stopJobTimer() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    this.jobHistory = this._loadHistory();
    }
    const timerEl = document.getElementById('job-timer');
    if (timerEl) timerEl.classList.remove('show');
  }

  _onTimerExpired() {
    if (!window.gameState?.currentJob) return;
    const customer = this.customerSystem?.cancelJob?.();
    window.gameState.currentJob = null;
    window.gameState.currentCar = null;
    if (window.scene3D) window.scene3D.removeCar?.();
    this.updateJobInfo();
    this.updatePartsList();
    this.getElement('deliver-car').disabled = true;
    const name = customer?.name || 'Cliente';
    this.showNotification(`⏰ ${name} foi embora!`, 'error');
    this.sounds?.play('error');
  }

  updateTimer() {
    // Mantido para compatibilidade — lógica movida para startJobTimer
  }

  // ===== NOTIFICAÇÕES =====
  showJobResult(data) {
    // Registrar no histórico
    this._addJobToHistory(data);

    // data: { payment, satisfaction, quality, timeBonus, customerName, carModel }
    const overlay = document.getElementById('job-result-overlay');
    if (!overlay) return;

    const { payment, satisfaction, quality, timeBonus, customerName, carModel } = data;

    // Calcular estrelas (1–5)
    const stars = satisfaction >= 90 ? 5
                : satisfaction >= 75 ? 4
                : satisfaction >= 55 ? 3
                : satisfaction >= 35 ? 2 : 1;

    // Ícone e título baseado nas estrelas
    const configs = {
      5: { icon: '🏆', title: 'Serviço Perfeito!',   subtitle: `${customerName} adorou!` },
      4: { icon: '🎉', title: 'Ótimo Serviço!',       subtitle: `${customerName} ficou satisfeito` },
      3: { icon: '👍', title: 'Bom Serviço',          subtitle: `${customerName} aprovou` },
      2: { icon: '😐', title: 'Serviço Regular',      subtitle: `${customerName} esperava mais` },
      1: { icon: '😞', title: 'Serviço Insatisfatório', subtitle: `${customerName} ficou decepcionado` },
    };
    const cfg = configs[stars];

    // Comentário aleatório
    const commentPool = satisfaction >= 90 ? 'perfect'
                      : satisfaction >= 70 ? 'good'
                      : satisfaction >= 45 ? 'ok' : 'bad';
    const comments = {'perfect': ['Melhor mecânico da cidade! Voltarei sempre aqui.', 'Perfeito! O carro nunca rodou tão bem.', 'Trabalho impecável. Recomendo a todos!', 'Incrível! Superou todas as minhas expectativas.'], 'good': ['Fiquei bem satisfeito com o serviço.', 'Bom trabalho! O carro está funcionando bem.', 'Serviço de qualidade, valeu o preço.', 'Gostei do resultado. Com certeza volto.'], 'ok': ['Razoável. Esperava um pouco mais.', 'O carro melhorou, mas ainda tem uns barulhos...', 'Foi ok. Nada de especial.', 'Deu pra resolver, mas levou mais tempo que o esperado.'], 'bad': ['Decepcionante. O problema não foi resolvido direito.', 'Não fiquei satisfeito. Esperava mais.', 'Vou ter que voltar em breve com o mesmo problema.', 'O serviço deixou a desejar.']};
    const pool = comments[commentPool] || comments.ok;
    const comment = pool[Math.floor(Math.random() * pool.length)];

    // Cor da satisfação
    const satColor = satisfaction >= 70 ? 'green' : satisfaction >= 45 ? 'amber' : 'red';

    // Preencher UI
    document.getElementById('result-icon').textContent      = cfg.icon;
    document.getElementById('result-title').textContent     = cfg.title;
    document.getElementById('result-subtitle').textContent  = cfg.subtitle;
    document.getElementById('result-payment').textContent   = `R$ ${payment.toLocaleString("pt-BR")}`;
    document.getElementById('result-quality').textContent   = `${Math.round(quality)}%`;
    document.getElementById('result-satisfaction').textContent = `${Math.round(satisfaction)}%`;
    document.getElementById('result-satisfaction').className = `result-stat-value ${satColor}`;
    document.getElementById('result-bonus').textContent     = timeBonus > 0 ? `+R$ ${timeBonus}` : "—";
    document.getElementById('result-bonus').className       = `result-stat-value ${timeBonus > 0 ? "green" : ""}`;
    document.getElementById('result-comment').innerHTML     = `"${comment}"<div class="result-comment-author">— ${customerName}, ${carModel}</div>`;

    // Acender estrelas com delay escalonado
    const starEls = document.querySelectorAll('.result-star');
    starEls.forEach((el, i) => {
      el.classList.remove('lit');
      if (i < stars) {
        setTimeout(() => el.classList.add('lit'), 200 + i * 120);
      }
    });

    overlay.classList.add('show');
  }

  closeJobResult() {
    const overlay = document.getElementById('job-result-overlay');
    if (overlay) overlay.classList.remove('show');
  }

  showLevelUp(level) {
    const overlay = document.getElementById('levelup-overlay');
    const numEl   = document.getElementById('levelup-num');
    const titleEl = document.getElementById('levelup-title');
    const subEl   = document.getElementById('levelup-subtitle');
    const rewEl   = document.getElementById('levelup-rewards');
    const card    = document.getElementById('levelup-card');
    if (!overlay) return;

    const titles = {2: ('Aprendiz de Mecânico', 'Você está pegando o jeito!'), 3: ('Mecânico Iniciante', 'Suas mãos já conhecem as ferramentas.'), 4: ('Mecânico Treinado', 'Clientes já confiam no seu trabalho.'), 5: ('Mecânico Experiente', 'Você resolve problemas com facilidade.'), 6: ('Técnico Especialista', 'Diagnósticos precisos e reparos eficientes.'), 7: ('Mestre Mecânico', 'Poucos chegam onde você chegou.'), 8: ('Engenheiro Automotivo', 'Sua oficina é referência na cidade.'), 9: ('Lenda da Mecânica', 'Carros difíceis? Não pra você.'), 10: ('Mito da Oficina', 'Uma lenda viva do mundo automotivo!')};
    const [title, subtitle] = titles[level] || [`Nível ${level}`, 'Continue melhorando!'];

    if (numEl)   numEl.textContent   = level;
    if (titleEl) titleEl.textContent = title;
    if (subEl)   subEl.textContent   = subtitle;

    // Recompensas por nível
    const rewards = [];
    if (level % 2 === 0) rewards.push(`<div class="levelup-reward-tag gold">+R$ ${level * 500} bônus</div>`);
    rewards.push(`<div class="levelup-reward-tag">Novos upgrades disponíveis</div>`);
    if (rewEl) rewEl.innerHTML = rewards.join('');

    // Confetti
    if (card) {
      const colors = ['#facc15','#3b82f6','#22c55e','#f59e0b','#e2e8f0'];
      for (let i = 0; i < 18; i++) {
        const p = document.createElement('div');
        p.className = 'levelup-confetti';
        p.style.cssText = `
          left: ${10 + Math.random() * 80}%;
          top: ${Math.random() * 30}%;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          width: ${6 + Math.random() * 6}px;
          height: ${6 + Math.random() * 6}px;
          animation-duration: ${0.8 + Math.random() * 0.8}s;
          animation-delay: ${Math.random() * 0.4}s;
        `;
        card.appendChild(p);
        setTimeout(() => p.remove(), 1600);
      }
    }

    overlay.classList.add('show');

    // Tocar som de level up
    this.sounds?.play('unlock');

    // Auto-fechar após 3.5s
    setTimeout(() => {
      overlay.classList.remove('show');
    }, 3500);
  }

  // ===== HISTÓRICO DE JOBS =====

  _loadHistory() {
    try {
      const key = `cms_history_${this._getSaveKey?.() || 'default'}`;
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch(e) { return []; }
  }

  _saveHistory() {
    try {
      const key = `cms_history_${this._getSaveKey?.() || 'default'}`;
      // Manter apenas os últimos 100 jobs
      localStorage.setItem(key, JSON.stringify(this.jobHistory.slice(-100)));
    } catch(e) {}
  }

  _addJobToHistory(data) {
    const entry = {
      id:           Date.now(),
      car:          data.carModel,
      customer:     data.customerName,
      payment:      data.payment,
      satisfaction: data.satisfaction,
      quality:      Math.round(data.quality),
      timeBonus:    data.timeBonus || 0,
      stars:        data.satisfaction >= 90 ? 5
                  : data.satisfaction >= 75 ? 4
                  : data.satisfaction >= 55 ? 3
                  : data.satisfaction >= 35 ? 2 : 1,
      date:         new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' }),
    };
    this.jobHistory.unshift(entry); // mais recente primeiro
    this._saveHistory();
  }

  showHistory() {
    const panel = document.getElementById('history-panel');
    if (!panel) return;

    this._renderHistorySummary();
    this._renderHistoryList();
    panel.classList.add('show');

    document.addEventListener('keydown', this._historyEscHandler = (e) => {
      if (e.key === 'Escape') this.hideHistory();
    });
  }

  hideHistory() {
    const panel = document.getElementById('history-panel');
    if (panel) panel.classList.remove('show');
    if (this._historyEscHandler) {
      document.removeEventListener('keydown', this._historyEscHandler);
      this._historyEscHandler = null;
    }
  }

  _renderHistorySummary() {
    const el = document.getElementById('history-summary');
    if (!el || !this.jobHistory.length) {
      if (el) el.innerHTML = '';
      return;
    }

    const total    = this.jobHistory.length;
    const earnings = this.jobHistory.reduce((s, j) => s + (j.payment || 0), 0);
    const avgSat   = Math.round(this.jobHistory.reduce((s, j) => s + (j.satisfaction || 0), 0) / total);
    const perfect  = this.jobHistory.filter(j => j.stars === 5).length;

    el.innerHTML = `
      <div class="history-sum-item">
        <div class="history-sum-value">${total}</div>
        <div class="history-sum-label">Jobs</div>
      </div>
      <div class="history-sum-item">
        <div class="history-sum-value money">R$ ${earnings.toLocaleString('pt-BR')}</div>
        <div class="history-sum-label">Total ganho</div>
      </div>
      <div class="history-sum-item">
        <div class="history-sum-value">${avgSat}%</div>
        <div class="history-sum-label">Satisfação média</div>
      </div>
      <div class="history-sum-item">
        <div class="history-sum-value">${perfect}</div>
        <div class="history-sum-label">⭐ Perfeitos</div>
      </div>`;
  }

  _renderHistoryList() {
    const el = document.getElementById('history-list');
    if (!el) return;

    if (!this.jobHistory.length) {
      el.innerHTML = '<div class="history-empty"><span style="font-size:32px">📋</span>Nenhum serviço realizado ainda</div>';
      return;
    }

    el.innerHTML = this.jobHistory.map((job, i) => {
      const stars = '⭐'.repeat(job.stars) + '☆'.repeat(5 - job.stars);
      const bonus = job.timeBonus > 0 ? ` <span style="color:var(--green);font-size:10px">+R$ ${job.timeBonus}</span>` : '';
      return `
        <div class="history-item">
          <div class="history-item-num">${i + 1}</div>
          <div class="history-item-info">
            <div class="history-item-car">${job.car}</div>
            <div class="history-item-meta">
              <span class="history-item-customer">👤 ${job.customer}</span>
              <span class="history-item-date">${job.date}</span>
            </div>
          </div>
          <div class="history-item-right">
            <div class="history-item-payment">R$ ${(job.payment).toLocaleString('pt-BR')}${bonus}</div>
            <div class="history-item-stars">${stars}</div>
          </div>
        </div>`;
    }).join('');
  }

  _getSaveKey() {
    return localStorage.getItem('cms_active_save_key') || 'cms_save_default';
  }

  _saveProgress() {
    if (!window.gameState) return;
    try {
      const save = {
        money:         window.gameState.money,
        level:         window.gameState.level,
        experience:    window.gameState.experience,
        reputation:    window.gameState.reputation,
        jobsCompleted: window.gameState.jobsCompleted,
        savedAt:       new Date().toISOString(),
      };
      localStorage.setItem(this._getSaveKey(), JSON.stringify(save));
    } catch(e) { console.warn('Erro ao salvar:', e); }
  }

  _loadProgress() {
    try {
      const raw = localStorage.getItem(this._getSaveKey());
      if (!raw || !window.gameState) return;
      const save = JSON.parse(raw);
      window.gameState.money         = save.money         ?? window.gameState.money;
      window.gameState.level         = save.level         ?? window.gameState.level;
      window.gameState.experience    = save.experience    ?? 0;
      window.gameState.reputation    = save.reputation    ?? 3;
      window.gameState.jobsCompleted = save.jobsCompleted ?? 0;
      this.updateAllDisplays();
      console.log('✅ Progresso carregado do perfil:', this._getSaveKey());
    } catch(e) { console.warn('Erro ao carregar save:', e); }
  }

  showNotification(message, type = "info", duration = 3000) {
    // Detectar mensagem de level up do Game.js
    if (message && message.includes('Nível') && message.includes('alcançado')) {
      const match = message.match(/Nível (\d+)/);
      if (match) {
        const level = parseInt(match[1]);
        setTimeout(() => this.showLevelUp(level), 300);
      }
    }

    if (this.notifications) {
      this.notifications.show(message, type, duration);

      switch (type) {
        case "success":
          this.sounds?.play("success");
          break;
        case "error":
          this.sounds?.play("error");
          break;
        case "achievement":
          this.sounds?.play("unlock");
          break;
        case "money":
          this.sounds?.play("money");
          break;
        default:
          this.sounds?.play("click");
      }
    } else {
      const notification = this.getElement("notification");

      if (this.notificationTimeout) {
        clearTimeout(this.notificationTimeout);
      }

      notification.textContent = message;
      notification.style.backgroundColor =
        type === "error"
          ? "#ff3333"
          : type === "success"
            ? "#00aa00"
            : "#ff6b00";

      notification.classList.add("show");

      this.notificationTimeout = setTimeout(() => {
        notification.classList.remove("show");
      }, duration);
    }
  }

  showAchievementNotification(achievement) {
    if (this.achievementsPanel) {
      this.achievementsPanel.showUnlockedNotification(achievement);
    } else {
      this.showNotification(`🏆 ${achievement.name}`, "achievement", 5000);
    }
  }

  // ===== MÉTODOS DE ATUALIZAÇÃO DE PAINÉIS =====
  updateUpgradePanel() {
    if (this.upgradePanel) {
      this.upgradePanel.update();
    }
  }

  updateCustomersPanel() {
    if (this.customersPanel) {
      this.customersPanel.update();
    }
  }

  updateShopPanel() {
    if (this.shopPanel) {
      this.shopPanel.update();
    }
  }

  updateAchievementsPanel() {
    if (this.achievementsPanel) {
      this.achievementsPanel.update();
    }
  }

  updateGaragePanel() {
    if (this.garageUpgradePanel) {
      this.garageUpgradePanel.update();
    }
  }
}

// ===== FUNÇÕES GLOBAIS =====
window.selectPart = (partName) => {
  if (window.gameState) {
    window.gameState.selectedPart = partName;
    if (window.uiManager) {
      window.uiManager.updatePartsList();
      window.uiManager.showNotification(
        `🔧 Peça selecionada: ${partName}`,
        "info",
      );
    }
  }
};

window.repairPart = (partName) => {
  if (!window.gameState) {
    window.uiManager?.showNotification("❌ Jogo não inicializado", "error");
    return;
  }

  const mgSystem = window.uiManager?.minigame;
  const toolId   = window.gameState?.selectedTool || 'wrench';

  console.log('🔧 repairPart chamado:', partName, '| tool:', toolId, '| minigame:', !!mgSystem);

  if (mgSystem) {
    console.log('🎮 Abrindo minigame...');
    mgSystem.start(partName, toolId, (quality) => {
      // quality: 0–100
      const result = window.gameState.repairPart(partName);

      if (result.success) {
        // Aplicar bônus de qualidade à condição da peça
        const bonusRepair = Math.round((quality - 50) / 10); // -5 a +5 pts
        if (bonusRepair > 0 && window.gameState.currentCar?.parts?.[partName]) {
          window.gameState.currentCar.parts[partName].condition = Math.min(
            100,
            window.gameState.currentCar.parts[partName].condition + bonusRepair
          );
        }

        const qualityLabel = quality >= 90 ? '🎯 Reparo perfeito!' : quality >= 70 ? '✅ Bom reparo!' : '🔧 Reparo básico';
        window.uiManager?.showNotification(`${qualityLabel} (${quality}%)`, quality >= 70 ? 'success' : 'info');
        window.uiManager?.updatePartsList();
        window.uiManager?.updateMoney();
        window.createRepairEffect?.(partName);

        const status = window.gameState.checkCarReady();
        if (status.ready) {
          document.getElementById("deliver-car").disabled = false;
          window.uiManager?.showNotification("🎉 Carro pronto para entrega!", "success");
        }
      } else {
        window.uiManager?.showNotification(result.message, "error");
      }
    });
  } else {
    // Fallback sem minigame
    const result = window.gameState.repairPart(partName);
    if (result.success) {
      window.uiManager?.showNotification(result.message, "success");
      window.uiManager?.updatePartsList();
      window.uiManager?.updateMoney();
      window.createRepairEffect?.(partName);
      const status = window.gameState.checkCarReady();
      if (status.ready) {
        document.getElementById("deliver-car").disabled = false;
        window.uiManager?.showNotification("🎉 Carro pronto para entrega!", "success");
      }
    } else {
      window.uiManager?.showNotification(result.message, "error");
    }
  }
};

window.buyNewPart = (partName) => {
  if (!window.gameState) {
    window.uiManager?.showNotification("❌ Jogo não inicializado", "error");
    return;
  }

  const result = window.gameState.buyNewPart(partName);

  if (result.success) {
    window.uiManager?.showNotification(result.message, "success");
    window.uiManager?.updatePartsList();
    window.uiManager?.updateMoney();

    for (let i = 0; i < 3; i++) {
      setTimeout(() => window.createRepairEffect?.(partName), i * 200);
    }

    const status = window.gameState.checkCarReady();
    if (status.ready) {
      document.getElementById("deliver-car").disabled = false;
      window.uiManager?.showNotification(
        "🎉 Carro pronto para entrega!",
        "success",
      );
    }
  } else {
    window.uiManager?.showNotification(result.message, "error");
  }
};

window.buyPart = (partType, quantity = 1, rarity = "comum") => {
  if (!window.uiManager?.economySystem) {
    window.uiManager?.showNotification(
      "❌ Sistema econômico não disponível",
      "error",
    );
    return;
  }

  const result = window.uiManager.economySystem.buyPart(
    partType,
    quantity,
    rarity,
  );

  if (result.success) {
    window.uiManager.showNotification(result.message, "money");
    window.uiManager.updateMoney();
    if (window.uiManager.shopPanel) {
      window.uiManager.shopPanel.update();
    }
  } else {
    window.uiManager.showNotification(result.message, "error");
  }
};

window.sellPart = (partType) => {
  if (!window.uiManager?.economySystem || !window.inventory) {
    window.uiManager?.showNotification("❌ Sistema não disponível", "error");
    return;
  }

  const result = window.uiManager.economySystem.sellPart(partType, 50);

  if (result.success) {
    window.inventory.usePart(partType);
    window.uiManager.showNotification(result.message, "money");
    window.uiManager.updateMoney();
    if (window.uiManager.shopPanel) {
      window.uiManager.shopPanel.update();
    }
  }
};

window.upgradeTool = (toolId) => {
  if (!window.uiManager?.upgradeManager) {
    window.uiManager?.showNotification(
      "❌ Sistema de upgrades não disponível",
      "error",
    );
    return;
  }

  const result = window.uiManager.upgradeManager.upgradeTool(toolId);

  if (result.success) {
    window.uiManager.showNotification(result.message, "success");
    window.uiManager.updateUpgradePanel();
    if (window.gameState) {
      window.gameState.updateMoney();
    }
  } else {
    window.uiManager.showNotification(result.message, "error");
  }
};

window.upgradeGarage = (upgradeId) => {
  if (!window.uiManager?.upgradeManager) {
    window.uiManager?.showNotification(
      "❌ Sistema de upgrades não disponível",
      "error",
    );
    return;
  }

  const result = window.uiManager.upgradeManager.upgradeGarage(upgradeId);

  if (result.success) {
    window.uiManager.showNotification(result.message, "success");
    window.uiManager.updateUpgradePanel();
    if (window.gameState) {
      window.gameState.updateMoney();
    }
  } else {
    window.uiManager.showNotification(result.message, "error");
  }
};

window.createRepairEffect = (partName) => {
  if (
    window.scene3D &&
    typeof window.scene3D.createRepairEffect === "function"
  ) {
    window.scene3D.createRepairEffect(partName);
  }
};

// Expor globalmente
if (typeof window !== "undefined") {
  window.UIManager = UIManager;
}
