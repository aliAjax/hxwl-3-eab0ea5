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

type ChallengeType = "attract" | "metric_limit" | "dual_insect";

type Challenge = {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  target: Record<string, number | string | string[]>;
  feedback: {
    success: string;
    fail: string;
  };
};

type ChallengeState = {
  currentChallengeId: string;
  date: string;
  completed: boolean;
  lastResult: string | null;
};

type HotelState = {
  placed: string[];
  guests: string[];
  lastReport: string;
};

type Snapshot = {
  id: string;
  name: string;
  placed: string[];
  guests: string[];
  metrics: Record<Metric, number>;
  lastReport: string;
  createdAt: string;
};

const storageKey = "hxwl-3-hotel";
const challengeStorageKey = "hxwl-3-challenge";
const snapshotStorageKey = "hxwl-3-snapshots";
const MAX_SNAPSHOTS = 5;

const challengePool: Challenge[] = [
  {
    id: "attract_bee",
    type: "attract",
    title: "欢迎独居蜂",
    description: "今天让至少一只独居蜂入住旅馆。",
    target: { insectId: "bee", count: 1 },
    feedback: {
      success: "太棒了！独居蜂找到了温馨的小家。",
      fail: "独居蜂还没有被吸引来，试着增加花蜜和藏身。"
    }
  },
  {
    id: "attract_firefly",
    type: "attract",
    title: "寻找萤火虫",
    description: "让萤火虫在今夜停留。",
    target: { insectId: "firefly", count: 1 },
    feedback: {
      success: "萤火虫在旅馆周围闪烁，真美！",
      fail: "萤火虫偏爱湿润和遮阴，再调整一下环境吧。"
    }
  },
  {
    id: "attract_butterfly",
    type: "attract",
    title: "蝴蝶翩翩",
    description: "吸引一只薄翅蝶来访。",
    target: { insectId: "butterfly", count: 1 },
    feedback: {
      success: "薄翅蝶在花丛中翩翩起舞！",
      fail: "蝴蝶需要充足的花蜜和一点点遮阴。"
    }
  },
  {
    id: "metric_nectar_6",
    type: "metric_limit",
    title: "花蜜收集家",
    description: "在不超过6格材料的情况下，让花蜜值达到8以上。",
    target: { metric: "nectar", value: 8, maxCells: 6 },
    feedback: {
      success: "高效的花蜜收集！小昆虫们有口福了。",
      fail: "花蜜还不够多，或者用了太多格子，再试试看。"
    }
  },
  {
    id: "metric_shelter_5",
    type: "metric_limit",
    title: "安全藏身处",
    description: "在不超过5格材料的情况下，让藏身值达到10。",
    target: { metric: "shelter", value: 10, maxCells: 5 },
    feedback: {
      success: "完美的藏身处！小昆虫们感到很安全。",
      fail: "藏身空间还不够，或者格子用多了，优化一下布局。"
    }
  },
  {
    id: "metric_moisture_5",
    type: "metric_limit",
    title: "湿润小天地",
    description: "用不超过5格材料，让湿润值达到8。",
    target: { metric: "moisture", value: 8, maxCells: 5 },
    feedback: {
      success: "湿润的环境刚刚好，萤火虫会喜欢的。",
      fail: "湿润度还不够，试试苔藓毯的组合。"
    }
  },
  {
    id: "metric_shade_4",
    type: "metric_limit",
    title: "清凉角落",
    description: "用不超过4格材料，让遮阴值达到6。",
    target: { metric: "shade", value: 6, maxCells: 4 },
    feedback: {
      success: "凉爽的树荫下，瓢虫们悠然自得。",
      fail: "遮阴还不够，试试阔叶伞的组合。"
    }
  },
  {
    id: "dual_bee_beetle",
    type: "dual_insect",
    title: "热闹旅馆",
    description: "同时满足独居蜂和蓝背甲虫的入住条件。",
    target: { insectIds: ["bee", "beetle"] },
    feedback: {
      success: "独居蜂和蓝背甲虫成为了邻居！",
      fail: "需要同时满足两种昆虫的偏好，花蜜和藏身都要足够。"
    }
  },
  {
    id: "dual_ladybird_firefly",
    type: "dual_insect",
    title: "夜间派对",
    description: "同时满足七星瓢虫和萤火虫的入住条件。",
    target: { insectIds: ["ladybird", "firefly"] },
    feedback: {
      success: "瓢虫和萤火虫共享这片小天地！",
      fail: "遮阴、湿润和藏身都要考虑到，再调整一下。"
    }
  },
  {
    id: "dual_butterfly_ladybird",
    type: "dual_insect",
    title: "春日访客",
    description: "同时满足薄翅蝶和七星瓢虫的入住条件。",
    target: { insectIds: ["butterfly", "ladybird"] },
    feedback: {
      success: "蝴蝶和瓢虫在花间嬉戏，一派春意！",
      fail: "需要花蜜、遮阴和藏身的平衡搭配。"
    }
  },
  {
    id: "attract_beetle",
    type: "attract",
    title: "甲虫之家",
    description: "让蓝背甲虫找到满意的藏身处。",
    target: { insectId: "beetle", count: 1 },
    feedback: {
      success: "蓝背甲虫满意地钻进了它的小窝！",
      fail: "蓝背甲虫需要足够多的藏身空间。"
    }
  },
  {
    id: "attract_ladybird",
    type: "attract",
    title: "瓢虫来做客",
    description: "吸引七星瓢虫入住。",
    target: { insectId: "ladybird", count: 1 },
    feedback: {
      success: "七星瓢虫慢悠悠地住进了新家！",
      fail: "瓢虫喜欢安静的角落，需要遮阴和藏身。"
    }
  }
];

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

