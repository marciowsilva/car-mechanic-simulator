// src/ui/UIManager.js - VERSÃO FUNCIONAL

export class UIManager {
  constructor() {
    console.log("🖥️ UIManager inicializando");

    // Verificar se os elementos da UI existem
    this.checkElements();

    console.log("✅ UIManager (mínimo) inicializado com sucesso");
  }

  checkElements() {
    const elementos = [
      "top-panel",
      "tool-panel",
      "bottom-panel",
      "interaction-info",
    ];
    elementos.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        console.log(`   ✅ #${id} encontrado`);
      } else {
        console.log(`   ❌ #${id} NÃO encontrado`);
      }
    });
  }

  showNotification(message, type = "info") {
    console.log(`🔔 [${type}] ${message}`);
  }

  updatePartsList() {
    console.log("📋 updatePartsList chamado");
  }

  updateJobInfo() {
    console.log("📄 updateJobInfo chamado");
  }
}

// Expor globalmente
if (typeof window !== "undefined") {
  window.UIManager = UIManager;
  console.log("🌐 UIManager disponível globalmente");
}
