// ui.js - GERENCIADOR DE INTERFACE OTIMIZADO

import {
  gameState,
  scene3D,
  upgradeSystem,
  achievementSystem,
  db,
  audioManager,
  inventory,
  specializationSystem,
} from "./game.js";
import { TOOL_BASE_STATS, PART_TRANSLATIONS } from "./constants.js";
import { Job } from "./job.js";
import { CustomerCar } from "./car.js";

export class UIManager {
  constructor() {
    this.notificationTimeout = null;
    this.initEventListeners();
    this.updateToolDisplay();
    setInterval(() => this.updateTimer(), 1000);
    this.handleTabClick = this.handleTabClick.bind(this);
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
        )
          return;
      }

      const job = new Job();
      const car = new CustomerCar(job);

      gameState.currentJob = job;
      gameState.currentCar = car;
      gameState.selectedPart = null;

      scene3D?.createCar(car, job);
      this.updateJobInfo();
      this.updatePartsList();

      document.getElementById("deliver-car").disabled = true;
      this.showNotification(
        `🚗 Cliente: ${job.customerName} - Pagamento: R$ ${job.payment}`,
        "success",
      );

      db.saveJob(job);
      audioManager?.playSound("newJob");
    });

    // Deliver car button
    document.getElementById("deliver-car").addEventListener("click", () => {
      if (!gameState.currentJob || !gameState.currentCar) return;

      if (!gameState.currentJob.checkCompletion(gameState.currentCar.parts)) {
        this.showNotification("⚠️ Carro não atende aos requisitos!", "error");
        return;
      }

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
      audioManager?.playSound("deliver");

      if (allPerfect) {
        this.showNotification("✨ SERVIÇO PERFEITO!", "success");
        achievementSystem?.checkAchievements();
      }

      if (scene3D) {
        scene3D.clearAllLabels();
        if (scene3D.currentCar) {
          scene3D.scene.remove(scene3D.currentCar);
          scene3D.currentCar = null;
        }
      }

      if (gameState.currentJob) {
        gameState.currentJob.status = "completed";
        db?.updateJob(gameState.currentJob);
      }

      gameState.currentJob = null;
      gameState.currentCar = null;
      gameState.selectedPart = null;

      document.getElementById("job-info").innerHTML =
        '<div style="color: #888; text-align: center; padding: 20px;">🚗 Nenhum serviço ativo</div>';
      document.getElementById("parts-list").innerHTML =
        '<div style="color: #888; text-align: center; padding: 20px;">🔧 Nenhum carro na oficina</div>';
      document.getElementById("deliver-car").disabled = true;
      document.getElementById("interaction-info").textContent =
        '👆 Clique em "Novo Cliente" para começar';

      achievementSystem?.checkAchievements();
      db?.savePlayerData();
    });

    // Inventory button
    document.getElementById("inventory-btn").addEventListener("click", () => {
      this.toggleInventoryPanel();
    });

    // Upgrade shop button
    document
      .getElementById("upgrade-shop-btn")
      .addEventListener("click", () => {
        this.openUpgradeShop();
      });

    // Audio controls
    document.getElementById("toggle-music").addEventListener("click", () => {
      const isEnabled = audioManager?.toggleMusic();
      const btn = document.getElementById("toggle-music");
      if (btn) {
        btn.textContent = isEnabled ? "🎵" : "🔇";
        btn.classList.toggle("muted", !isEnabled);
      }
    });

    document.getElementById("toggle-sfx").addEventListener("click", () => {
      const isEnabled = audioManager?.toggleSFX();
      const btn = document.getElementById("toggle-sfx");
      if (btn) {
        btn.textContent = isEnabled ? "🔊" : "🔈";
        btn.classList.toggle("muted", !isEnabled);
      }
    });

    // Close buttons
    const closeUpgradeBtn = document.getElementById("close-upgrade-shop");
    if (closeUpgradeBtn) {
      closeUpgradeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.closeUpgradeShop();
      });
    }

    const closeInventoryBtn = document.getElementById("close-inventory-panel");
    if (closeInventoryBtn) {
      closeInventoryBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.closeInventory();
      });
    }

    // Click outside to close
    const upgradeShop = document.getElementById("upgrade-shop");
    if (upgradeShop) {
      upgradeShop.addEventListener("click", (e) => {
        if (e.target === upgradeShop) this.closeUpgradeShop();
      });
    }

    const inventoryPanel = document.getElementById("inventory-panel");
    if (inventoryPanel) {
      inventoryPanel.addEventListener("click", (e) => {
        if (e.target === inventoryPanel) this.closeInventory();
      });
    }

    // Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeUpgradeShop();
        this.closeInventory();
      }
    });

    // Upgrade inventory button
    const upgradeInventoryBtn = document.getElementById("upgrade-inventory");
    if (upgradeInventoryBtn) {
      upgradeInventoryBtn.addEventListener("click", () => {
        this.upgradeInventory();
      });
    }
  }

  // ===== MÉTODOS DE INTERFACE =====

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

    const difficultyClass = `difficulty-${gameState.currentJob.difficulty}`;
    const difficultyText =
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

        let conditionClass = "";
        let displayText = "";

        if (condition === 100) {
          conditionClass = "condition-good";
          displayText = `100%`;
        } else if (condition >= targetCondition) {
          conditionClass = "condition-good";
          displayText = `${condition}% ✓`;
        } else if (condition >= targetCondition * 0.7) {
          conditionClass = "condition-medium";
          displayText = `${condition}% / ${targetCondition}%`;
        } else {
          conditionClass = "condition-bad";
          displayText = `${condition}% / ${targetCondition}%`;
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
        const stockQuantity = inventory?.getPartCount(partName) || 0;

        const canRepair =
          gameState.money >= repairCost &&
          condition < targetCondition &&
          condition < 100 &&
          gameState.selectedTool !== "diagnostic";
        const canBuy =
          gameState.money >= partPrice &&
          condition < targetCondition &&
          condition < 100;

        const progressPercent =
          condition === 100
            ? 100
            : Math.min(100, (condition / targetCondition) * 100);
        const targetPosition = (targetCondition / 100) * 100;

        const partElement = document.createElement("div");
        partElement.className = `part-item ${gameState.selectedPart === partName ? "selected" : ""}`;

        partElement.innerHTML = `
                <div class="part-header">
                    <span class="part-name">${icon} ${displayName}</span>
                    <span class="part-condition-badge ${conditionClass}">${displayText}</span>
                </div>
                <div class="part-progress">
                    <div class="progress-bar" style="width: ${progressPercent}%"></div>
                    ${condition !== 100 ? `<div class="target-marker" style="left: ${targetPosition}%"></div>` : ""}
                </div>
                <div class="part-details">
                    <div>🔧 Reparo: +${repairEfficiency}% | R$ ${repairCost}</div>
                    <div class="part-price">🛒 Nova: R$ ${partPrice}</div>
                </div>
                <div class="part-actions">
                    <button class="part-action-btn repair-btn" ${!canRepair ? "disabled" : ""} onclick="repairPart('${partName}')">🔧 Reparar</button>
                    <button class="part-action-btn buy-btn" ${!canBuy ? "disabled" : ""} onclick="buyNewPart('${partName}')">🛒 Comprar Nova</button>
                </div>
                <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #888; font-size: 11px;">📦 Estoque: <span style="color: #ffd700; font-weight: bold;">${stockQuantity}</span></span>
                    <button class="buy-to-stock-btn" data-part="${partName}" onclick="uiManager?.buyPartToStock('${partName}')">📦 Comprar p/ Estoque (R$ 500)</button>
                </div>
            `;

        partElement.addEventListener("click", (e) => {
          if (
            !e.target.classList.contains("part-action-btn") &&
            !e.target.classList.contains("buy-to-stock-btn")
          ) {
            scene3D?.selectPart(partName);
          }
        });

        partsList.appendChild(partElement);
      },
    );
  }

  updateToolDisplay() {
    const container = document.getElementById("tool-upgrades");
    if (!container || !upgradeSystem) return;

    container.innerHTML = "";

    Object.entries(upgradeSystem.toolLevels).forEach(([toolId, level]) => {
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
      container.appendChild(element);
    });
  }

  updateWorkshopDisplay() {
    const container = document.getElementById("workshop-upgrades");
    if (!container || !upgradeSystem) return;

    container.innerHTML = "";

    Object.entries(upgradeSystem.workshopUpgrades).forEach(
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
        container.appendChild(element);
      },
    );
  }

  updateSkillsDisplay() {
    const container = document.getElementById("skill-upgrades");
    if (!container || !upgradeSystem) return;

    container.innerHTML = "";

    Object.entries(upgradeSystem.skillUpgrades).forEach(([skillId, skill]) => {
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
      container.appendChild(element);
    });
  }

  updateSpecializationsDisplay() {
    const container = document.getElementById("specializations-list");
    const statsEl = document.getElementById("specializations-stats");

    if (!container || !statsEl || !specializationSystem) return;

    const stats = specializationSystem.getStats();
    statsEl.innerHTML = `
            <div style="display: flex; justify-content: space-around;">
                <div><div style="color: #888;">Níveis</div><div style="color: #ff6b00; font-size: 18px;">${stats.totalLevels}/${stats.maxPossible}</div></div>
                <div><div style="color: #888;">Progresso</div><div style="color: #4CAF50; font-size: 18px;">${stats.completionPercent}%</div></div>
                <div><div style="color: #888;">Total Gasto</div><div style="color: #ffd700; font-size: 18px;">R$ ${stats.totalSpent}</div></div>
            </div>
        `;

    container.innerHTML = "";

    Object.values(specializationSystem.specializations).forEach((spec) => {
      const nextPrice = specializationSystem.getNextLevelPrice(spec.id);
      const canBuy = nextPrice ? gameState.money >= nextPrice : false;
      const progressPercent = (spec.level / spec.maxLevel) * 100;

      const item = document.createElement("div");
      item.className = "specialization-item";

      let buyButton = "";
      if (spec.level >= spec.maxLevel) {
        buyButton = `<button class="specialization-buy maxed" disabled>⭐ Nível Máximo</button>`;
      } else {
        buyButton = `<button class="specialization-buy" onclick="uiManager?.buySpecialization('${spec.id}')" ${!canBuy ? "disabled" : ""}>
                                Comprar Nível ${spec.level + 1} (R$ ${nextPrice})
                            </button>`;
      }

      item.innerHTML = `
                <div class="specialization-header">
                    <span class="specialization-icon">${spec.icon}</span>
                    <div class="specialization-info">
                        <div class="specialization-name">${spec.name}</div>
                        <div class="specialization-desc">${spec.desc}</div>
                    </div>
                </div>
                <div class="specialization-level">
                    <div class="level-bar"><div class="level-progress" style="width: ${progressPercent}%"></div></div>
                    <span class="level-text">Nv. ${spec.level}/${spec.maxLevel}</span>
                </div>
                <div class="specialization-bonus">Bônus: +${Math.round(spec.bonus * spec.level * 100)}%</div>
                ${buyButton}
            `;

      container.appendChild(item);
    });
  }

  updateUpgradeShop() {
    // Atualizar cada aba separadamente
    this.updateToolDisplay();
    this.updateWorkshopDisplay();
    this.updateSkillsDisplay();
    this.updateSpecializationsDisplay();

    // Garantir que a loja mantenha o tamanho fixo
    const shop = document.getElementById("upgrade-shop");
    if (shop) {
      shop.style.width = "700px";
      shop.style.height = "600px";
    }
  }

  // ===== MÉTODOS DE AÇÃO =====

  buySpecialization(specId) {
    if (!specializationSystem) return;
    const result = specializationSystem.buySpecialization(specId);
    if (result.success) {
      this.updateSpecializationsDisplay();
      this.showNotification(result.message, "success");
    } else {
      this.showNotification(result.message, "error");
    }
  }

  toggleInventoryPanel() {
    const panel = document.getElementById("inventory-panel");
    if (panel) {
      panel.classList.contains("show")
        ? this.closeInventory()
        : this.openInventory();
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
    if (panel) panel.classList.remove("show");
  }

  updateInventoryDisplay() {
    const grid = document.getElementById("inventory-grid");
    const capacityEl = document.getElementById("inventory-capacity");
    const valueEl = document.getElementById("inventory-value");

    if (!grid || !capacityEl || !valueEl || !inventory) return;

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

    if (grid.children.length === 0) {
      grid.innerHTML =
        '<div style="grid-column: span 2; text-align: center; padding: 40px; color: #888;">📦 Estoque vazio</div>';
    }
  }

  buyPartToStock(partName) {
    if (!inventory) return;

    const partPrice = 500;
    if (gameState.money >= partPrice) {
      if (inventory.addPart(partName)) {
        gameState.updateMoney(-partPrice);
        this.updateInventoryDisplay();
        this.updatePartsList();
        this.showNotification(
          `📦 Comprou ${PART_TRANSLATIONS[partName].display} para o estoque!`,
          "success",
        );
      } else {
        this.showNotification("❌ Estoque cheio! Faça upgrade.", "error");
      }
    } else {
      this.showNotification("💰 Dinheiro insuficiente!", "error");
    }
  }

  upgradeInventory() {
    if (!inventory) return;

    const upgradePrice = 1000;
    if (gameState.money >= upgradePrice) {
      inventory.upgradeCapacity(2);
      gameState.updateMoney(-upgradePrice);
      this.updateInventoryDisplay();
      this.showNotification("📦 Capacidade aumentada!", "success");
    } else {
      this.showNotification("💰 Dinheiro insuficiente!", "error");
    }
  }

  openUpgradeShop() {
    const shop = document.getElementById("upgrade-shop");
    if (shop) {
      shop.classList.add("show");

      // Forçar dimensões fixas
      shop.style.width = "700px";
      shop.style.height = "600px";

      this.updateUpgradeShop();

      // Remover listeners antigos e adicionar novos
      document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.removeEventListener("click", this.handleTabClick);
        btn.addEventListener("click", this.handleTabClick);
      });

      // Ativar primeira aba se nenhuma estiver ativa
      if (!document.querySelector(".tab-btn.active")) {
        const firstTab = document.querySelector(".tab-btn");
        if (firstTab) {
          firstTab.classList.add("active");
          const firstTabId = firstTab.dataset.tab;
          document
            .querySelectorAll(".tab-content")
            .forEach((c) => c.classList.remove("active"));
          const firstContent = document.getElementById(`${firstTabId}-tab`);
          if (firstContent) firstContent.classList.add("active");
        }
      }
    }
  }

  closeUpgradeShop() {
    const shop = document.getElementById("upgrade-shop");
    if (shop) shop.classList.remove("show");
  }

  handleTabClick(e) {
    const tab = e.target.dataset.tab;

    // Atualizar abas
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    e.target.classList.add("active");

    // Atualizar conteúdo
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.remove("active"));
    const activeTab = document.getElementById(`${tab}-tab`);
    if (activeTab) {
      activeTab.classList.add("active");

      // Garantir que o scroll comece do topo
      activeTab.scrollTop = 0;
    }

    // Garantir que a loja mantenha o tamanho fixo
    const shop = document.getElementById("upgrade-shop");
    if (shop) {
      shop.style.width = "700px";
      shop.style.height = "600px";
    }
  }

  checkJobCompletion() {
    if (!gameState.currentJob || !gameState.currentCar) return;
    document.getElementById("deliver-car").disabled =
      !gameState.currentJob.checkCompletion(gameState.currentCar.parts);
  }

  updateTimer() {
    if (gameState.currentJob && !gameState.currentJob.isExpired()) {
      this.updateJobInfo();
      if (gameState.currentJob.isExpired()) {
        this.showNotification("⏰ Tempo esgotado!", "error");
        if (scene3D?.currentCar) scene3D.scene.remove(scene3D.currentCar);
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

  showNotification(message, type = "info") {
    const notification = document.getElementById("notification");
    if (!notification) return;

    if (this.notificationTimeout) clearTimeout(this.notificationTimeout);

    notification.classList.remove("show");
    notification.style.transform = "translateX(400px)";
    void notification.offsetWidth;

    notification.textContent = message;
    notification.style.backgroundColor =
      type === "error" ? "#ff3333" : type === "success" ? "#00aa00" : "#ff6b00";

    setTimeout(() => notification.classList.add("show"), 10);

    this.notificationTimeout = setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(
        () => (notification.style.transform = "translateX(400px)"),
        300,
      );
    }, 3000);
  }
}
