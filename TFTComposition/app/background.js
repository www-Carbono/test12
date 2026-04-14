(function () {
  const TFT_GAME_ID = 5426;
  const REQUIRED_FEATURES = [
    "me",
    "match_info",
    "store",
    "board",
    "bench"
  ];

  function log(message, extra) {
    console.log("[background]", message, extra || "");
  }

  function hasOverwolf() {
    return typeof overwolf !== "undefined";
  }

  function obtainDeclaredWindow(windowName, callback) {
    if (!hasOverwolf()) {
      return;
    }

    overwolf.windows.obtainDeclaredWindow(windowName, function (result) {
      if (result.status === "success") {
        callback(result.window);
      } else {
        log("Failed to obtain window", { windowName: windowName, result: result });
      }
    });
  }

  function showWindow(windowName) {
    obtainDeclaredWindow(windowName, function (windowInfo) {
      overwolf.windows.restore(windowInfo.id, function () {});
    });
  }

  function hideWindow(windowName) {
    obtainDeclaredWindow(windowName, function (windowInfo) {
      overwolf.windows.hide(windowInfo.id, function () {});
    });
  }

  function toggleOverlay() {
    obtainDeclaredWindow("overlay", function (windowInfo) {
      if (windowInfo.isVisible) {
        overwolf.windows.hide(windowInfo.id, function () {});
      } else {
        overwolf.windows.restore(windowInfo.id, function () {});
      }
    });
  }

  function registerHotkey() {
    if (!hasOverwolf()) {
      return;
    }

    overwolf.settings.hotkeys.onPressed.addListener(function (event) {
      if (event.name === "toggle_overlay") {
        toggleOverlay();
      }
    });
  }

  function handleInfoUpdates(info) {
    if (info && info.game_info) {
      TFTState.applyInfoBatch({ game_info: info.game_info });
    }

    if (info && info.me) {
      TFTState.applyInfoBatch({ me: info.me });
    }

    if (info && info.match_info) {
      TFTState.applyInfoBatch({ match_info: info.match_info });
    }

    if (info && info.store) {
      TFTState.applyInfoBatch({ store: info.store });
    }

    if (info && info.board) {
      TFTState.applyInfoBatch({ board: info.board });
    }

    if (info && info.bench) {
      TFTState.applyInfoBatch({ bench: info.bench });
    }
  }

  function registerGameEvents() {
    if (!hasOverwolf()) {
      log("Overwolf SDK not found, enabling mock state.");
      TFTState.injectMockState();
      return;
    }

    overwolf.games.events.setRequiredFeatures(REQUIRED_FEATURES, function (result) {
      const success = result && (result.success || result.status === "success");
      TFTState.setConnected(success);
      log("setRequiredFeatures", result);
    });

    overwolf.games.events.onInfoUpdates2.addListener(function (event) {
      if (event && event.info) {
        handleInfoUpdates(event.info);
      }
    });

    overwolf.games.events.onNewEvents.addListener(function (event) {
      log("onNewEvents", event);
    });
  }

  function registerGameInfo() {
    if (!hasOverwolf()) {
      return;
    }

    overwolf.games.onGameInfoUpdated.addListener(function (event) {
      const gameInfo = event && event.gameInfo;
      const isTftSession = Boolean(gameInfo && gameInfo.isRunning && gameInfo.id === TFT_GAME_ID);

      TFTState.setGameRunning(isTftSession);

      if (isTftSession) {
        showWindow("overlay");
      } else {
        hideWindow("overlay");
      }
    });

    overwolf.games.getRunningGameInfo(function (gameInfo) {
      const isTftSession = Boolean(gameInfo && gameInfo.isRunning && gameInfo.id === TFT_GAME_ID);
      TFTState.setGameRunning(isTftSession);

      if (isTftSession) {
        showWindow("overlay");
      } else {
        showWindow("desktop");
      }
    });
  }

  function exposeDebugHelpers() {
    window.debugOverlay = {
      hideOverlay: function () {
        hideWindow("overlay");
      },
      injectMockState: function () {
        TFTState.injectMockState();
        showWindow("overlay");
      },
      resetState: function () {
        TFTState.resetState();
      },
      showDesktop: function () {
        showWindow("desktop");
      },
      showOverlay: function () {
        showWindow("overlay");
      }
    };
  }

  function bootstrap() {
    exposeDebugHelpers();
    registerHotkey();
    registerGameEvents();
    registerGameInfo();
    log("Background started");
  }

  bootstrap();
})();