function loadSnapshots(): Snapshot[] {
  try {
    return JSON.parse(localStorage.getItem(snapshotStorageKey) || "[]") as Snapshot[];
  } catch {
    return [];
  }
}

function saveSnapshots(snapshots: Snapshot[]): void {
  localStorage.setItem(snapshotStorageKey, JSON.stringify(snapshots));
}

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getLocalDayOfYear(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = current - start;
  return Math.floor(diff / 86400000);
}

function getTodayChallenge(): Challenge {
  const dayOfYear = getLocalDayOfYear(new Date());
  const index = dayOfYear % challengePool.length;
  return challengePool[index];
}

function loadChallengeState(): ChallengeState {
  const today = getTodayString();
  try {
    const saved = JSON.parse(localStorage.getItem(challengeStorageKey) || "") as ChallengeState;
    if (saved.date === today) {
      return saved;
    }
  } catch {
    // ignore
  }
  const challenge = getTodayChallenge();
  return {
    currentChallengeId: challenge.id,
    date: today,
    completed: false,
    lastResult: null
  };
}

function checkChallengeCompletion(
  challenge: Challenge,
  metrics: Record<Metric, number>,
  placedCount: number,
  matchedInsectIds: string[]
): { success: boolean; message: string } {
  switch (challenge.type) {
    case "attract": {
      const insectId = challenge.target.insectId as string;
      const success = matchedInsectIds.includes(insectId);
      return {
        success,
        message: success ? challenge.feedback.success : challenge.feedback.fail
      };
    }
    case "metric_limit": {
      const metric = challenge.target.metric as Metric;
      const value = challenge.target.value as number;
      const maxCells = challenge.target.maxCells as number;
      const success = metrics[metric] >= value && placedCount <= maxCells;
      return {
        success,
        message: success ? challenge.feedback.success : challenge.feedback.fail
      };
    }
    case "dual_insect": {
      const insectIds = challenge.target.insectIds as string[];
      const success = insectIds.every((id) => matchedInsectIds.includes(id));
      return {
        success,
        message: success ? challenge.feedback.success : challenge.feedback.fail
      };
    }
    default:
      return { success: false, message: "未知挑战类型。" };
  }
}

