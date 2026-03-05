// src/ui/UIManager.js - Versão funcional com estilo e lógica real

export class UIManager {
  constructor() {
    console.log("🖥️ UIManager inicializando...");
    this.elements = {};
    this.parts = [];
    this.cacheElements();
    this.initEventListeners();

    import("/src/systems/UpgradeManager.js").then((module) => {
      const UpgradeManager = module.UpgradeManager || module.default;
      this.upgradeManager = new UpgradeManager();

      import("/src/ui/UpgradePanel.js").then((panelModule) => {
        const UpgradePanel = panelModule.UpgradePanel || panelModule.default;
        this.upgradePanel = new UpgradePanel(this.upgradeManager);

        // Adicionar event listener para o botão de upgrades
        const upgradeBtn = document.getElementById("upgrade-shop-btn");
        if (upgradeBtn) {
          upgradeBtn.addEventListener("click", () => {
            this.upgradePanel.toggle();
          });
        }
      });
    });

    // Import CustomerManager
    import("/src/systems/CustomerManager.js")
      .then((module) => {
        const CustomerManager = module.CustomerManager || module.default;
        this.customerManager = new CustomerManager();
        console.log("✅ CustomerManager carregado");
      })
      .catch((err) => {
        console.log("❌ Erro ao carregar CustomerManager:", err);
      });

    this.updateAllDisplays();

    this.notificationTimeout = null;
    setInterval(() => this.updateTimer(), 1000);
  }

  cacheElements() {
    const elementos = [
      "money",
      "level",
      "reputation",
      "jobs-completed",
      "job-info",
      "parts-list",
      "interaction-info",
      "new-job",
      "deliver-car",
      "notification",
      "top-panel",
      "tool-panel",
      "bottom-panel",
    ];

    elementos.forEach((id) => {
      this.elements[id] = document.getElementById(id);
    });
  }

  getElement(id) {
    return (
      this.elements[id] || {
        textContent: "",
        style: {},
        classList: { add: () => {}, remove: () => {} },
      }
    );
  }

  initEventListeners() {
    // Botão Novo Cliente
    this.getElement("new-job").addEventListener("click", () => {
      this.createNewJob();
    });

    // Botão Clientes
    const customersBtn = document.getElementById("customers-btn");
    if (customersBtn) {
      customersBtn.addEventListener("click", () => {
        this.showCustomers();
      });
    }

    // Botão Entregar Carro
    this.getElement("deliver-car").addEventListener("click", () => {
      this.deliverCar();
    });

    // Ferramentas
    document.querySelectorAll(".tool-item").forEach((tool) => {
      tool.addEventListener("click", (e) => {
        document
          .querySelectorAll(".tool-item")
          .forEach((t) => t.classList.remove("selected"));
        tool.classList.add("selected");
        if (window.gameState) {
          window.gameState.selectedTool = tool.dataset.tool;
        }
        this.showNotification(`🔧 Ferramenta: ${tool.dataset.tool}`, "info");
      });
    });
  }

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

    // Usar o CustomerManager se existir, senão gerar job simples
    if (this.customerManager) {
      const job = this.customerManager.generateJob();
      window.gameState.currentJob = job;
      window.gameState.currentCar = { parts: job.parts };

      const customer = job.customer;
      const vipIcon = customer.isVIP ? "👑 " : "";
      this.showNotification(
        `🚗 ${vipIcon}${customer.name} - R$ ${job.payment}`,
        "success",
      );
    } else {
      // Fallback para job simples (igual ao existente)
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
    }

