// src/ui/TooltipSystem.js - Sistema de tooltips

export class TooltipSystem {
  constructor() {
    this.tooltip = this.createTooltip();
    this.hideTimeout = null;
    this.showTimeout = null;
  }

  createTooltip() {
    let tooltip = document.getElementById("game-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = "game-tooltip";
      // The user's instruction seems to be trying to add a link to a CSS file.
      // However, the original code uses inline styles via tooltip.style.cssText.
      // Inserting `link.href = "/src/ui/style.css";` directly here would be syntactically incorrect
      // as 'link' is not defined and it would not replace the existing styling mechanism.
      //
      // If the intent is to load a stylesheet, a <link> element would need to be created
      // and appended to the document head, and the inline styles would need to be removed.
      //
      // Given the instruction to "make the change faithfully" and "syntactically correct",
      // and the provided snippet `link.href = "/src/ui/style.css"; Text = `
      // which is incomplete and incorrect, I cannot directly apply it as written.
      //
      // Assuming the user intended to add a stylesheet link, but the snippet was malformed,
      // and without further clarification, I will not introduce syntactically incorrect code.
      //
      // If the user meant to change a *different* part of the code that already loads a CSS file,
      // that part is not present in the provided document.
      //
      // For now, I will keep the existing inline styling as it is the only correct and
      // complete styling mechanism present in the original code.
      //
      // If the user wishes to switch to a linked stylesheet, a more comprehensive
      // instruction would be needed, including how to create and append the <link> element
      // and remove the inline styles.
      tooltip.style.cssText = `
                position: fixed;
                background: rgba(30, 30, 30, 0.95);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                border: 1px solid #ff6b00;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                pointer-events: none;
                z-index: 10000;
                max-width: 300px;
                backdrop-filter: blur(5px);
                transition: opacity 0.2s;
                opacity: 0;
            `;
      document.body.appendChild(tooltip);
    }
    return tooltip;
  }

  show(element, content, options = {}) {
    const { position = "top", delay = 500, offset = 10 } = options;

    clearTimeout(this.showTimeout);
    clearTimeout(this.hideTimeout);

    this.showTimeout = setTimeout(() => {
      const rect = element.getBoundingClientRect();

      this.tooltip.innerHTML = content;
      this.tooltip.style.opacity = "1";

      // Posicionar tooltip
      const tooltipRect = this.tooltip.getBoundingClientRect();

      switch (position) {
        case "top":
          this.tooltip.style.left = `${rect.left + (rect.width - tooltipRect.width) / 2}px`;
          this.tooltip.style.top = `${rect.top - tooltipRect.height - offset}px`;
          break;
        case "bottom":
          this.tooltip.style.left = `${rect.left + (rect.width - tooltipRect.width) / 2}px`;
          this.tooltip.style.top = `${rect.bottom + offset}px`;
          break;
        case "left":
          this.tooltip.style.left = `${rect.left - tooltipRect.width - offset}px`;
          this.tooltip.style.top = `${rect.top + (rect.height - tooltipRect.height) / 2}px`;
          break;
        case "right":
          this.tooltip.style.left = `${rect.right + offset}px`;
          this.tooltip.style.top = `${rect.top + (rect.height - tooltipRect.height) / 2}px`;
          break;
      }
    }, delay);
  }

  hide() {
    clearTimeout(this.showTimeout);
    clearTimeout(this.hideTimeout);

    this.hideTimeout = setTimeout(() => {
      this.tooltip.style.opacity = "0";
    }, 100);
  }

  attach(element, content, options = {}) {
    element.addEventListener("mouseenter", () =>
      this.show(element, content, options),
    );
    element.addEventListener("mouseleave", () => this.hide());
    element.addEventListener("mousemove", (e) => {
      // Opcional: seguir o mouse
      if (options.followMouse) {
        this.tooltip.style.left = e.clientX + 15 + "px";
        this.tooltip.style.top = e.clientY + 15 + "px";
      }
    });
  }
}
