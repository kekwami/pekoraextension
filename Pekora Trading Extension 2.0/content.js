(async function () {
  console.log("pekora trade enhancer loaded! make sure you have the latest version, check discord.gg/pekora");
  const res = await fetch("https://raw.githubusercontent.com/kekwami/pekoravalues/refs/heads/main/values.json");
  const data = await res.json();
  const valueMap = new Map(data.map(item => [cleanName(item.Name), item.Value]));
  const style = document.createElement("style");
  style.textContent = `
    .custom-value-tag {
      font-family: Arial, sans-serif;
      margin-top: 4px;
      display: flex;
      justify-content: center;
      gap: 6px;
      font-size: 13px;
    }
    .custom-value-tag .value {
      color: #00e676;
      font-weight: bold;
    }
    .custom-value-tag .demand {
      font-weight: normal;
    }
    .custom-overpay-summary {
      text-align: center;
      font-weight: bold;
      font-size: 15px;
      text-shadow: none;
      margin-top: 10px;
    }
  `;
  document.head.appendChild(style);
  function cleanName(name) {
    if (!name || typeof name !== "string") return "";
    return name.replace(/[^a-zA-Z0-9 ]/g, '').trim().toLowerCase();
  }
  function getValue(name) {
    return valueMap.get(cleanName(name)) || 0;
  }
  function formatNumber(num) {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toLocaleString();
  }
  function waitForTradeWindow(maxTries = 30, delay = 300) {
    let tries = 0;
    const interval = setInterval(() => {
      const tradeModal = document.querySelector(".col-9, .TradeRequest, .innerSection-0-2-123");
      const itemReady = tradeModal?.querySelector("img");
      console.log(`Try ${tries}: Modal? ${!!tradeModal}, Item Ready? ${!!itemReady}`);
      if (tradeModal && itemReady) {
        clearInterval(interval);
        console.log("trade modal found...");
        enhanceClassicTradeWindow(); 
      }
      if (++tries >= maxTries) {
        clearInterval(interval);
        setTimeout(() => location.reload(), 1000);
      }
    }, delay);
  }
  document.body.addEventListener("click", (e) => {
    if (e.target && e.target.textContent?.trim().toLowerCase() === "view details") {
      setTimeout(waitForTradeWindow, 300);
    }
  });
  function enhanceClassicTradeWindow() {
    const tradeModal = document.querySelector(".col-9") || document.querySelector(".TradeRequest") || document.querySelector(".innerSection-0-2-123");
    if (!tradeModal) return;
    const rows = tradeModal.querySelectorAll(".row.ms-1.mb-4");
    if (rows.length < 2) return;
    let giveTotal = 0;
    let receiveTotal = 0;
    let valuesFound = 0;
    rows.forEach((row, index) => {
      const isReceiveSide = index > 0;
      const boxes = row.querySelectorAll(".col-0-2-133");
      boxes.forEach(box => {
        const nameElem = box.querySelector(".itemName-0-2-135 a");
        const img = box.querySelector("img");
        if (!nameElem || !img || box.querySelector(".custom-value-tag")) return;
        const itemName = nameElem.textContent.trim();
        const val = getValue(itemName);
        const item = data.find(i => cleanName(i?.Name) === cleanName(itemName));
        if (val > 0) valuesFound++;
        if (isReceiveSide) receiveTotal += val;
        else giveTotal += val;
        const wrapper = document.createElement("div");
        wrapper.className = "custom-value-tag";
        wrapper.style.display = "flex";
        wrapper.style.justifyContent = "center";
        wrapper.style.gap = "6px";
        const valDiv = document.createElement("div");
        valDiv.className = "value";
        valDiv.textContent = `${val ? formatNumber(val) : "N/A"}`;
        wrapper.appendChild(valDiv);
        if (item?.Demand) {
          const demandDiv = document.createElement("div");
          demandDiv.className = "demand";
          demandDiv.textContent = `${item.Demand}`;
          switch (item.Demand.toLowerCase()) {
            case "terrible": demandDiv.style.color = "#550000"; break;
            case "low": demandDiv.style.color = "#CC0000"; break;
            case "medium": demandDiv.style.color = "#CCCC00"; break;
            case "high": demandDiv.style.color = "#00CC00"; break;
            default: demandDiv.style.color = "#B0B0B0"; break;
          }
          wrapper.appendChild(demandDiv);
        }
        img.insertAdjacentElement("afterend", wrapper);
      });
    });
    if (!document.querySelector(".custom-overpay-summary")) {
      const overpay = receiveTotal - giveTotal;
      const summary = document.createElement("div");
      summary.className = "custom-overpay-summary";
      summary.style.color = overpay === 0 ? "#AAAAAA" : (overpay > 0 ? "#00FF00" : "#FF3131");
      summary.style.marginTop = "8px";
      summary.style.fontSize = "14px";
      summary.style.textAlign = "center";
      summary.textContent = overpay === 0 ? "Fair Trade" : (overpay > 0 ? `+${formatNumber(overpay)}` : `${formatNumber(overpay)}`);
      const offerBreakdown = document.createElement("div");
      offerBreakdown.style.color = "#CCCCCC";
      offerBreakdown.style.fontSize = "12px";
      offerBreakdown.style.marginTop = "3px";
      offerBreakdown.innerHTML = `
        You're offering: <span style="color:#FF7070;">${formatNumber(giveTotal)}</span><br>
        They're offering: <span style="color:#70FF70;">${formatNumber(receiveTotal)}</span>
      `;
      summary.appendChild(offerBreakdown);
      const userCol = document.querySelector(".col-3.divider-right");
      const innerTextBlock = userCol?.querySelector("p > div");
      if (innerTextBlock) {
        innerTextBlock.appendChild(summary);
      } else {
        document.querySelector(".col-9")?.appendChild(summary);
      }
    }
    if (!document.querySelector(".custom-value-tag")) {
    const tip = document.createElement('div');
    tip.textContent = 'If values aren’t showing, try refreshing the page!';
    tip.style = 'text-align:center;color:#ccc;font-size:12px;margin-top:5px;';
    document.querySelector('.col-9')?.appendChild(tip);
  }
  }
  function enhanceCollectiblesPage() {
    if (!location.pathname.includes('/internal/collectibles')) return;
    const cards = document.querySelectorAll('.card.bg-dark');
    cards.forEach(card => {
      const body = card.querySelector('.card-body');
      if (!body || body.querySelector('.custom-value-tag')) return;
      const pTags = body.querySelectorAll('p');
      if (pTags.length < 1) return;
      const nameText = pTags[0].textContent.trim();
      const value = getValue(nameText);
      if (!value) return;
      const valueElem = document.createElement('p');
      valueElem.className = 'mb-0 text-truncate custom-value-tag';
      valueElem.style.color = '#00e676';
      valueElem.style.fontWeight = 'bold';
      valueElem.textContent = `Value: ${formatNumber(value)}`;
      pTags[pTags.length - 1].insertAdjacentElement('afterend', valueElem);
    });
    const totalRAPElem = document.querySelector('p.fw-bolder');
    if (totalRAPElem && !document.querySelector('#total-value-display')) {
      let totalValue = 0;
      const cards = document.querySelectorAll('.card.bg-dark');
      cards.forEach(card => {
        const nameElem = card.querySelector('.card-body p.fw-bolder');
        if (!nameElem) return;
        const itemName = nameElem.textContent.trim();
        const val = getValue(itemName);
        if (val) totalValue += val;
      });
      const totalValueElem = document.createElement('p');
      totalValueElem.id = 'total-value-display';
      totalValueElem.className = 'fw-bolder';
      totalValueElem.style.color = '#00e676';
      totalValueElem.style.marginTop = '-16.5px';
      totalValueElem.textContent = `Total Value: ${formatNumber(totalValue)}`;
      totalRAPElem.insertAdjacentElement('afterend', totalValueElem);
    }
  }
  window.addEventListener("load", () => {
    if (location.pathname.includes("/internal/collectibles")) {
      enhanceCollectiblesPage();
    }
  });
  function bindTradeDetailClicks() {
    document.querySelectorAll(".viewDetails-0-2-228").forEach(el => {
      if (!el.dataset.listenerAttached) {
        el.dataset.listenerAttached = "true";
        el.addEventListener("click", () => {
          let tries = 0;
          const interval = setInterval(() => {
            const hasItemName = document.querySelector(".itemName-0-2-135 a");
            const tradeModal = document.querySelector(".col-9") || document.querySelector(".innerSection-0-2-123");
            if (hasItemName && tradeModal) {
              clearInterval(interval);
              enhanceClassicTradeWindow();
            }
            if (++tries > 20) clearInterval(interval);
          }, 300);
        });
      }
    });
  }
  function waitForTradeModalAndEnhance() {
    let tries = 0;
    const maxTries = 20;
    const interval = setInterval(() => {
      const tradeModal = document.querySelector(".col-9") || document.querySelector(".innerSection-0-2-123");
      const hasItemName = tradeModal?.querySelector(".itemName-0-2-135 a");
      if (tradeModal && hasItemName) {
        clearInterval(interval);
        enhanceClassicTradeWindow();
      }
      if (++tries >= maxTries) {
        clearInterval(interval);
      }
    }, 300);
  }
})();