export default function App() {
  const [state, setState] = useState<HotelState>(loadState);
  const [challengeState, setChallengeState] = useState<ChallengeState>(loadChallengeState);
  const [showEncyclopedia, setShowEncyclopedia] = useState(false);
  const [showChallengeResult, setShowChallengeResult] = useState(false);
  const [challengeResult, setChallengeResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedDecoration, setSelectedDecoration] = useState<Decoration | null>(null);
  const [showMaterialDrawer, setShowMaterialDrawer] = useState(false);
  const [snapshots, setSnapshots] = useState<Snapshot[]>(loadSnapshots);
  const [snapshotName, setSnapshotName] = useState("");
  const [showSnapshotPanel, setShowSnapshotPanel] = useState(false);

  const todayChallenge = useMemo(
    () => challengePool.find((c) => c.id === challengeState.currentChallengeId) || challengePool[0],
    [challengeState.currentChallengeId]
  );

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem(challengeStorageKey, JSON.stringify(challengeState));
  }, [challengeState]);

  useEffect(() => {
    saveSnapshots(snapshots);
  }, [snapshots]);

  useEffect(() => {
    const checkDate = () => {
      const today = getTodayString();
      if (challengeState.date !== today) {
        const challenge = getTodayChallenge();
        setChallengeState({
          currentChallengeId: challenge.id,
          date: today,
          completed: false,
          lastResult: null
        });
      }
    };
    checkDate();
    const interval = setInterval(checkDate, 60000);
    return () => clearInterval(interval);
  }, [challengeState.date]);

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

  function getRelatedInsects(decoration: Decoration): { insect: Insect; matchCount: number }[] {
    return insects
      .map((insect) => {
        let matchCount = 0;
        Object.entries(insect.likes).forEach(([metric, required]) => {
          if (decoration.metrics[metric as Metric] > 0 && required !== undefined) {
            matchCount++;
          }
        });
        return { insect, matchCount };
      })
      .filter((item) => item.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount);
  }

  function addDecoration(id: string) {
    if (state.placed.length >= 12) return;
    const decoration = decorations.find((item) => item.id === id);
    if (decoration) {
      setSelectedDecoration(decoration);
      setShowMaterialDrawer(true);
    }
    setState((current) => ({ ...current, placed: [...current.placed, id] }));
  }

  function closeMaterialDrawer() {
    setShowMaterialDrawer(false);
    setTimeout(() => setSelectedDecoration(null), 300);
  }

  function settleDay() {
    const matched = insects.filter((insect) =>
      Object.entries(insect.likes).every(([metric, value]) => metrics[metric as Metric] >= Number(value))
    );
    const matchedIds = matched.map((insect) => insect.id);
    const guestIds = Array.from(new Set([...state.guests, ...matchedIds]));
    const report =
      matched.length > 0
        ? `今天有${matched.map((insect) => insect.name).join("、")}注意到了旅馆。`
        : "今天环境还不够有吸引力，试着增加花蜜、湿润或藏身处。";
    setState((current) => ({ ...current, guests: guestIds, lastReport: report }));

    if (!challengeState.completed) {
      const result = checkChallengeCompletion(todayChallenge, metrics, state.placed.length, matchedIds);
      setChallengeResult(result);
      setShowChallengeResult(true);
      setChallengeState((current) => ({
        ...current,
        completed: result.success,
        lastResult: result.message
      }));
    }
  }

  function createSnapshot() {
    const trimmed = snapshotName.trim();
    if (!trimmed) return;
    if (snapshots.length >= MAX_SNAPSHOTS) {
      setSnapshots((prev) => {
        const rest = prev.slice(1);
        return [
          ...rest,
          {
            id: Date.now().toString(36),
            name: trimmed,
            placed: [...state.placed],
            guests: [...state.guests],
            metrics: { ...metrics },
            lastReport: state.lastReport,
            createdAt: new Date().toLocaleString("zh-CN")
          }
        ];
      });
    } else {
      setSnapshots((prev) => [
        ...prev,
        {
          id: Date.now().toString(36),
          name: trimmed,
          placed: [...state.placed],
          guests: [...state.guests],
          metrics: { ...metrics },
          lastReport: state.lastReport,
          createdAt: new Date().toLocaleString("zh-CN")
        }
      ]);
    }
    setSnapshotName("");
  }

  function restoreSnapshot(snapshot: Snapshot) {
    setState((current) => ({
      ...current,
      placed: [...snapshot.placed],
      guests: [...snapshot.guests],
      lastReport: snapshot.lastReport
    }));
    setShowSnapshotPanel(false);
  }

  function deleteSnapshot(id: string) {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
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
          <button onClick={() => setShowSnapshotPanel(true)}>旅馆快照</button>
          <button onClick={() => setState({ placed: [], guests: [], lastReport: "旅馆已重新整理。" })}>清空旅馆</button>
          <button className="primary" onClick={settleDay}>结算今天</button>
        </div>
      </section>

      <section className="challenge-banner">
        <div className={`challenge-card ${challengeState.completed ? "completed" : ""}`}>
          <div className="challenge-icon">
            {challengeState.completed ? "✓" : "★"}
          </div>
          <div className="challenge-content">
            <p className="eyebrow">每日挑战 · {todayChallenge.type === "attract" ? "吸引昆虫" : todayChallenge.type === "metric_limit" ? "环境目标" : "双重满足"}</p>
            <h2>{todayChallenge.title}</h2>
            <p>{todayChallenge.description}</p>
            {challengeState.completed && challengeState.lastResult && (
              <p className="challenge-complete-note">✓ {challengeState.lastResult}</p>
            )}
          </div>
          <div className="challenge-status">
            <span className={`status-badge ${challengeState.completed ? "done" : "pending"}`}>
              {challengeState.completed ? "已完成" : "进行中"}
            </span>
          </div>
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

      {showChallengeResult && challengeResult && (
        <div className="challenge-overlay" onClick={() => setShowChallengeResult(false)}>
          <div className="challenge-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`challenge-modal-icon ${challengeResult.success ? "success" : "fail"}`}>
              {challengeResult.success ? "🎉" : "💪"}
            </div>
            <h2 className="challenge-modal-title">
              {challengeResult.success ? "挑战成功！" : "继续加油！"}
            </h2>
            <p className="challenge-modal-message">{challengeResult.message}</p>
            <button
              className="challenge-modal-button"
              onClick={() => setShowChallengeResult(false)}
            >
              知道了
            </button>
          </div>
        </div>
      )}

      {selectedDecoration && (
        <div
          className={`material-drawer-overlay ${showMaterialDrawer ? "visible" : ""}`}
          onClick={closeMaterialDrawer}
        >
          <div
            className={`material-drawer ${showMaterialDrawer ? "open" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="material-drawer-header">
              <div className="material-drawer-title">
                <div
                  className="material-drawer-icon"
                  style={{ background: selectedDecoration.color }}
                >
                  {selectedDecoration.icon}
                </div>
                <div>
                  <p className="eyebrow">材料详情</p>
                  <h2>{selectedDecoration.name}</h2>
                </div>
              </div>
              <button className="material-drawer-close" onClick={closeMaterialDrawer}>
                ✕
              </button>
            </div>

            <div className="material-drawer-content">
              <section>
                <h3>环境指标影响</h3>
                <div className="material-metrics">
                  {(Object.keys(selectedDecoration.metrics) as Metric[]).map((metric) => {
                    const value = selectedDecoration.metrics[metric];
                    return (
                      <div key={metric} className="material-metric-item">
                        <span className="material-metric-label">{metricLabels[metric]}</span>
                        <div className="material-metric-bar-wrapper">
                          <div
                            className={`material-metric-bar ${value > 0 ? "positive" : "neutral"}`}
                            style={{ width: `${(value / 4) * 100}%` }}
                          />
                        </div>
                        <b className="material-metric-value">
                          {value > 0 ? `+${value}` : value}
                        </b>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3>适合吸引</h3>
                <div className="material-related-insects">
                  {getRelatedInsects(selectedDecoration).length > 0 ? (
                    getRelatedInsects(selectedDecoration).map(({ insect, matchCount }) => (
                      <div key={insect.id} className="material-insect-card">
                        <span className="material-insect-icon">{insect.icon}</span>
                        <div>
                          <strong>{insect.name}</strong>
                          <p>
                            {matchCount >= 2
                              ? `提供了${matchCount}项偏好，很可能吸引它来访`
                              : "有一定吸引力"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="material-no-insects">
                      单独使用效果有限，建议与其他材料组合搭配。
                    </p>
                  )}
                </div>
              </section>

              <button className="material-drawer-action" onClick={closeMaterialDrawer}>
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {showSnapshotPanel && (
        <div className="snapshot-overlay" onClick={() => setShowSnapshotPanel(false)}>
          <div className="snapshot-modal" onClick={(e) => e.stopPropagation()}>
            <div className="snapshot-header">
              <div>
                <p className="eyebrow">旅馆快照</p>
                <h2>保存与恢复布局</h2>
                <p className="snapshot-progress">
                  已保存 <b>{snapshots.length}</b> / {MAX_SNAPSHOTS}
                </p>
              </div>
              <button className="snapshot-close" onClick={() => setShowSnapshotPanel(false)}>✕</button>
            </div>

            <div className="snapshot-save">
              <input
                type="text"
                placeholder="输入快照名称…"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") createSnapshot(); }}
                maxLength={20}
              />
              <button
                className="snapshot-save-btn"
                onClick={createSnapshot}
                disabled={!snapshotName.trim()}
              >
                保存快照
              </button>
            </div>

            {snapshots.length === 0 ? (
              <div className="snapshot-empty">
                <p>还没有保存过快照。</p>
                <p>给当前旅馆布局取个名字，方便以后恢复。</p>
              </div>
            ) : (
              <div className="snapshot-list">
                {snapshots.map((snapshot) => {
                  const guestNames = snapshot.guests
                    .map((gid) => insects.find((i) => i.id === gid)?.name)
                    .filter(Boolean) as string[];
                  return (
                    <article key={snapshot.id} className="snapshot-card">
                      <div className="snapshot-card-info">
                        <div className="snapshot-card-name">
                          <strong>{snapshot.name}</strong>
                          <span className="snapshot-card-time">{snapshot.createdAt}</span>
                        </div>
                        <div className="snapshot-card-detail">
                          <span className="snapshot-tag layout-tag">
                            布局 {snapshot.placed.length}格
                          </span>
                          {guestNames.length > 0 && (
                            <span className="snapshot-tag guest-tag">
                              访客 {guestNames.join("、")}
                            </span>
                          )}
                          <div className="snapshot-metrics-mini">
                            {(Object.keys(snapshot.metrics) as Metric[]).map((m) => (
                              <span key={m} className="snapshot-metric-chip">
                                {metricLabels[m]} {snapshot.metrics[m]}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="snapshot-card-actions">
                        <button
                          className="snapshot-restore-btn"
                          onClick={() => restoreSnapshot(snapshot)}
                        >
                          恢复
                        </button>
                        <button
                          className="snapshot-delete-btn"
                          onClick={() => deleteSnapshot(snapshot.id)}
                        >
                          删除
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
