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

  updatePartsList() {
    const partsList = document.getElementById("parts-list");

    // SE NÃO HOUVER CARRO OU JOB, MOSTRAR MENSAGEM VAZIA
    if (!gameState.currentCar || !gameState.currentJob) {
      partsList.innerHTML =
        '<div style="color: #888; text-align: center; padding: 20px;">🔧 Nenhum carro na oficina</div>';
      return;
    }

    partsList.innerHTML = ""; // Limpar lista atual

    Object.entries(gameState.currentCar.parts).forEach(
      ([partName, partData]) => {
        const displayName = PART_TRANSLATIONS[partName].display;
        const icon = PART_TRANSLATIONS[partName].icon;

        // GARANTIR QUE PORCENTAGEM NUNCA PASSA DE 100%
        const condition = Math.min(100, Math.round(partData.condition));
        const targetCondition = Math.min(
          100,
          Math.round(gameState.currentJob.targetConditions[partName]),
        );

        // Determinar a classe de cor baseada no status da peça
        let conditionClass = "";
        let displayText = "";

        if (condition === 100) {
          // Peça perfeita (100%) - VERDE
          conditionClass = "condition-good";
          displayText = `100%`;
        } else if (condition >= targetCondition) {
          // Peça atingiu a meta mas não está 100% - VERDE
          conditionClass = "condition-good";
          displayText = `${condition}% ✓`;
        } else if (condition >= targetCondition * 0.7) {
          // Peça próximo da meta (70-99% da meta) - AMARELO
          conditionClass = "condition-medium";
          displayText = `${condition}% / ${targetCondition}%`;
        } else {
          // Peça longe da meta (<70% da meta) - VERMELHO
          conditionClass = "condition-bad";
          displayText = `${condition}% / ${targetCondition}%`;
        }

        // Estatísticas de ferramentas e preços
        const toolStats = upgradeSystem?.getToolStats(
          gameState.selectedTool,
        ) || { repair: 0, cost: 0 };
        const repairEfficiency =
          upgradeSystem?.calculateRepairEfficiency(toolStats.repair) || 0;
        const repairCost =
          upgradeSystem?.calculateRepairCost(toolStats.cost) || 0;
        const partPrice =
          upgradeSystem?.calculatePartPrice(partData.price) || partData.price;

        // Lógica para habilitar/desabilitar botões
        const canRepair =
          gameState.money >= repairCost &&
          condition < targetCondition &&
          condition < 100 &&
          gameState.selectedTool !== "diagnostic";

        const canBuy =
          gameState.money >= partPrice &&
          condition < targetCondition &&
          condition < 100;

        // Calcular progresso da barra
        let progressPercent = 0;
        let showTargetMarker = true;

        if (condition === 100) {
          // Peça perfeita - barra cheia e sem marcador
          progressPercent = 100;
          showTargetMarker = false;
        } else {
          // Progresso normal em relação à meta
          progressPercent = Math.min(100, (condition / targetCondition) * 100);
          showTargetMarker = true;
        }

        const targetPosition = (targetCondition / 100) * 100;

        // CRIAR ELEMENTO DA PEÇA
        const partElement = document.createElement("div");
        partElement.className = `part-item ${gameState.selectedPart === partName ? "selected" : ""}`;

        // Montar HTML da barra de progresso
        const progressBarHTML = `
            <div class="part-progress">
                <div class="progress-bar" style="width: ${progressPercent}%"></div>
                ${showTargetMarker ? `<div class="target-marker" style="left: ${targetPosition}%"></div>` : ""}
            </div>
        `;

        // Montar HTML completo
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
        `;

        // Adicionar evento de clique para selecionar a peça
        partElement.addEventListener("click", (e) => {
          if (!e.target.classList.contains("part-action-btn")) {
            scene3D?.selectPart(partName);
          }
        });

        partsList.appendChild(partElement);
      },
    );

    // Log para debug (opcional)
    console.log("📋 Lista de peças atualizada com cores corrigidas");
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
}
