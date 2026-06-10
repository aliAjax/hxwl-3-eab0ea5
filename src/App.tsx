import { useEffect, useMemo, useState } from "react";

type Metric = "shade" | "nectar" | "shelter" | "moisture";

type Decoration = {
  id: string;
  name: string;
  icon: string;
  color: string;
  metrics: Record<Metric, number>;
};

type Insect = {
  id: string;
  name: string;
  icon: string;
  likes: Partial<Record<Metric, number>>;
  note: string;
};

type HotelState = {
  placed: string[];
  guests: string[];
  lastReport: string;
};

const storageKey = "hxwl-3-hotel";

const metricLabels: Record<Metric, string> = {
  shade: "遮阴",
  nectar: "花蜜",
  shelter: "藏身",
  moisture: "湿润"
};

const decorations: Decoration[] = [
  { id: "twig", name: "空心树枝", icon: "╎", color: "#9c6b43", metrics: { shade: 1, nectar: 0, shelter: 3, moisture: 0 } },
  { id: "leaf", name: "阔叶伞", icon: "◒", color: "#5aa06a", metrics: { shade: 3, nectar: 0, shelter: 1, moisture: 1 } },
  { id: "stone", name: "温石堆", icon: "◆", color: "#8d8a82", metrics: { shade: 0, nectar: 0, shelter: 2, moisture: 0 } },
  { id: "flower", name: "小花盆", icon: "✽", color: "#df8a9b", metrics: { shade: 0, nectar: 4, shelter: 0, moisture: 1 } },
  { id: "moss", name: "苔藓毯", icon: "▧", color: "#4c7a50", metrics: { shade: 1, nectar: 0, shelter: 1, moisture: 4 } }
];

const insects: Insect[] = [
  { id: "bee", name: "独居蜂", icon: "蜂", likes: { nectar: 3, shelter: 2 }, note: "喜欢花蜜和能钻进去的小洞。" },
  { id: "ladybird", name: "七星瓢虫", icon: "瓢", likes: { shade: 2, shelter: 2 }, note: "偏爱安静的叶下角落。" },
  { id: "firefly", name: "萤火虫", icon: "萤", likes: { moisture: 3, shade: 2 }, note: "湿润环境会让它停留更久。" },
  { id: "beetle", name: "蓝背甲虫", icon: "甲", likes: { shelter: 4 }, note: "只要藏身处足够多，它就会入住。" },
  { id: "butterfly", name: "薄翅蝶", icon: "蝶", likes: { nectar: 4, shade: 1 }, note: "会被花蜜吸引，但不喜欢太暴晒。" }
];

function loadState(): HotelState {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "") as HotelState;
  } catch {
    return { placed: [], guests: [], lastReport: "旅馆刚开张，还没有访客记录。" };
  }
}

