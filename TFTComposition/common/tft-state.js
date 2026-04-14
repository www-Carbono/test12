(function () {
  const initialState = {
    connected: false,
    gameRunning: false,
    gameMode: null,
    lastUpdateAt: null,
    player: {
      summonerName: "",
      level: 0,
      currentXp: 0,
      xpMax: 0,
      gold: 0,
      health: 100,
      rank: 0
    },
    round: {
      stage: "",
      name: "",
      type: ""
    },
    bench: [],
    board: [],
    store: [],
    itemOptions: []
  };

  let state = structuredCloneSafe(initialState);
  const listeners = new Set();

  function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function notify() {
    const snapshot = getState();
    listeners.forEach((listener) => listener(snapshot));
  }

  function getState() {
    return structuredCloneSafe(state);
  }

  function subscribe(listener) {
    listeners.add(listener);
    listener(getState());
    return function unsubscribe() {
      listeners.delete(listener);
    };
  }

  function patchState(partial) {
    state = deepMerge(state, partial);
    state.lastUpdateAt = new Date().toISOString();
    notify();
  }

  function resetState() {
    state = structuredCloneSafe(initialState);
    notify();
  }

  function deepMerge(target, source) {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      return source;
    }

    const output = Array.isArray(target) ? target.slice() : { ...target };

    Object.keys(source).forEach((key) => {
      const sourceValue = source[key];
      const targetValue = output[key];

      if (Array.isArray(sourceValue)) {
        output[key] = sourceValue.slice();
        return;
      }

      if (sourceValue && typeof sourceValue === "object") {
        output[key] = deepMerge(targetValue || {}, sourceValue);
        return;
      }

      output[key] = sourceValue;
    });

    return output;
  }

  function parseJsonValue(value, fallback) {
    if (value == null || value === "") {
      return fallback;
    }

    if (typeof value === "object") {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch (_error) {
      return fallback;
    }
  }

  function normalizePieceMap(mapLike, slotPrefix) {
    if (!mapLike || typeof mapLike !== "object") {
      return [];
    }

    return Object.keys(mapLike)
      .sort(naturalKeySort)
      .map((key) => {
        const piece = mapLike[key] || {};
        return {
          slot: key,
          slotIndex: Number(String(key).replace(slotPrefix, "")) || 0,
          name: humanizeTftId(piece.name || ""),
          rawName: piece.name || "",
          level: Number(piece.level || piece.star_level || 0),
          items: [piece.item_1, piece.item_2, piece.item_3].filter(Boolean)
        };
      });
  }

  function naturalKeySort(left, right) {
    return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
  }

  function humanizeTftId(value) {
    if (!value) {
      return "";
    }

    return String(value)
      .replace(/^TFT_/, "")
      .replace(/^Item_/, "")
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .trim();
  }

  function normalizeShop(mapLike) {
    if (!mapLike || typeof mapLike !== "object") {
      return [];
    }

    return Object.keys(mapLike)
      .sort(naturalKeySort)
      .map((key) => {
        const piece = mapLike[key] || {};
        return {
          slot: key,
          slotIndex: Number(String(key).replace("slot_", "")) || 0,
          name: humanizeTftId(piece.name || ""),
          rawName: piece.name || "",
          sold: piece.name === "Sold"
        };
      });
  }

  function applyInfoUpdate(feature, category, key, value) {
    if (feature === "me") {
      if (key === "summoner_name") {
        patchState({ player: { summonerName: value || "" } });
      }

      if (key === "gold") {
        patchState({ player: { gold: Number(value || 0) } });
      }

      if (key === "health") {
        patchState({ player: { health: Number(value || 0) } });
      }

      if (key === "rank") {
        patchState({ player: { rank: Number(value || 0) } });
      }

      if (key === "xp") {
        const xp = parseJsonValue(value, {});
        patchState({
          player: {
            level: Number(xp.level || 0),
            currentXp: Number(xp.current_xp || 0),
            xpMax: Number(xp.xp_max || 0)
          }
        });
      }
    }

    if (feature === "match_info" && key === "round_type") {
      const round = parseJsonValue(value, {});
      patchState({
        round: {
          stage: round.stage || "",
          name: round.name || "",
          type: round.type || ""
        }
      });
    }

    if (feature === "match_info" && key === "game_mode") {
      patchState({ gameMode: value || null });
    }

    if (feature === "store" && category === "store" && key === "shop_pieces") {
      patchState({ store: normalizeShop(parseJsonValue(value, {})) });
    }

    if (feature === "bench" && category === "bench" && key === "bench_pieces") {
      patchState({ bench: normalizePieceMap(parseJsonValue(value, {}), "slot_") });
    }

    if (feature === "board" && category === "board" && key === "board_pieces") {
      patchState({ board: normalizePieceMap(parseJsonValue(value, {}), "cell_") });
    }

    if (feature === "match_info" && key === "item_select") {
      const options = parseJsonValue(value, {});
      const normalized = Object.keys(options).map((optionKey) => ({
        slot: optionKey,
        name: humanizeTftId(options[optionKey] && options[optionKey].name)
      }));
      patchState({ itemOptions: normalized });
    }
  }

  function applyInfoBatch(infoPayload) {
    Object.keys(infoPayload || {}).forEach((feature) => {
      const categoryPayload = infoPayload[feature] || {};
      Object.keys(categoryPayload).forEach((key) => {
        applyInfoUpdate(feature, feature, key, categoryPayload[key]);
      });
    });
  }

  function setConnected(connected) {
    patchState({ connected: Boolean(connected) });
  }

  function setGameRunning(gameRunning) {
    patchState({ gameRunning: Boolean(gameRunning) });
  }

  function injectMockState() {
    patchState({
      connected: true,
      gameRunning: true,
      gameMode: "TFT",
      player: {
        summonerName: "Antonio",
        level: 7,
        currentXp: 24,
        xpMax: 56,
        gold: 38,
        health: 62,
        rank: 3
      },
      round: {
        stage: "4-2",
        name: "PVP",
        type: "Battle"
      },
      store: [
        { slot: "slot_1", slotIndex: 1, name: "Garen", rawName: "TFT_Garen", sold: false },
        { slot: "slot_2", slotIndex: 2, name: "Corki", rawName: "TFT_Corki", sold: false },
        { slot: "slot_3", slotIndex: 3, name: "Mordekaiser", rawName: "TFT_Mordekaiser", sold: false },
        { slot: "slot_4", slotIndex: 4, name: "Jinx", rawName: "TFT_Jinx", sold: false },
        { slot: "slot_5", slotIndex: 5, name: "Ekko", rawName: "TFT_Ekko", sold: false }
      ],
      bench: [
        { slot: "slot_1", slotIndex: 1, name: "Vi", rawName: "TFT_Vi", level: 2, items: [] },
        { slot: "slot_2", slotIndex: 2, name: "Blitzcrank", rawName: "TFT_Blitzcrank", level: 1, items: [] },
        { slot: "slot_3", slotIndex: 3, name: "Twisted Fate", rawName: "TFT_TwistedFate", level: 2, items: [] }
      ],
      board: [
        { slot: "cell_9", slotIndex: 9, name: "Tristana", rawName: "TFT_Tristana", level: 2, items: ["TFT_Item_GuinsoosRageblade"] },
        { slot: "cell_10", slotIndex: 10, name: "Kha Zix", rawName: "TFT_KhaZix", level: 2, items: ["TFT_Item_BFSword"] },
        { slot: "cell_16", slotIndex: 16, name: "Leona", rawName: "TFT_Leona", level: 1, items: [] }
      ],
      itemOptions: [
        { slot: "item_1", name: "Needlessly Large Rod" },
        { slot: "item_2", name: "Recurve Bow" },
        { slot: "item_3", name: "Negatron Cloak" },
        { slot: "item_4", name: "BF Sword" }
      ]
    });
  }

  window.TFTState = {
    applyInfoBatch,
    applyInfoUpdate,
    getState,
    injectMockState,
    resetState,
    setConnected,
    setGameRunning,
    subscribe
  };
})();
