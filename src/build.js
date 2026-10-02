function daysBetween(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

function linkFor(agentId, cfg, entry) {
  const a = cfg.agents[agentId];
  if (agentId === 'his') return a.linkUrl;
  if (agentId === 'best1') {
    const p = (entry.urls || {}).best1;
    return p ? a.affiliatePrefix + encodeURIComponent(a.base + p) : null;
  }
  return null;
}

function buildFeed(ledger, cfg, today) {
  // その回に失敗・無効な社は「全社 null」判定から除く。判定対象が残らなければ除外しない
  const skip = new Set(ledger.lastFailed || []);
  const checked = cfg.display.filter((id) => !skip.has(id) && cfg.agents[id].enabled !== false);
  const cruises = Object.values(ledger.cruises)
    .filter((c) => c.depart > today)
    .filter((c) => !c.soldout_at)
    .filter((c) => !c.missing_since)
    .filter((c) => checked.length === 0 || checked.some((id) => (c.marks || {})[id]))
    .sort((x, y) => (x.depart < y.depart ? -1 : 1))
    .map((c) => {
      const st = {};
      const link = {};
      for (const id of cfg.display) {
        st[id] = (c.marks || {})[id] || null;
        link[id] = st[id] ? linkFor(id, cfg, c) : null;
      }
      const isNew = c.first_seen > ledger.initialized ? daysBetween(c.first_seen, today) <= cfg.newDays : false;
      return { depart: c.depart, days: c.days, port: c.port, course: c.course, new: isNew, st, link };
    });
  return {
    ship: cfg.ship,
    label: cfg.label,
    updated: today,
    staleDays: cfg.staleDays,
    agents: cfg.display.map((id) => ({ id, label: cfg.agents[id].label, asp: cfg.agents[id].asp })),
    cruises,
  };
}

module.exports = { buildFeed };