export default function App() {
  const [state, setState] = useState<HotelState>(loadState);
  const [showEncyclopedia, setShowEncyclopedia] = useState(false);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const metrics = useMemo(
    () =>
      state.placed.reduce(
        (total, id) => {
          const decoration = decorations.find((item) => item.id === id);
          if (!decoration) return total;
          (Object.keys(total) as Metric[]).forEach((metric) => {
            total[metric] += decoration.metrics[metric];
          });
          return total;
        },
        { shade: 0, nectar: 0, shelter: 0, moisture: 0 }
      ),
    [state.placed]
  );

  function addDecoration(id: string) {
    if (state.placed.length >= 12) return;
    setState((current) => ({ ...current, placed: [...current.placed, id] }));
  }

  function settleDay() {
    const matched = insects.filter((insect) =>
      Object.entries(insect.likes).every(([metric, value]) => metrics[metric as Metric] >= Number(value))
    );
    const guestIds = Array.from(new Set([...state.guests, ...matched.map((insect) => insect.id)]));
    const report =
      matched.length > 0
        ? `今天有${matched.map((insect) => insect.name).join("、")}注意到了旅馆。`
        : "今天环境还不够有吸引力，试着增加花蜜、湿润或藏身处。";
    setState((current) => ({ ...current, guests: guestIds, lastReport: report }));
  }

  return (
    <main className="hotel">
      <section className="topbar">
        <div>
          <p className="eyebrow">昆虫旅馆</p>
          <h1>给小客人搭一间好住处</h1>
        </div>
        <div className="actions">
          <button onClick={() => setShowEncyclopedia(true)}>昆虫图鉴</button>
          <button onClick={() => setState({ placed: [], guests: [], lastReport: "旅馆已重新整理。" })}>清空旅馆</button>
          <button className="primary" onClick={settleDay}>结算今天</button>
        </div>
      </section>

      <section className="layout">
        <div className="panel">
          <h2>材料箱</h2>
          <div className="deco-list">
            {decorations.map((decoration) => (
              <button key={decoration.id} onClick={() => addDecoration(decoration.id)}>
                <span style={{ background: decoration.color }}>{decoration.icon}</span>
                <strong>{decoration.name}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="panel hotel-board">
          <h2>旅馆格</h2>
          <div className="grid">
            {Array.from({ length: 12 }).map((_, index) => {
              const placed = decorations.find((item) => item.id === state.placed[index]);
              return (
                <button key={index} onClick={() => setState((current) => ({ ...current, placed: current.placed.filter((_, itemIndex) => itemIndex !== index) }))}>
                  {placed && <span style={{ background: placed.color }}>{placed.icon}</span>}
                </button>
              );
            })}
          </div>
          <p className="report">{state.lastReport}</p>
        </div>

        <div className="panel">
          <h2>环境</h2>
          <div className="metrics">
            {(Object.keys(metrics) as Metric[]).map((metric) => (
              <label key={metric}>
                <span>{metricLabels[metric]}</span>
                <meter min={0} max={10} value={metrics[metric]} />
                <b>{metrics[metric]}</b>
              </label>
            ))}
          </div>
          <h2>已入住</h2>
          <div className="guest-list">
            {insects.map((insect) => (
              <article className={state.guests.includes(insect.id) ? "active" : ""} key={insect.id}>
                <span>{insect.icon}</span>
                <div>
                  <strong>{insect.name}</strong>
                  <p>{insect.note}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {showEncyclopedia && (
        <div className="encyclopedia-overlay" onClick={() => setShowEncyclopedia(false)}>
          <div className="encyclopedia-modal" onClick={(e) => e.stopPropagation()}>
            <div className="encyclopedia-header">
              <div>
                <p className="eyebrow">昆虫图鉴</p>
                <h2>认识你的小客人</h2>
                <p className="encyclopedia-progress">
                  已收集 <b>{state.guests.length}</b> / {insects.length}
                </p>
              </div>
              <button className="encyclopedia-close" onClick={() => setShowEncyclopedia(false)}>✕</button>
            </div>
            <div className="encyclopedia-grid">
              {insects.map((insect) => {
                const isCheckedIn = state.guests.includes(insect.id);
                return (
                  <article key={insect.id} className={`encyclopedia-card ${isCheckedIn ? "checked-in" : "locked"}`}>
                    <div className="encyclopedia-icon">
                      <span>{insect.icon}</span>
                      {isCheckedIn && <div className="encyclopedia-badge">已入住</div>}
                      {!isCheckedIn && <div className="encyclopedia-lock">🔒</div>}
                    </div>
                    <div className="encyclopedia-info">
                      <strong>{insect.name}</strong>
                      <div className="encyclopedia-likes">
                        <span className="likes-label">偏好：</span>
                        {Object.entries(insect.likes).map(([metric, value]) => (
                          <span key={metric} className="like-tag">
                            {metricLabels[metric as Metric]} ×{value}
                          </span>
                        ))}
                      </div>
                      <p className="encyclopedia-note">{insect.note}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
