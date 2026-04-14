(function () {
  const gepEl = document.getElementById("status-gep");
  const gameEl = document.getElementById("status-game");
  const updatedEl = document.getElementById("status-updated");
  const openOverlayButton = document.getElementById("open-overlay");
  const hideOverlayButton = document.getElementById("hide-overlay");
  const injectMockButton = document.getElementById("inject-mock");
  const resetStateButton = document.getElementById("reset-state");

  function getBackgroundWindow(callback) {
    if (typeof overwolf === "undefined") {
      callback(null);
      return;
    }

    overwolf.windows.getMainWindow(function (result) {
      callback(result);
    });
  }

  function wireButtons() {
    openOverlayButton.addEventListener("click", function () {
      getBackgroundWindow(function (backgroundWindow) {
        if (backgroundWindow && backgroundWindow.debugOverlay) {
          backgroundWindow.debugOverlay.showOverlay();
        }
      });
    });

    hideOverlayButton.addEventListener("click", function () {
      getBackgroundWindow(function (backgroundWindow) {
        if (backgroundWindow && backgroundWindow.debugOverlay) {
          backgroundWindow.debugOverlay.hideOverlay();
        }
      });
    });

    injectMockButton.addEventListener("click", function () {
      getBackgroundWindow(function (backgroundWindow) {
        if (backgroundWindow && backgroundWindow.debugOverlay) {
          backgroundWindow.debugOverlay.injectMockState();
        } else {
          TFTState.injectMockState();
        }
      });
    });

    resetStateButton.addEventListener("click", function () {
      getBackgroundWindow(function (backgroundWindow) {
        if (backgroundWindow && backgroundWindow.debugOverlay) {
          backgroundWindow.debugOverlay.resetState();
        } else {
          TFTState.resetState();
        }
      });
    });
  }

  function render(state) {
    gepEl.textContent = state.connected ? "Conectado" : "Desconectado";
    gameEl.textContent = state.gameRunning ? "TFT detectado" : "Esperando proceso";
    updatedEl.textContent = state.lastUpdateAt ? new Date(state.lastUpdateAt).toLocaleTimeString() : "-";
  }

  wireButtons();
  TFTState.subscribe(render);
})();
