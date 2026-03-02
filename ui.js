// ui.js

import {
  gameState,
  scene3D,
  upgradeSystem,
  achievementSystem,
  db,
} from "./game.js";
import { TOOL_BASE_STATS, PART_TRANSLATIONS } from "./constants.js";
import { Job } from "./job.js";
import { CustomerCar } from "./car.js";

export class UIManager {
  constructor() {
    this.initEventListeners();
    this.updateToolDisplay();
    setInterval(() => this.updateTimer(), 1000);
  }

  initEventListeners() {
    // Tool selection
    document.querySelectorAll(".tool-item").forEach((tool) => {
      tool.addEventListener("click", () => {
        document
          .querySelectorAll(".tool-item")
          .forEach((t) => t.classList.remove("selected"));
        tool.classList.add("selected");
        gameState.selectedTool = tool.dataset.tool;
        this.showNotification(
          `🔧 Ferramenta: ${TOOL_BASE_STATS[gameState.selectedTool]?.name || "Diagnóstico"}`,
          "info",
        );
        if (gameState.currentCar) this.updatePartsList();
      });
    });

    // New job button
    document.getElementById("new-job").addEventListener("click", () => {
      if (
        gameState.currentJob &&
        !document.getElementById("deliver-car").disabled
      ) {
        if (
          !confirm(
            "Há um carro pronto. Iniciar novo serviço fará você perder o pagamento. Continuar?",
          )
        ) {
          return;
        }
      }

      const job = new Job();
      const car = new CustomerCar(job);

      gameState.currentJob = job;
      gameState.currentCar = car;
      gameState.selectedPart = null;

      scene3D.createCar(car, job);
      this.updateJobInfo();
      this.updatePartsList();

      document.getElementById("deliver-car").disabled = true;
      this.showNotification(
        `🚗 Cliente: ${job.customerName} - Pagamento: R$ ${job.payment}`,
        "success",
      );

      db.saveJob(job);
    });

    // Deliver car button - CORRIGIDO
    document.getElementById("deliver-car").addEventListener("click", () => {
      console.log("🚗 Entregando carro...");

      if (!gameState.currentJob || !gameState.currentCar) {
        console.log("❌ Sem serviço ativo");
        return;
      }

      if (!gameState.currentJob.checkCompletion(gameState.currentCar.parts)) {
        this.showNotification(
          "⚠️ Carro não atende aos requisitos do cliente!",
          "error",
        );
        return;
      }

      // Calcular bônus
      let perfectCount = 0;
      const totalParts = Object.keys(gameState.currentCar.parts).length;

      Object.values(gameState.currentCar.parts).forEach((part) => {
        if (part.condition >= 100) perfectCount++;
      });

      const qualityBonus = Math.min(50, perfectCount * 10);
      const finalPayment = Math.floor(
        gameState.currentJob.payment * (1 + qualityBonus / 100),
      );
      const allPerfect = perfectCount === totalParts;

      // Aplicar recompensas
      gameState.updateMoney(finalPayment);
      gameState.addExperience(500 + (allPerfect ? 300 : 0));
      gameState.updateReputation(allPerfect ? 2 : 1);
      gameState.jobsCompleted++;
      document.getElementById("jobs-completed").textContent =
        gameState.jobsCompleted;

      this.showNotification(
        `💰 Serviço concluído! Pagamento: R$ ${finalPayment}${qualityBonus > 0 ? ` (bônus ${qualityBonus}%)` : ""}`,
        "success",
      );

      if (allPerfect) {
        this.showNotification("✨ SERVIÇO PERFEITO!", "success");
        achievementSystem?.checkAchievements();
      }

      // ===== LIMPEZA COMPLETA =====

      // 1. Limpar cena 3D e labels
      if (scene3D) {
        scene3D.clearAllLabels(); // NOVO MÉTODO
        if (scene3D.currentCar) {
          scene3D.scene.remove(scene3D.currentCar);
          scene3D.currentCar = null;
        }
      }

      // 2. Marcar job como concluído
      if (gameState.currentJob) {
        gameState.currentJob.status = "completed";
        db?.updateJob(gameState.currentJob);
      }

      // 3. Resetar estado
      gameState.currentJob = null;
      gameState.currentCar = null;
      gameState.selectedPart = null;

      // 4. Limpar interface
      const jobInfo = document.getElementById("job-info");
      if (jobInfo) {
        jobInfo.innerHTML =
          '<div style="color: #888; text-align: center; padding: 20px;">🚗 Nenhum serviço ativo</div>';
      }

      const partsList = document.getElementById("parts-list");
      if (partsList) {
        partsList.innerHTML =
          '<div style="color: #888; text-align: center; padding: 20px;">🔧 Nenhum carro na oficina</div>';
      }

      document.getElementById("deliver-car").disabled = true;

      const interactionInfo = document.getElementById("interaction-info");
      if (interactionInfo) {
        interactionInfo.textContent =
          '👆 Clique em "Novo Cliente" para começar um serviço';
      }

      console.log("✅ Serviço finalizado e interface limpa");

      achievementSystem?.checkAchievements();
      db?.savePlayerData();
    });

    // Upgrade shop button
    document
      .getElementById("upgrade-shop-btn")
      .addEventListener("click", () => this.openUpgradeShop());

    // Audio controls
    document.getElementById("toggle-music").addEventListener("click", () => {
      const isEnabled = audioManager.toggleMusic();
      const btn = document.getElementById("toggle-music");
      btn.textContent = isEnabled ? "🎵" : "🔇";
      btn.classList.toggle("muted", !isEnabled);
    });

    document.getElementById("toggle-sfx").addEventListener("click", () => {
      const isEnabled = audioManager.toggleSFX();
      const btn = document.getElementById("toggle-sfx");
      btn.textContent = isEnabled ? "🔊" : "🔈";
      btn.classList.toggle("muted", !isEnabled);
    });

    // Botão do estoque (adicionar no bottom panel)
    document.getElementById("inventory-btn").addEventListener("click", () => {
      this.toggleInventoryPanel();
    });

    // Botão comprar para estoque (na lista de peças)
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("buy-to-stock-btn")) {
        const partName = e.target.dataset.part;
        this.buyPartToStock(partName);
      }
    });

    // Adicionar sons aos botões existentes
    document
      .querySelectorAll(".action-btn, .tool-item, .upgrade-buy")
      .forEach((btn) => {
        btn.addEventListener("click", () => audioManager.playSound("click"));
      });

    // Sons específicos
    document
      .getElementById("new-job")
      .addEventListener("click", () => audioManager.playSound("newJob"));
    document
      .getElementById("deliver-car")
      .addEventListener("click", () => audioManager.playSound("deliver"));

    // Substitua as notificações para incluir som
    const originalShowNotification = this.showNotification;
    this.showNotification = (message, type) => {
      if (type === "success") audioManager.playSound("success");
      if (type === "error") audioManager.playSound("error");
      originalShowNotification.call(this, message, type);
    };
  }

  // ===== MÉTODOS DA CLASSE =====

  forceUIRefresh() {
    // Garantir que não há elementos residuais
    const partsContainer = document.getElementById("parts-list");
    if (partsContainer && partsContainer.children.length === 0) {
      partsContainer.innerHTML =
        '<div style="color: #888; text-align: center; padding: 20px;">🔧 Nenhum carro na oficina</div>';
    }

    const jobContainer = document.getElementById("job-info");
    if (jobContainer && jobContainer.children.length === 0) {
      jobContainer.innerHTML =
        '<div style="color: #888; text-align: center; padding: 20px;">🚗 Nenhum serviço ativo</div>';
    }
  }

  updateJobInfo() {
    const jobInfo = document.getElementById("job-info");
    if (!gameState.currentJob) {
      jobInfo.innerHTML =
        '<div style="color: #888; text-align: center; padding: 20px;">🚗 Nenhum serviço ativo</div>';
      return;
    }

    const remaining = gameState.currentJob.getRemainingParts(
      gameState.currentCar.parts,
    );
    const timeRemaining = gameState.currentJob.getTimeRemaining();
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    const progress = gameState.currentJob.getProgress(
      gameState.currentCar.parts,
    );

    let difficultyClass = `difficulty-${gameState.currentJob.difficulty}`;
    let difficultyText =
      gameState.currentJob.difficulty === "easy"
        ? "Fácil"
        : gameState.currentJob.difficulty === "medium"
          ? "Médio"
          : "Difícil";

    jobInfo.innerHTML = `
            <div class="job-header">
                <span class="job-customer">${gameState.currentJob.customerName}</span>
                <span class="job-difficulty ${difficultyClass}">${difficultyText}</span>
            </div>
            <div class="job-info-item">
                <span class="job-info-label">Carro:</span>
                <span class="job-info-value">${gameState.currentJob.carModel}</span>
            </div>
            <div class="job-info-item">
                <span class="job-info-label">Progresso:</span>
                <span class="job-info-value">${progress}%</span>
            </div>
            <div class="job-info-item">
                <span class="job-info-label">Peças pendentes:</span>
                <span class="job-info-value">${remaining.length}</span>
            </div>
            <div class="job-timer ${timeRemaining < 60000 ? "timer-urgent" : ""}">
                ⏰ ${minutes}:${seconds.toString().padStart(2, "0")}
            </div>
            <div class="job-payment">
                Pagamento: R$ ${gameState.currentJob.payment}
            </div>
        `;
  }

  // ui.js - updatePartsList COMPLETA CORRIGIDA

  // ui.js - updatePartsList com BARRA COLORIDA

  updatePartsList() {
    const partsList = document.getElementById("parts-list");

    if (!gameState.currentCar || !gameState.currentJob) {
      partsList.innerHTML =
        '<div style="color: #888; text-align: center; padding: 20px;">🔧 Nenhum carro na oficina</div>';
      return;
    }

    partsList.innerHTML = "";

    Object.entries(gameState.currentCar.parts).forEach(
      ([partName, partData]) => {
        const displayName = PART_TRANSLATIONS[partName].display;
        const icon = PART_TRANSLATIONS[partName].icon;

        const condition = Math.min(100, Math.round(partData.condition));
        const targetCondition = Math.min(
          100,
          Math.round(gameState.currentJob.targetConditions[partName]),
        );

        // Determinar classe de cor para o badge
        let conditionClass = "";
        let displayText = "";
        let barColor = ""; // Classe extra para a cor da barra

        if (condition === 100) {
          conditionClass = "condition-good";
          displayText = `100%`;
          barColor = "progress-good"; // Barra verde
        } else if (condition >= targetCondition) {
          conditionClass = "condition-good";
          displayText = `${condition}% ✓`;
          barColor = "progress-good"; // Barra verde
        } else if (condition >= targetCondition * 0.7) {
          conditionClass = "condition-medium";
          displayText = `${condition}% / ${targetCondition}%`;
          barColor = "progress-medium"; // Barra amarela
        } else {
          conditionClass = "condition-bad";
          displayText = `${condition}% / ${targetCondition}%`;
          barColor = "progress-bad"; // Barra vermelha
        }

        const toolStats = upgradeSystem?.getToolStats(
          gameState.selectedTool,
        ) || { repair: 0, cost: 0 };
        const repairEfficiency =
          upgradeSystem?.calculateRepairEfficiency(toolStats.repair) || 0;
        const repairCost =
          upgradeSystem?.calculateRepairCost(toolStats.cost) || 0;
        const partPrice =
          upgradeSystem?.calculatePartPrice(partData.price) || partData.price;

        const canRepair =
          gameState.money >= repairCost &&
          condition < targetCondition &&
          condition < 100 &&
          gameState.selectedTool !== "diagnostic";

        const canBuy =
          gameState.money >= partPrice &&
          condition < targetCondition &&
          condition < 100;

        let progressPercent = 0;
        let showTargetMarker = true;

        if (condition === 100) {
          progressPercent = 100;
          showTargetMarker = false;
        } else {
          progressPercent = Math.min(100, (condition / targetCondition) * 100);
          showTargetMarker = true;
        }

        const targetPosition = (targetCondition / 100) * 100;

        const partElement = document.createElement("div");
        partElement.className = `part-item ${gameState.selectedPart === partName ? "selected" : ""}`;

        // ===== CORREÇÃO: Barra de progresso com cor dinâmica =====
        const progressBarHTML = `
            <div class="part-progress">
                <div class="progress-bar ${barColor}" style="width: ${progressPercent}%"></div>
                ${showTargetMarker ? `<div class="target-marker" style="left: ${targetPosition}%"></div>` : ""}
            </div>
        `;

        partElement.innerHTML = `
            <div class="part-header">
                <span class="part-name">${icon} ${displayName}</span>
                <span class="part-condition-badge ${conditionClass}">${displayText}</span>
            </div>
            ${progressBarHTML}
            <div class="part-details">
                <div>🔧 Reparo: +${repairEfficiency}% | R$ ${repairCost}</div>
                <div class="part-price">🛒 Nova: R$ ${partPrice}</div>
            </div>
            <div class="part-actions">
                <button class="part-action-btn repair-btn" ${!canRepair ? "disabled" : ""} onclick="repairPart('${partName}')">
                    🔧 Reparar
                </button>
                <button class="part-action-btn buy-btn" ${!canBuy ? "disabled" : ""} onclick="buyNewPart('${partName}')">
                    🛒 Comprar Nova
                </button>
            </div>
            <div style="margin-top: 5px;">
    <button class="buy-to-stock-btn" data-part="${partName}" onclick="uiManager?.buyPartToStock('${partName}')">
        📦 + Estoque (R$ 500)
    </button>
</div>
        `;

        partElement.addEventListener("click", (e) => {
          if (!e.target.classList.contains("part-action-btn")) {
            scene3D?.selectPart(partName);
          }
        });

        partsList.appendChild(partElement);
      },
    );
  }

  updateToolDisplay() {
    document.querySelectorAll(".tool-item").forEach((tool) => {
      const toolId = tool.dataset.tool;
      if (toolId === "diagnostic") return;

      const stats = upgradeSystem?.getToolStats(toolId);
      if (!stats) return;

      const toolInfo = tool.querySelector(".tool-info");
      if (toolInfo) {
        toolInfo.innerHTML = `
                    <div class="tool-name">${stats.name} Nv.${stats.level}</div>
                    <div class="tool-stats">+${stats.repair}% | R$ ${stats.cost}</div>
                `;
      }
    });
  }

  updateUpgradeShop() {
    const toolUpgrades = document.getElementById("tool-upgrades");
    const workshopUpgrades = document.getElementById("workshop-upgrades");
    const skillUpgrades = document.getElementById("skill-upgrades");

    if (!toolUpgrades || !workshopUpgrades || !skillUpgrades) return;

    // Tool upgrades
    toolUpgrades.innerHTML = "";
    Object.entries(upgradeSystem?.toolLevels || {}).forEach(
      ([toolId, level]) => {
        if (level >= 5) return;

        const tool = TOOL_BASE_STATS[toolId];
        const price = 500 * level;
        const canBuy = gameState.money >= price;

        const element = document.createElement("div");
        element.className = "upgrade-item";
        element.innerHTML = `
                <div class="upgrade-info">
                    <div class="upgrade-name">${tool.icon} ${tool.name}</div>
                    <div class="upgrade-desc">Nível ${level} → ${level + 1}</div>
                    <div class="upgrade-level">+20% eficiência, +10% custo</div>
                </div>
                <span class="upgrade-price">R$ ${price}</span>
                <button class="upgrade-buy" onclick="upgradeTool('${toolId}')" ${!canBuy ? "disabled" : ""}>Upgrade</button>
            `;
        toolUpgrades.appendChild(element);
      },
    );

    // Workshop upgrades
    workshopUpgrades.innerHTML = "";
    Object.entries(upgradeSystem?.workshopUpgrades || {}).forEach(
      ([upgradeId, upgrade]) => {
        if (upgrade.level >= upgrade.maxLevel) return;

        const price = upgrade.price * (upgrade.level + 1);
        const canBuy = gameState.money >= price;

        const element = document.createElement("div");
        element.className = "upgrade-item";
        element.innerHTML = `
                <div class="upgrade-info">
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-desc">${upgrade.desc}</div>
                    <div class="upgrade-level">Nível ${upgrade.level}/${upgrade.maxLevel}</div>
                </div>
                <span class="upgrade-price">R$ ${price}</span>
                <button class="upgrade-buy" onclick="upgradeWorkshop('${upgradeId}')" ${!canBuy ? "disabled" : ""}>Upgrade</button>
            `;
        workshopUpgrades.appendChild(element);
      },
    );

    // Skill upgrades
    skillUpgrades.innerHTML = "";
    Object.entries(upgradeSystem?.skillUpgrades || {}).forEach(
      ([skillId, skill]) => {
        if (skill.level >= skill.maxLevel) return;

        const price = skill.price * (skill.level + 1);
        const canBuy = gameState.money >= price;

        const element = document.createElement("div");
        element.className = "upgrade-item";
        element.innerHTML = `
                <div class="upgrade-info">
                    <div class="upgrade-name">${skill.name}</div>
                    <div class="upgrade-desc">${skill.desc}</div>
                    <div class="upgrade-level">Nível ${skill.level}/${skill.maxLevel}</div>
                </div>
                <span class="upgrade-price">R$ ${price}</span>
                <button class="upgrade-buy" onclick="upgradeSkill('${skillId}')" ${!canBuy ? "disabled" : ""}>Upgrade</button>
            `;
        skillUpgrades.appendChild(element);
      },
    );
  }

  checkJobCompletion() {
    if (!gameState.currentJob || !gameState.currentCar) return;
    const completed = gameState.currentJob.checkCompletion(
      gameState.currentCar.parts,
    );
    document.getElementById("deliver-car").disabled = !completed;
  }

  updateTimer() {
    if (gameState.currentJob && !gameState.currentJob.isExpired()) {
      this.updateJobInfo();

      if (gameState.currentJob.isExpired()) {
        this.showNotification(
          "⏰ Tempo esgotado! O cliente foi embora.",
          "error",
        );

        if (scene3D?.currentCar) {
          scene3D.scene.remove(scene3D.currentCar);
          scene3D.currentCar = null;
        }

        gameState.currentJob = null;
        gameState.currentCar = null;
        gameState.selectedPart = null;
        gameState.updateReputation(-1);

        document.getElementById("job-info").innerHTML =
          '<div style="color: #888; text-align: center;">Nenhum serviço ativo</div>';
        document.getElementById("parts-list").innerHTML =
          '<div style="color: #888; text-align: center;">Nenhum carro no momento</div>';
        document.getElementById("deliver-car").disabled = true;
      }
    }
  }

  // FUNÇÃO showNotification CORRIGIDA (notificações somem completamente)
  showNotification(message, type = "info") {
    const notification = document.getElementById("notification");

    // Limpar qualquer timeout anterior
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    // Resetar a notificação
    notification.classList.remove("show");
    notification.style.transform = "translateX(400px)";

    // Forçar reflow
    void notification.offsetWidth;

    // Configurar nova notificação
    notification.textContent = message;
    notification.style.backgroundColor =
      type === "error" ? "#ff3333" : type === "success" ? "#00aa00" : "#ff6b00";

    // Mostrar
    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    // Esconder após 3 segundos
    this.notificationTimeout = setTimeout(() => {
      notification.classList.remove("show");

      // Limpar completamente após a animação
      setTimeout(() => {
        notification.style.transform = "translateX(400px)";
      }, 300);
    }, 3000);
  }

  openUpgradeShop() {
    document.getElementById("upgrade-shop").classList.add("show");
    this.updateUpgradeShop();
  }

  closeUpgradeShop() {
    document.getElementById("upgrade-shop").classList.remove("show");
  }

  toggleInventoryPanel() {
    const panel = document.getElementById("inventory-panel");
    if (panel) {
      if (panel.classList.contains("show")) {
        this.closeInventory();
      } else {
        this.openInventory();
      }
    }
  }

  openInventory() {
    const panel = document.getElementById("inventory-panel");
    if (panel) {
      panel.classList.add("show");
      this.updateInventoryDisplay();
    }
  }

  closeInventory() {
    const panel = document.getElementById("inventory-panel");
    if (panel) {
      panel.classList.remove("show");
    }
  }

  updateInventoryDisplay() {
    const grid = document.getElementById("inventory-grid");
    const capacityEl = document.getElementById("inventory-capacity");
    const valueEl = document.getElementById("inventory-value");

    if (!grid || !capacityEl || !valueEl) return;

    const stats = inventory.getStats();
    capacityEl.textContent = `${stats.usedCapacity}/${stats.maxCapacity}`;
    valueEl.textContent = `R$ ${stats.totalValue}`;

    grid.innerHTML = "";

    Object.entries(inventory.parts).forEach(([partName, quantity]) => {
      if (quantity > 0) {
        const item = document.createElement("div");
        item.className = "inventory-item";
        item.innerHTML = `
                <div class="inventory-item-icon">${PART_TRANSLATIONS[partName].icon}</div>
                <div class="inventory-item-info">
                    <div class="inventory-item-name">${PART_TRANSLATIONS[partName].display}</div>
                    <div class="inventory-item-quantity">Quantidade: <span>${quantity}</span></div>
                </div>
            `;
        grid.appendChild(item);
      }
    });

    // Se estoque vazio
    if (grid.children.length === 0) {
      grid.innerHTML =
        '<div style="grid-column: span 2; text-align: center; padding: 40px; color: #888;">📦 Estoque vazio</div>';
    }
  }

  buyPartToStock(partName) {
    const partPrice = 500; // Preço fixo para simplificar
    if (gameState.money >= partPrice) {
      if (inventory.addPart(partName)) {
        gameState.updateMoney(-partPrice);
        this.updateInventoryDisplay();
        uiManager?.showNotification(
          `📦 Comprou ${PART_TRANSLATIONS[partName].display} para o estoque!`,
          "success",
        );
      } else {
        uiManager?.showNotification(
          "❌ Estoque cheio! Faça upgrade da capacidade.",
          "error",
        );
      }
    } else {
      uiManager?.showNotification("💰 Dinheiro insuficiente!", "error");
    }
  }
}
