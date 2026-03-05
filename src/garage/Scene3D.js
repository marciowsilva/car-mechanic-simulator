// src/garage/Scene3D.js - VERSÃO FUNCIONAL

export class Scene3D {
  constructor(container) {
    console.log("🎮 Scene3D inicializando com container:", container);

    if (!container) {
      console.error("❌ Container não fornecido");
      return;
    }

    this.container = container;

    // Criar um elemento simples para mostrar que funciona
    const div = document.createElement("div");
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.backgroundColor = "#3366cc";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.color = "white";
    div.style.fontSize = "24px";
    div.textContent = "🚗 SCENE 3D CARREGADA";

    container.appendChild(div);

    console.log("✅ Scene3D (mínimo) inicializado com sucesso");
  }

  createCar(carData, job) {
    console.log("🚗 createCar chamado com:", carData, job);
    return null;
  }

  animate() {
    // Não faz nada por enquanto
  }
}

// Expor globalmente
if (typeof window !== "undefined") {
  window.Scene3D = Scene3D;
  console.log("🌐 Scene3D disponível globalmente");
}