    this.updateJobInfo();
    this.updatePartsList();
    this.getElement("deliver-car").disabled = false;
  }

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

  deliverCar() {
    if (!window.gameState?.currentJob) {
      this.showNotification("❌ Nenhum serviço ativo", "error");
      return;
    }

    // Se temos o CustomerManager, usar ele para processar
    if (this.customerManager && this.customerManager.currentJob) {
      // Calcular qualidade baseada nas condições das peças
      const parts = window.gameState.currentCar.parts;
      let totalCondition = 0;
      let count = 0;

      Object.values(parts).forEach((part) => {
        totalCondition += part.condition;
        count++;
      });

      const quality = totalCondition / count;
      const result = this.customerManager.completeJob(quality);

      if (result) {
        window.gameState.money += result.payment;
        window.gameState.jobsCompleted++;

        const bonusText =
          result.timeBonus > 0 ? ` (bônus R$ ${result.timeBonus})` : "";
        this.showNotification(
          `💰 Serviço concluído! R$ ${result.payment}${bonusText}`,
          "success",
        );

        if (result.satisfaction >= 80) {
          this.showNotification(`😊 Cliente satisfeito!`, "success");
        }
      }
    } else {
      // Fallback para o método simples existente
      const payment = window.gameState.currentJob.payment || 1000;
      window.gameState.money += payment;
      window.gameState.jobsCompleted++;
      this.showNotification(`💰 Serviço concluído! R$ ${payment}`, "success");
    }

    window.gameState.currentJob = null;
    window.gameState.currentCar = null;

    this.updateMoney();
    this.updateJobsCompleted();
    this.updateJobInfo();
    this.updatePartsList();
    this.getElement("deliver-car").disabled = true;
  }

  updateAllDisplays() {
    this.updateMoney();
    this.updateLevel();
    this.updateReputation();
    this.updateJobsCompleted();
    this.updateJobInfo();
    this.updatePartsList();
  }

  updateMoney() {
    const el = this.getElement("money");
    if (window.gameState) {
      el.textContent = `R$ ${window.gameState.money.toLocaleString()}`;
    }
  }

  updateLevel() {
    const el = this.getElement("level");
    if (window.gameState) {
      el.textContent = window.gameState.level;
    }
  }

  updateReputation() {
    const el = this.getElement("reputation");
    if (window.gameState) {
      const stars =
        "★".repeat(window.gameState.reputation) +
        "☆".repeat(5 - window.gameState.reputation);
      el.textContent = stars;
    }
  }

  updateJobsCompleted() {
    const el = this.getElement("jobs-completed");
    if (window.gameState) {
      el.textContent = window.gameState.jobsCompleted || 0;
    }
  }

  updateJobInfo() {
    const el = this.getElement("job-info");
    if (!window.gameState?.currentJob) {
      el.innerHTML = '<div class="empty-state">🚗 Nenhum serviço ativo</div>';
      return;
    }

    const job = window.gameState.currentJob;
    el.innerHTML = `
            <div class="job-header">
                <span class="job-customer">${job.customerName}</span>
                <span class="job-difficulty">${job.difficulty}</span>
            </div>
            <div class="job-info-item">
                <span>Carro:</span>
                <span>${job.carModel}</span>
            </div>
            <div class="job-payment">
                Pagamento: R$ ${job.payment}
            </div>
        `;
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
    let html = '<div class="parts-list">';

    Object.entries(parts).forEach(([name, data]) => {
      const condition = Math.round(data.condition);
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

      const canRepair = gameState.money >= 50; // Custo mínimo
      const canBuy = gameState.money >= 500;

      html += `
            <div class="part-item" data-part="${name}">
                <div class="part-header">
                    <span class="part-name">${this.getPartDisplayName(name)}</span>
                    <span class="part-condition ${conditionClass}">${condition}% - ${conditionText}</span>
                </div>
                <div class="part-progress">
                    <div class="progress-bar" style="width: ${condition}%"></div>
                </div>
                <div class="part-actions">
                    <button class="part-btn repair-btn" 
                            onclick="window.repairPart('${name}')"
                            ${!canRepair ? "disabled" : ""}>
                        🔧 Reparar (R$ 50)
                    </button>
                    <button class="part-btn buy-btn" 
                            onclick="window.buyPart('${name}')"
                            ${!canBuy ? "disabled" : ""}>
                        🛒 Nova (R$ 500)
                    </button>
                </div>
            </div>
        `;
    });

    html += "</div>";
    el.innerHTML = html;
  }

  getPartDisplayName(partName) {
    const names = {
      motor: "Motor",
      transmissao: "Transmissão",
      freios: "Freios",
      suspensao: "Suspensão",
      bateria: "Bateria",
      alternador: "Alternador",
    };
    return names[partName] || partName;
  }

  updateTimer() {
    if (window.gameState?.currentJob) {
      // Timer seria implementado aqui
    }
  }

  showNotification(message, type = "info") {
    const notification = this.getElement("notification");

    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    notification.textContent = message;
    notification.style.backgroundColor =
      type === "error" ? "#ff3333" : type === "success" ? "#00aa00" : "#ff6b00";

    notification.classList.add("show");

    this.notificationTimeout = setTimeout(() => {
      notification.classList.remove("show");
    }, 3000);
  }

  showCustomers() {
    if (!this.customerManager) {
      this.showNotification("❌ Sistema de clientes não disponível", "error");
      return;
    }

    const customers = this.customerManager.getCustomerList();
    const stats = this.customerManager.getStats();

    // Criar mensagem para mostrar
    let message = `👥 CLIENTES (${stats.totalCustomers})\n`;
    message += `VIPs: ${stats.vipCustomers} | Satisfação média: ${stats.avgSatisfaction}%\n\n`;

    customers.slice(0, 5).forEach((c) => {
      const vip = c.isVIP ? "👑 " : "";
      const satisfactionEmoji =
        c.satisfaction >= 80 ? "😊" : c.satisfaction >= 50 ? "😐" : "😞";
      message += `${vip}${c.name}: ${c.visits} visitas | ${c.satisfaction}% ${satisfactionEmoji}\n`;
      message += `   Carro: ${c.car} | Gasto: R$ ${c.totalSpent}\n`;
    });

    if (customers.length > 5) {
      message += `\n... e mais ${customers.length - 5} clientes`;
    }

    alert(message);
  }
}

// Funções globais para os botões
window.repairPart = (partName) => {
  console.log("🔧 Reparando:", partName);
  if (window.uiManager) {
    window.uiManager.showNotification(`🔧 Reparando ${partName}...`, "info");
  }
};

window.buyPart = (partName) => {
  console.log("🛒 Comprando:", partName);
  if (window.uiManager) {
    window.uiManager.showNotification(`🛒 ${partName} comprada!`, "success");
  }
};

// Expor globalmente
if (typeof window !== "undefined") {
  window.UIManager = UIManager;
}
