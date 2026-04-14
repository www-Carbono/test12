(function () {
  const elementIds = {
    connectionBadge: document.getElementById("connection-badge"),
    gameBadge: document.getElementById("game-badge"),
    playerLevel: document.getElementById("player-level"),
    playerXp: document.getElementById("player-xp"),
    playerGold: document.getElementById("player-gold"),
    playerHealth: document.getElementById("player-health"),
    playerRank: document.getElementById("player-rank"),
    roundStage: document.getElementById("round-stage"),
    gameMode: document.getElementById("game-mode"),
    storeList: document.getElementById("store-list"),
    benchList: document.getElementById("bench-list"),
    boardList: document.getElementById("board-list"),
    itemsList: document.getElementById("items-list"),
    benchCount: document.getElementById("bench-count"),
    boardCount: document.getElementById("board-count")
  };

  function createCard(title, metaLines, options) {
    const card = document.createElement("article");
    card.className = "card";
    if (options && options.empty) {
      card.classList.add("card-empty");
    }

    const name = document.createElement("div");
    name.className = "card-name";
    name.textContent = title;
    card.appendChild(name);

    const meta = document.createElement("div");
    meta.className = "card-meta";

    metaLines.forEach(function (line) {
      if (typeof line === "string") {
        const span = document.createElement("span");
        span.textContent = line;
        if (line === "Sold") {
          span.className = "sold";
        }
        meta.appendChild(span);
        return;
      }

      if (line && line.type === "items") {
        const items = document.createElement("div");
        items.className = "items-inline";
        line.items.forEach(function (item) {
          const chip = document.createElement("span");
          chip.className = "item-chip";
          chip.textContent = item.replace(/^TFT_Item_/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
          items.appendChild(chip);
        });
        meta.appendChild(items);
      }
    });

    card.appendChild(meta);
    return card;
  }

  function renderCollection(container, items, emptyCount, builder) {
    container.innerHTML = "";
    items.forEach(function (item) {
      container.appendChild(builder(item));
    });

    for (let index = items.length; index < emptyCount; index += 1) {
      container.appendChild(createCard("Vacío", ["Sin datos"], { empty: true }));
    }
  }

  function render(state) {
    elementIds.connectionBadge.textContent = state.connected ? "GEP OK" : "GEP OFF";
    elementIds.gameBadge.textContent = state.gameRunning ? "TFT detectado" : "Esperando partida";
    elementIds.playerLevel.textContent = String(state.player.level || 0);
    elementIds.playerXp.textContent = state.player.currentXp + " / " + state.player.xpMax;
    elementIds.playerGold.textContent = String(state.player.gold || 0);
    elementIds.playerHealth.textContent = String(state.player.health || 0);
    elementIds.playerRank.textContent = state.player.rank ? "#" + state.player.rank : "-";
    elementIds.roundStage.textContent = state.round.stage || "-";
    elementIds.gameMode.textContent = state.gameMode || "Unknown";
    elementIds.benchCount.textContent = String(state.bench.length);
    elementIds.boardCount.textContent = String(state.board.length);

    renderCollection(elementIds.storeList, state.store, 5, function (slot) {
      return createCard(slot.name || "Vacío", [slot.sold ? "Sold" : slot.slot], { empty: !slot.name });
    });

    renderCollection(elementIds.benchList, state.bench, Math.max(5, state.bench.length), function (piece) {
      const meta = [piece.slot, piece.level ? "Star " + piece.level : "No level"];
      if (piece.items && piece.items.length) {
        meta.push({ type: "items", items: piece.items });
      }
      return createCard(piece.name || "Vacío", meta, { empty: !piece.name });
    });

    renderCollection(elementIds.boardList, state.board, Math.max(7, state.board.length), function (piece) {
      const meta = [piece.slot, piece.level ? "Star " + piece.level : "No level"];
      if (piece.items && piece.items.length) {
        meta.push({ type: "items", items: piece.items });
      }
      return createCard(piece.name || "Vacío", meta, { empty: !piece.name });
    });

    renderCollection(elementIds.itemsList, state.itemOptions, 4, function (item) {
      return createCard(item.name || "Sin item", [item.slot], { empty: !item.name });
    });
  }

  TFTState.subscribe(render);
})();
