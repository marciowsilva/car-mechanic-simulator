// src/ui/UIManager.js - Versão completa com todos os sistemas integrados

import { UpgradeManager } from "/src/systems/UpgradeManager.js";
import { UpgradePanel } from "/src/ui/UpgradePanel.js";
import { CustomersPanel } from "/src/ui/CustomersPanel.js";
import { NotificationSystem } from "/src/ui/NotificationSystem.js";
import { SoundSystem } from "/src/systems/SoundSystem.js";
import { TooltipSystem } from "/src/ui/TooltipSystem.js";
import { AnimationSystem } from "/src/systems/AnimationSystem.js";
import { GarageExpansion } from "/src/garage/GarageExpansion.js";
import { GaragePanel } from "/src/ui/GaragePanel.js";
import { EquipmentInteractionSystem } from "/src/systems/EquipmentInteractionSystem.js";
import { EquipmentPanel } from "/src/ui/EquipmentPanel.js";

export class UIManager {
  constructor() {
    console.log("🖥️ UIManager profissional inicializando");
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

    setInterval(() => this.updateTimer(), 1000);
  }

  // ===== SISTEMA DE CACHE DE ELEMENTOS =====
  cacheElements() {
    console.log("📦 Cacheando elementos da UI...");

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
        console.log(`   ✅ #${id} cacheado`);
      } else {
        console.log(`   ⚠️ #${id} não encontrado (usando fallback)`);
        this.elements[id] = this.createFallbackElement(id);
      }
    });

    console.log(
      `📊 Total de elementos cacheados: ${Object.keys(this.elements).length}`,
    );
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
      // Tooltips para botões de ação
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
          selector: "#garage-btn",
          content: "🏢 Gerenciar sua garagem e expansões",
        },
        {
          selector: "#equipment-btn",
          content: "🔧 Gerenciar equipamentos da garagem",
        },
      ];

      tooltips.forEach(({ selector, content }) => {
        const el = document.querySelector(selector);
        if (el && this.tooltips) {
          this.tooltips.attach(el, content, { delay: 500, position: "top" });
        }
      });

      // Tooltips para ferramentas
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
    console.log("🔌 Carregando sistemas...");

    try {
      // Carregar sistemas de UI primeiro
      this.notifications = new NotificationSystem();
      this.sounds = new SoundSystem();
      this.tooltips = new TooltipSystem();
      this.animations = new AnimationSystem();
      console.log("✅ Sistemas de UI carregados");

      // Carregar UpgradeManager
      const upgradeModule = await import("/src/systems/UpgradeManager.js");
      const UpgradeManager =
        upgradeModule.UpgradeManager || upgradeModule.default;
      this.upgradeManager = new UpgradeManager();
      console.log("✅ UpgradeManager carregado");

      // Criar painel de upgrades
      this.upgradePanel = new UpgradePanel(this.upgradeManager);

      // Carregar CustomerSystem
      const customerModule =
        await import("/src/systems/customers/CustomerSystem.js");
      const CustomerSystem =
        customerModule.CustomerSystem || customerModule.default;
      this.customerSystem = new CustomerSystem();
      console.log("✅ CustomerSystem carregado");

      // Criar painel de clientes
      this.customersPanel = new CustomersPanel(this.customerSystem);

      // Carregar EconomySystem
      try {
        const economyModule = await import("/src/systems/EconomySystem.js");
        const EconomySystem =
          economyModule.EconomySystem || economyModule.default;
        this.economySystem = new EconomySystem();
        console.log("✅ EconomySystem carregado");

        const ShopPanel = (await import("/src/ui/ShopPanel.js")).ShopPanel;
        this.shopPanel = new ShopPanel(this.economySystem);
      } catch (err) {
        console.log("⚠️ EconomySystem não disponível:", err);
      }

      // Carregar AchievementSystem
      try {
        const achievementModule =
          await import("/src/systems/AchievementSystem.js");
        const AchievementSystem =
          achievementModule.AchievementSystem || achievementModule.default;
        this.achievementSystem = new AchievementSystem();
        console.log("✅ AchievementSystem carregado");

        const AchievementsPanel = (await import("/src/ui/AchievementsPanel.js"))
          .AchievementsPanel;
        this.achievementsPanel = new AchievementsPanel(this.achievementSystem);
      } catch (err) {
        console.log("⚠️ AchievementSystem não disponível:", err);
      }

      // Carregar Inventory se disponível
      try {
        const inventoryModule = await import("/src/systems/Inventory.js");
        const Inventory = inventoryModule.Inventory || inventoryModule.default;
        this.inventory = new Inventory();
        console.log("✅ Inventory carregado");
      } catch (err) {
        console.log("⚠️ Inventory não disponível:", err);
      }

      try {
        const garageModule = await import("/src/garage/GarageExpansion.js");
        const GarageExpansion =
          garageModule.GarageExpansion || garageModule.default;
        this.garageExpansion = new GarageExpansion();
        console.log("✅ GarageExpansion carregado");

        this.garagePanel = new GaragePanel(this.garageExpansion);
      } catch (err) {
        console.log("⚠️ GarageExpansion não disponível:", err);
      }

      try {
        const equipmentModule =
          await import("/src/systems/EquipmentInteractionSystem.js");
        const EquipmentSystem =
          equipmentModule.EquipmentInteractionSystem || equipmentModule.default;
        this.equipmentSystem = new EquipmentSystem(this.garageExpansion);
        console.log("✅ EquipmentSystem carregado");

        this.equipmentPanel = new EquipmentPanel(
          this.equipmentSystem,
          this.garageExpansion,
        );
      } catch (err) {
        console.log("⚠️ EquipmentSystem não disponível:", err);
      }

      // Carregar sistemas adicionais em segundo plano
      this.loadAdditionalSystems();
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
            console.log("✅ AchievementSystem carregado (tardio)");
          }
        })
        .catch(() => {});

      import("/src/systems/challenges/DailyChallenges.js")
        .then((module) => {
          const DailyChallenges = module.DailyChallenges || module.default;
          this.dailyChallenges = new DailyChallenges();
          console.log("✅ DailyChallenges carregado");
        })
        .catch(() => {});

      import("/src/systems/market/used-parts-market.js")
        .then((module) => {
          const UsedPartsMarket = module.UsedPartsMarket || module.default;
          this.usedPartsMarket = new UsedPartsMarket();
          console.log("✅ UsedPartsMarket carregado");
        })
        .catch(() => {});
    }, 1000);
  }

  // ===== INICIALIZAÇÃO DE EVENTOS =====
  initEventListeners() {
    console.log("🔌 Inicializando event listeners...");

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

    // Botão Estoque
    this.getElement("inventory-btn").addEventListener("click", () => {
      this.sounds?.play("click");
      if (this.inventory) {
        // Implementar painel de inventário
        this.showNotification(
          "📦 Sistema de estoque em desenvolvimento",
          "info",
        );
      } else {
        this.showNotification("❌ Inventário não disponível", "error");
      }
    });

    // Botão Garagem
    const garageBtn = document.getElementById("garage-btn");
    if (garageBtn) {
      garageBtn.addEventListener("click", () => {
        this.sounds?.play("click");
        if (this.garagePanel) {
          this.garagePanel.toggle();
        } else {
          this.showNotification(
            "❌ Sistema de garagem não disponível",
            "error",
          );
        }
      });
    }

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

        // Animação de pulsação
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
        this.showNotification("🔧 Painéis fechados", "info");
      }
    });

    const equipmentBtn = document.getElementById("equipment-btn");
    if (equipmentBtn) {
      equipmentBtn.addEventListener("click", () => {
        this.sounds?.play("click");
        if (this.equipmentPanel) {
          this.equipmentPanel.toggle();
        } else {
          this.showNotification(
            "❌ Sistema de equipamentos não disponível",
            "error",
          );
        }
      });
    }
  }

  initAudioControls() {
    const musicBtn = this.getElement("toggle-music");
    const sfxBtn = this.getElement("toggle-sfx");

    if (musicBtn && this.sounds) {
      musicBtn.addEventListener("click", () => {
        this.sounds.toggle();
        musicBtn.textContent = this.sounds.enabled ? "🔊" : "🔇";
        this.showNotification(
          this.sounds.enabled ? "🔊 Som ativado" : "🔇 Som desativado",
          "info",
        );
        this.sounds?.play("click");
      });
    }

    if (sfxBtn && this.sounds) {
      sfxBtn.addEventListener("click", () => {
        // Efeitos específicos
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

    // Se já existe um job ativo, perguntar se quer substituir
    if (window.gameState.currentJob) {
      if (
        !confirm(
          "Já existe um serviço ativo. Deseja cancelá-lo e iniciar um novo?",
        )
      ) {
        return;
      }
    }

    // Usar CustomerSystem se disponível
    if (this.customerSystem) {
      const job = this.customerSystem.generateJob();
      if (!job) {
        this.showNotification("❌ Erro ao gerar job", "error");
        return;
      }

      window.gameState.currentJob = job;
      window.gameState.currentCar = { parts: job.parts };

      const customer = job.customer;
      const personalityIcon = customer.icon || "👤";
      this.showNotification(
        `🚗 ${personalityIcon} ${customer.name} - R$ ${job.payment}`,
        "success",
      );
      this.sounds?.play("success");

      // Registrar no sistema de conquistas
      if (this.achievementSystem) {
        this.achievementSystem.checkAchievement("jobStarted");
      }
    } else {
      // Fallback para job simples
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
      this.showNotification(`🚗 Novo cliente: ${job.customerName}`, "success");
      this.sounds?.play("success");
    }

    this.updateJobInfo();
    this.updatePartsList();
    this.getElement("deliver-car").disabled = false;

    // Animar botão de entrega
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

    // Usar CustomerSystem se disponível
    if (this.customerSystem && this.customerSystem.currentJob) {
      // Calcular qualidade baseada nas condições das peças
      const parts = window.gameState.currentCar.parts;
      let totalCondition = 0;
      let count = 0;

      Object.values(parts).forEach((part) => {
        totalCondition += part.condition || 0;
        count++;
      });

      const quality = count > 0 ? totalCondition / count : 0;
      const result = this.customerSystem.completeJob(quality);

      if (result) {
        window.gameState.money += result.payment;
        window.gameState.jobsCompleted++;

        // Registrar conquistas
        if (this.achievementSystem) {
          this.achievementSystem.checkAchievement("jobCompleted");
          this.achievementSystem.checkAchievement(
            "moneyEarned",
            result.payment,
          );

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

        const bonusText =
          result.timeBonus > 0 ? ` (bônus R$ ${result.timeBonus})` : "";
        this.showNotification(
          `💰 Serviço concluído! R$ ${result.payment}${bonusText}`,
          "money",
        );
        this.sounds?.play("money");

        if (result.satisfaction >= 80) {
          this.showNotification(`😊 Cliente satisfeito!`, "success");
        } else if (result.satisfaction < 50) {
          this.showNotification(`😞 Cliente insatisfeito...`, "error");
        }
      }
    } else {
      // Fallback simples
      const payment = window.gameState.currentJob.payment || 1000;
      window.gameState.money += payment;
      window.gameState.jobsCompleted++;
      this.showNotification(`💰 Serviço concluído! R$ ${payment}`, "money");
      this.sounds?.play("money");
    }

    window.gameState.currentJob = null;
    window.gameState.currentCar = null;

    this.updateMoney();
    this.updateJobsCompleted();
    this.updateJobInfo();
    this.updatePartsList();
    this.getElement("deliver-car").disabled = true;

    // Animação de fade out do job info
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
      const oldValue = parseInt(moneyEl.textContent?.replace(/\D/g, "") || "0");
      const newValue = window.gameState.money;

      moneyEl.textContent = `R$ ${newValue.toLocaleString()}`;

      // Animação se o valor mudou
      if (oldValue !== newValue && this.animations) {
        this.animations.pulse(moneyEl);
      }
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

    // Usar CustomerSystem se disponível
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
                <div class="job-info-item">
                    <span>Tempo:</span>
                    <span class="${isUrgent}">⏰ ${timeStr}</span>
                </div>
                <div class="job-payment">
                    Pagamento: R$ ${job.payment}
                </div>
            `;
    } else {
      // Fallback simples
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

    // Calcular status geral
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

    let html = `
            <div class="car-status">
                <div class="progress-info">
                    <span>Progresso: ${averageCondition}%</span>
                    <span>Peças perfeitas: ${perfectCount}/${totalParts}</span>
                </div>
                <div class="overall-progress">
                    <div class="progress-bar" style="width: ${averageCondition}%"></div>
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

      // Usar UpgradeManager se disponível para custos
      let repairCost = 5;
      let canRepair = gameState.money >= 5;

      if (this.upgradeManager) {
        const tool = this.upgradeManager.getToolEfficiency(
          gameState.selectedTool,
        );
        repairCost = tool.cost;
        canRepair = gameState.money >= repairCost && condition < 100;
      }

      html += `
                <div class="part-item ${gameState.selectedPart === name ? "selected" : ""}" 
                     data-part="${name}">
                    <div class="part-header">
                        <span class="part-name">${this.getPartDisplayName(name)}</span>
                        <span class="part-condition ${conditionClass}">${condition}% - ${conditionText}</span>
                    </div>
                    <div class="part-progress">
                        <div class="progress-bar" style="width: ${condition}%"></div>
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

    // Adicionar event listeners aos botões
    el.querySelectorAll(".repair-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const partName = btn.dataset.part;
        if (window.repairPart) {
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

  // ===== TIMER =====
  updateTimer() {
    if (window.gameState?.currentJob && this.customerSystem?.currentJob) {
      this.updateJobInfo();

      // Verificar se tempo esgotou
      if (this.customerSystem.getTimeRemaining() <= 0) {
        const customer = this.customerSystem.cancelJob();
        window.gameState.currentJob = null;
        window.gameState.currentCar = null;
        this.updateJobInfo();
        this.updatePartsList();
        this.getElement("deliver-car").disabled = true;

        if (customer) {
          this.showNotification(`⏰ ${customer.name} foi embora!`, "error");
          this.sounds?.play("error");
        } else {
          this.showNotification("⏰ Tempo esgotado!", "error");
          this.sounds?.play("error");
        }
      }
    }
  }

  // ===== NOTIFICAÇÕES =====
  showNotification(message, type = "info", duration = 3000) {
    if (this.notifications) {
      this.notifications.show(message, type, duration);

      // Tocar som correspondente
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
      // Fallback para o sistema antigo
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

  const result = window.gameState.repairPart(partName);

  if (result.success) {
    window.uiManager?.showNotification(result.message, "success");
    window.uiManager?.updatePartsList();
    window.uiManager?.updateMoney();

    window.createRepairEffect?.(partName);

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

// Funções da loja
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

window.buySpecial = (specialId) => {
  window.uiManager?.showNotification(
    "🔧 Funcionalidade em desenvolvimento",
    "info",
  );
};

// Expor globalmente
if (typeof window !== "undefined") {
  window.UIManager = UIManager;
  console.log("🌐 UIManager disponível globalmente");
}
