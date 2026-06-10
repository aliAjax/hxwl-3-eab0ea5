import { useEffect, useMemo, useRef, useState } from "react";

type Metric = "shade" | "nectar" | "shelter" | "moisture";

type SeasonId = "spring" | "summer" | "autumn" | "winter";

type Season = {
  id: SeasonId;
  name: string;
  icon: string;
  color: string;
  description: string;
  metricBoosts: Partial<Record<Metric, number>>;
  insectThresholdAdjustments: Record<string, Partial<Record<Metric, number>>>;
  affectedMetrics: Metric[];
  affectedInsects: string[];
};

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

type ObservationLog = {
  id: string;
  date: string;
  seasonId: SeasonId | null;
  seasonName: string;
  placed: string[];
  baseMetrics: Record<Metric, number>;
  adjustedMetrics: Record<Metric, number>;
  newInsectIds: string[];
  challengeId: string;
  challengeTitle: string;
  challengeSuccess: boolean;
  hotelGrade: string;
  ecologyBalance: number;
  visitorAttraction: number;
  spaceUtilization: number;
  createdAt: string;
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

type SuggestionItem = {
  text: string;
  type: "add" | "replace" | "attract" | "praise";
  metricDeltas: { metric: Metric; delta: number }[];
  relatedDecoration?: string;
  relatedInsect?: string;
};

type CalendarDayChallenge = {
  dateStr: string;
  date: Date;
  dayOfWeek: string;
  dayOfMonth: number;
  isToday: boolean;
  challenge: Challenge;
  recommendedSeason: Season;
  beneficialInsects: Insect[];
  keyMetrics: Metric[];
  suggestedMaterials: Decoration[];
};

const WEEKDAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const storageKey = "hxwl-3-hotel";
const challengeStorageKey = "hxwl-3-challenge";
const snapshotStorageKey = "hxwl-3-snapshots";
const seasonStorageKey = "hxwl-3-season";
const logStorageKey = "hxwl-3-observation-logs";
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

const seasons: Season[] = [
  {
    id: "spring",
    name: "春季",
    icon: "🌱",
    color: "#7fb77e",
    description: "万物复苏，花蜜开始涌现，蜜蜂和蝴蝶更加活跃。",
    metricBoosts: { nectar: 1, moisture: 1 },
    insectThresholdAdjustments: {
      bee: { nectar: -1, shelter: -1 },
      butterfly: { nectar: -1, shade: -1 },
      ladybird: { shade: 1, shelter: 1 },
      firefly: { moisture: 1, shade: 1 },
      beetle: { shelter: 1 }
    },
    affectedMetrics: ["nectar", "moisture"],
    affectedInsects: ["bee", "butterfly"]
  },
  {
    id: "summer",
    name: "夏季",
    icon: "☀️",
    color: "#f9b208",
    description: "烈日炎炎，遮阴和湿润变得珍贵，萤火虫在夏夜闪烁。",
    metricBoosts: { shade: 1, shelter: 1 },
    insectThresholdAdjustments: {
      firefly: { moisture: -1, shade: -1 },
      ladybird: { shade: -1, shelter: -1 },
      bee: { nectar: 1, shelter: 1 },
      butterfly: { nectar: 1, shade: 1 },
      beetle: { shelter: 1 }
    },
    affectedMetrics: ["shade", "shelter"],
    affectedInsects: ["firefly", "ladybird"]
  },
  {
    id: "autumn",
    name: "秋季",
    icon: "🍂",
    color: "#d97706",
    description: "落叶纷飞，甲虫寻找过冬的藏身处，瓢虫也在寻觅温暖角落。",
    metricBoosts: { shelter: 2, shade: 1 },
    insectThresholdAdjustments: {
      beetle: { shelter: -2 },
      ladybird: { shelter: -1, shade: -1 },
      bee: { nectar: 1, shelter: 1 },
      butterfly: { nectar: 1 },
      firefly: { moisture: 1, shade: 1 }
    },
    affectedMetrics: ["shelter", "shade"],
    affectedInsects: ["beetle", "ladybird"]
  },
  {
    id: "winter",
    name: "冬季",
    icon: "❄️",
    color: "#60a5fa",
    description: "寒风凛冽，只有最坚强的昆虫才会冒险外出，藏身至关重要。",
    metricBoosts: { shelter: 2 },
    insectThresholdAdjustments: {
      beetle: { shelter: -1 },
      bee: { nectar: 2, shelter: 2 },
      butterfly: { nectar: 2, shade: 2 },
      ladybird: { shade: 2, shelter: 2 },
      firefly: { moisture: 2, shade: 2 }
    },
    affectedMetrics: ["shelter"],
    affectedInsects: ["beetle"]
  }
];

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

function cleanPlacedArray(placed: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < 12; i++) {
    const val = placed[i];
    result.push(val && decorations.find((d) => d.id === val) ? val : "");
  }
  let endIndex = 11;
  while (endIndex >= 0 && result[endIndex] === "") {
    endIndex--;
  }
  return result.slice(0, endIndex + 1);
}

function loadState(): HotelState {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "") as HotelState;
    return {
      ...saved,
      placed: cleanPlacedArray(saved.placed || [])
    };
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

function getChallengeForDate(date: Date): Challenge {
  const dayOfYear = getLocalDayOfYear(date);
  const index = dayOfYear % challengePool.length;
  return challengePool[index];
}

function getDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getSeasonForDate(date: Date): Season {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return seasons[0];
  if (month >= 5 && month <= 7) return seasons[1];
  if (month >= 8 && month <= 10) return seasons[2];
  return seasons[3];
}

function getBeneficialInsectsForChallenge(challenge: Challenge): Insect[] {
  const insectIds: string[] = [];
  if (challenge.type === "attract") {
    insectIds.push(challenge.target.insectId as string);
  } else if (challenge.type === "dual_insect") {
    insectIds.push(...(challenge.target.insectIds as string[]));
  } else if (challenge.type === "metric_limit") {
    const metric = challenge.target.metric as Metric;
    insects.forEach((insect) => {
      if (insect.likes[metric] !== undefined) {
        insectIds.push(insect.id);
      }
    });
  }
  return insectIds
    .filter((id, idx, arr) => arr.indexOf(id) === idx)
    .map((id) => insects.find((i) => i.id === id))
    .filter(Boolean) as Insect[];
}

function getKeyMetricsForChallenge(challenge: Challenge): Metric[] {
  const metrics: Metric[] = [];
  if (challenge.type === "attract") {
    const insect = insects.find((i) => i.id === challenge.target.insectId);
    if (insect) {
      Object.keys(insect.likes).forEach((m) => metrics.push(m as Metric));
    }
  } else if (challenge.type === "dual_insect") {
    (challenge.target.insectIds as string[]).forEach((id) => {
      const insect = insects.find((i) => i.id === id);
      if (insect) {
        Object.keys(insect.likes).forEach((m) => {
          if (!metrics.includes(m as Metric)) metrics.push(m as Metric);
        });
      }
    });
  } else if (challenge.type === "metric_limit") {
    metrics.push(challenge.target.metric as Metric);
  }
  return metrics;
}

function getSuggestedMaterialsForChallenge(
  challenge: Challenge,
  season: Season
): Decoration[] {
  const keyMetrics = getKeyMetricsForChallenge(challenge);
  const scored = decorations.map((deco) => {
    let score = 0;
    keyMetrics.forEach((m) => {
      let value = deco.metrics[m];
      if (value > 0 && season.affectedMetrics.includes(m)) {
        value += season.metricBoosts[m] || 0;
      }
      score += value;
    });
    return { deco, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((s) => s.deco);
}

function generateWeekCalendar(): CalendarDayChallenge[] {
  const result: CalendarDayChallenge[] = [];
  const today = new Date();
  const todayStr = getDateString(today);

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const challenge = getChallengeForDate(date);
    const recommendedSeason = getSeasonForDate(date);
    result.push({
      dateStr: getDateString(date),
      date,
      dayOfWeek: WEEKDAY_NAMES[date.getDay()],
      dayOfMonth: date.getDate(),
      isToday: getDateString(date) === todayStr,
      challenge,
      recommendedSeason,
      beneficialInsects: getBeneficialInsectsForChallenge(challenge),
      keyMetrics: getKeyMetricsForChallenge(challenge),
      suggestedMaterials: getSuggestedMaterialsForChallenge(challenge, recommendedSeason)
    });
  }
  return result;
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

function loadSeason(): SeasonId | null {
  try {
    const saved = localStorage.getItem(seasonStorageKey);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as SeasonId;
    if (seasons.some((s) => s.id === parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

function loadLogs(): ObservationLog[] {
  try {
    return JSON.parse(localStorage.getItem(logStorageKey) || "[]") as ObservationLog[];
  } catch {
    return [];
  }
}

function saveLogs(logs: ObservationLog[]): void {
  localStorage.setItem(logStorageKey, JSON.stringify(logs));
}

function getAdjustedLikes(insect: Insect, season: Season | null): Partial<Record<Metric, number>> {
  if (!season) return insect.likes;
  const adjustments = season.insectThresholdAdjustments[insect.id] || {};
  const result: Partial<Record<Metric, number>> = {};
  (Object.keys(insect.likes) as Metric[]).forEach((metric) => {
    const base = insect.likes[metric] || 0;
    const adj = adjustments[metric] || 0;
    result[metric] = Math.max(0, base + adj);
  });
  return result;
}

type LayoutCandidate = {
  id: string;
  name: string;
  strategy: "focus" | "balanced" | "challenge" | "diversity";
  placed: string[];
  metrics: Record<Metric, number>;
  adjustedMetrics: Record<Metric, number>;
  attractedInsectIds: string[];
  score: number;
  scoreDetail: {
    ecology: number;
    attraction: number;
    space: number;
  };
  canCompleteChallenge: boolean;
  challengeNote: string;
};

type LayoutLabConfig = {
  targetInsectId: string | null;
  seasonId: SeasonId | null;
  maxCells: number;
};

function calculateMetricsForPlaced(placed: string[]): Record<Metric, number> {
  return placed.reduce(
    (total, id) => {
      const decoration = decorations.find((item) => item.id === id);
      if (!decoration) return total;
      (Object.keys(total) as Metric[]).forEach((metric) => {
        total[metric] += decoration.metrics[metric];
      });
      return total;
    },
    { shade: 0, nectar: 0, shelter: 0, moisture: 0 }
  );
}

function calculateAdjustedMetrics(placed: string[], season: Season | null): Record<Metric, number> {
  if (!season || placed.length === 0) return calculateMetricsForPlaced(placed);
  const seasonBoosts = season.metricBoosts;
  return placed.reduce(
    (total, id) => {
      const decoration = decorations.find((item) => item.id === id);
      if (!decoration) return total;
      (Object.keys(total) as Metric[]).forEach((metric) => {
        let value = decoration.metrics[metric];
        if (value > 0 && seasonBoosts[metric] !== undefined) {
          value += seasonBoosts[metric]!;
        }
        total[metric] += value;
      });
      return total;
    },
    { shade: 0, nectar: 0, shelter: 0, moisture: 0 }
  );
}

function getAttractedInsectIds(metrics: Record<Metric, number>, season: Season | null): string[] {
  return insects
    .filter((insect) => {
      const adjustedLikes = getAdjustedLikes(insect, season);
      return Object.entries(adjustedLikes).every(
        ([metric, value]) => metrics[metric as Metric] >= Number(value)
      );
    })
    .map((insect) => insect.id);
}

function calculateLayoutScore(
  metrics: Record<Metric, number>,
  placed: string[],
  season: Season | null,
  targetInsectId: string | null
): { total: number; ecology: number; attraction: number; space: number } {
  const metricValues = (Object.keys(metrics) as Metric[]).map((m) => metrics[m]);
  const totalMetricSum = metricValues.reduce((a, b) => a + b, 0);
  const mean = totalMetricSum / 4;
  let ecologyBalance = 0;
  if (mean > 0) {
    const variance = metricValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / 4;
    const stddev = Math.sqrt(variance);
    const cv = stddev / mean;
    ecologyBalance = Math.max(0, Math.min(100, (1 - cv) * 100));
  }
  const zeroMetrics = metricValues.filter((v) => v === 0).length;
  ecologyBalance = Math.max(0, ecologyBalance - zeroMetrics * 18);

  const attractedIds = getAttractedInsectIds(metrics, season);
  let totalRequirementRatio = 0;
  insects.forEach((insect) => {
    const adjustedLikes = getAdjustedLikes(insect, season);
    const requirements = Object.entries(adjustedLikes);
    if (requirements.length === 0) return;
    let metCount = 0;
    requirements.forEach(([metric, value]) => {
      if (metrics[metric as Metric] >= Number(value)) metCount++;
    });
    totalRequirementRatio += metCount / requirements.length;
  });
  const visitorAttraction = Math.round((totalRequirementRatio / insects.length) * 100);

  const fillRate = placed.length / 12;
  const uniqueTypes = new Set(placed).size;
  const diversity = uniqueTypes / decorations.length;
  const counts: Record<string, number> = {};
  placed.forEach((id) => {
    counts[id] = (counts[id] || 0) + 1;
  });
  const maxCount = Math.max(...Object.values(counts), 0);
  const excessiveDupPenalty = maxCount > 4 ? 0.5 : maxCount > 3 ? 0.8 : 1;
  const spaceUtilization = Math.round(
    (fillRate * 0.4 + diversity * 0.35 + fillRate * excessiveDupPenalty * 0.25) * 100
  );

  let targetBonus = 0;
  if (targetInsectId && attractedIds.includes(targetInsectId)) {
    targetBonus = 15;
  }

  const total = Math.round((ecologyBalance + visitorAttraction + spaceUtilization) / 3) + targetBonus;

  return {
    total: Math.min(100, Math.max(0, total)),
    ecology: Math.min(100, Math.round(ecologyBalance)),
    attraction: Math.min(100, visitorAttraction),
    space: Math.min(100, spaceUtilization)
  };
}

function generateFocusedLayout(targetInsect: Insect, season: Season | null, maxCells: number): string[] {
  const adjustedLikes = getAdjustedLikes(targetInsect, season);
  const requiredMetrics = Object.entries(adjustedLikes) as [Metric, number][];
  
  const scoredDecos = decorations.map((deco) => {
    let score = 0;
    requiredMetrics.forEach(([metric, needed]) => {
      if (deco.metrics[metric] > 0) {
        score += Math.min(deco.metrics[metric], needed) * 2;
      }
    });
    return { deco, score };
  });
  scoredDecos.sort((a, b) => b.score - a.score);

  const placed: string[] = [];
  const currentMetrics = { shade: 0, nectar: 0, shelter: 0, moisture: 0 };
  let cellsUsed = 0;

  while (cellsUsed < maxCells) {
    let bestDeco = scoredDecos[0]?.deco;
    let bestScore = -1;

    scoredDecos.forEach(({ deco }) => {
      let marginalScore = 0;
      requiredMetrics.forEach(([metric, needed]) => {
        const current = currentMetrics[metric];
        if (current < needed) {
          marginalScore += Math.min(deco.metrics[metric], needed - current);
        }
      });
      if (marginalScore > bestScore) {
        bestScore = marginalScore;
        bestDeco = deco;
      }
    });

    if (bestScore <= 0 && cellsUsed >= maxCells - 1) break;
    if (bestScore <= 0) {
      const fallbackDeco = decorations.find((d) => !placed.includes(d.id)) || scoredDecos[0]?.deco;
      if (!fallbackDeco) break;
      bestDeco = fallbackDeco;
    }

    if (!bestDeco) break;

    placed.push(bestDeco.id);
    (Object.keys(bestDeco.metrics) as Metric[]).forEach((m) => {
      currentMetrics[m] += bestDeco!.metrics[m];
    });
    cellsUsed++;

    const allMet = requiredMetrics.every(([metric, needed]) => currentMetrics[metric] >= needed);
    if (allMet && cellsUsed >= Math.min(3, maxCells * 0.5)) break;
  }

  while (placed.length < 12) placed.push("");
  return placed.slice(0, 12);
}

function generateBalancedLayout(season: Season | null, maxCells: number): string[] {
  const placed: string[] = [];
  const currentMetrics = { shade: 0, nectar: 0, shelter: 0, moisture: 0 };
  let cellsUsed = 0;

  while (cellsUsed < maxCells) {
    let bestDeco = decorations[0];
    let bestScore = -1;

    decorations.forEach((deco) => {
      const tempMetrics = { ...currentMetrics };
      (Object.keys(deco.metrics) as Metric[]).forEach((m) => {
        tempMetrics[m] += deco.metrics[m];
      });
      const values = (Object.keys(tempMetrics) as Metric[]).map((m) => tempMetrics[m]);
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      const balance = maxVal === 0 ? 0 : 1 - (maxVal - minVal) / (maxVal + 1);
      const total = values.reduce((a, b) => a + b, 0);
      const score = balance * 10 + total * 0.5;
      if (score > bestScore) {
        bestScore = score;
        bestDeco = deco;
      }
    });

    placed.push(bestDeco.id);
    (Object.keys(bestDeco.metrics) as Metric[]).forEach((m) => {
      currentMetrics[m] += bestDeco.metrics[m];
    });
    cellsUsed++;
  }

  while (placed.length < 12) placed.push("");
  return placed.slice(0, 12);
}

function generateDiversityLayout(season: Season | null, maxCells: number): string[] {
  const placed: string[] = [];
  const currentMetrics = { shade: 0, nectar: 0, shelter: 0, moisture: 0 };
  let cellsUsed = 0;

  const shuffledDecos = [...decorations].sort(() => Math.random() - 0.5);
  const initialCount = Math.min(decorations.length, maxCells);
  for (let i = 0; i < initialCount; i++) {
    placed.push(shuffledDecos[i].id);
    (Object.keys(shuffledDecos[i].metrics) as Metric[]).forEach((m) => {
      currentMetrics[m] += shuffledDecos[i].metrics[m];
    });
    cellsUsed++;
  }

  while (cellsUsed < maxCells) {
    const counts: Record<string, number> = {};
    placed.forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    });

    let bestDeco = decorations[0];
    let bestScore = -1;

    decorations.forEach((deco) => {
      const currentCount = counts[deco.id] || 0;
      const diversityBonus = Math.max(0, 3 - currentCount) * 3;
      const tempMetrics = { ...currentMetrics };
      (Object.keys(deco.metrics) as Metric[]).forEach((m) => {
        tempMetrics[m] += deco.metrics[m];
      });
      const values = (Object.keys(tempMetrics) as Metric[]).map((m) => tempMetrics[m]);
      const total = values.reduce((a, b) => a + b, 0);
      const score = diversityBonus + total * 0.3;
      if (score > bestScore) {
        bestScore = score;
        bestDeco = deco;
      }
    });

    placed.push(bestDeco.id);
    (Object.keys(bestDeco.metrics) as Metric[]).forEach((m) => {
      currentMetrics[m] += bestDeco.metrics[m];
    });
    cellsUsed++;
  }

  while (placed.length < 12) placed.push("");
  return placed.slice(0, 12);
}

function generateChallengeOrientedLayout(
  challenge: Challenge,
  season: Season | null,
  maxCells: number
): string[] {
  const keyMetrics = getKeyMetricsForChallenge(challenge);
  
  const placed: string[] = [];
  const currentMetrics = { shade: 0, nectar: 0, shelter: 0, moisture: 0 };
  let cellsUsed = 0;

  if (challenge.type === "metric_limit") {
    const targetMetric = challenge.target.metric as Metric;
    const targetValue = challenge.target.value as number;
    const maxCellsLimit = challenge.target.maxCells as number;
    const actualMax = Math.min(maxCells, maxCellsLimit);

    const sortedDecos = [...decorations].sort(
      (a, b) => b.metrics[targetMetric] - a.metrics[targetMetric]
    );

    while (cellsUsed < actualMax && currentMetrics[targetMetric] < targetValue) {
      const bestDeco = sortedDecos[0];
      placed.push(bestDeco.id);
      (Object.keys(bestDeco.metrics) as Metric[]).forEach((m) => {
        currentMetrics[m] += bestDeco.metrics[m];
      });
      cellsUsed++;
    }
  } else if (challenge.type === "attract" || challenge.type === "dual_insect") {
    const insectIds = challenge.type === "attract"
      ? [challenge.target.insectId as string]
      : (challenge.target.insectIds as string[]);

    const targetInsects = insectIds
      .map((id) => insects.find((i) => i.id === id))
      .filter(Boolean) as Insect[];

    const requiredMetricsSet = new Set<Metric>();
    targetInsects.forEach((insect) => {
      Object.keys(getAdjustedLikes(insect, season)).forEach((m) =>
        requiredMetricsSet.add(m as Metric)
      );
    });

    while (cellsUsed < maxCells) {
      let bestDeco = decorations[0];
      let bestScore = -1;

      decorations.forEach((deco) => {
        let score = 0;
        requiredMetricsSet.forEach((metric) => {
          score += deco.metrics[metric] * 2;
        });
        if (score > bestScore) {
          bestScore = score;
          bestDeco = deco;
        }
      });

      placed.push(bestDeco.id);
      (Object.keys(bestDeco.metrics) as Metric[]).forEach((m) => {
        currentMetrics[m] += bestDeco.metrics[m];
      });
      cellsUsed++;

      const effectiveMetrics = calculateAdjustedMetrics(placed, season);
      const allSatisfied = targetInsects.every((insect) => {
        const adjustedLikes = getAdjustedLikes(insect, season);
        return Object.entries(adjustedLikes).every(
          ([metric, value]) => effectiveMetrics[metric as Metric] >= Number(value)
        );
      });
      if (allSatisfied && cellsUsed >= 3) break;
    }
  }

  while (placed.length < 12) placed.push("");
  return placed.slice(0, 12);
}

function generateLayoutCandidates(
  config: LayoutLabConfig,
  challenge: Challenge
): LayoutCandidate[] {
  const season = config.seasonId
    ? seasons.find((s) => s.id === config.seasonId) || null
    : null;

  const candidates: LayoutCandidate[] = [];
  const maxCells = Math.max(1, Math.min(12, config.maxCells));

  if (config.targetInsectId) {
    const targetInsect = insects.find((i) => i.id === config.targetInsectId);
    if (targetInsect) {
      const focusedPlaced = generateFocusedLayout(targetInsect, season, maxCells);
      const focusedMetrics = calculateMetricsForPlaced(focusedPlaced.filter(Boolean));
      const focusedAdjusted = calculateAdjustedMetrics(focusedPlaced.filter(Boolean), season);
      const focusedAttracted = getAttractedInsectIds(focusedAdjusted, season);
      const focusedScore = calculateLayoutScore(
        focusedAdjusted,
        focusedPlaced.filter(Boolean),
        season,
        config.targetInsectId
      );
      const challengeResult = checkChallengeCompletion(
        challenge,
        focusedAdjusted,
        focusedPlaced.filter(Boolean).length,
        focusedAttracted
      );

      candidates.push({
        id: "focus-" + Date.now() + "-1",
        name: "目标专注型",
        strategy: "focus",
        placed: focusedPlaced,
        metrics: focusedMetrics,
        adjustedMetrics: focusedAdjusted,
        attractedInsectIds: focusedAttracted,
        score: focusedScore.total,
        scoreDetail: {
          ecology: focusedScore.ecology,
          attraction: focusedScore.attraction,
          space: focusedScore.space
        },
        canCompleteChallenge: challengeResult.success,
        challengeNote: challengeResult.message
      });
    }
  } else {
    const diversityPlaced = generateDiversityLayout(season, maxCells);
    const diversityMetrics = calculateMetricsForPlaced(diversityPlaced.filter(Boolean));
    const diversityAdjusted = calculateAdjustedMetrics(diversityPlaced.filter(Boolean), season);
    const diversityAttracted = getAttractedInsectIds(diversityAdjusted, season);
    const diversityScore = calculateLayoutScore(
      diversityAdjusted,
      diversityPlaced.filter(Boolean),
      season,
      null
    );
    const diversityChallengeResult = checkChallengeCompletion(
      challenge,
      diversityAdjusted,
      diversityPlaced.filter(Boolean).length,
      diversityAttracted
    );

    candidates.push({
      id: "diversity-" + Date.now() + "-1",
      name: "多样探索型",
      strategy: "diversity",
      placed: diversityPlaced,
      metrics: diversityMetrics,
      adjustedMetrics: diversityAdjusted,
      attractedInsectIds: diversityAttracted,
      score: diversityScore.total,
      scoreDetail: {
        ecology: diversityScore.ecology,
        attraction: diversityScore.attraction,
        space: diversityScore.space
      },
      canCompleteChallenge: diversityChallengeResult.success,
      challengeNote: diversityChallengeResult.message
    });
  }

  const balancedPlaced = generateBalancedLayout(season, maxCells);
  const balancedMetrics = calculateMetricsForPlaced(balancedPlaced.filter(Boolean));
  const balancedAdjusted = calculateAdjustedMetrics(balancedPlaced.filter(Boolean), season);
  const balancedAttracted = getAttractedInsectIds(balancedAdjusted, season);
  const balancedScore = calculateLayoutScore(
    balancedAdjusted,
    balancedPlaced.filter(Boolean),
    season,
    config.targetInsectId
  );
  const balancedChallengeResult = checkChallengeCompletion(
    challenge,
    balancedAdjusted,
    balancedPlaced.filter(Boolean).length,
    balancedAttracted
  );

  candidates.push({
    id: "balanced-" + Date.now() + "-2",
    name: "均衡发展型",
    strategy: "balanced",
    placed: balancedPlaced,
    metrics: balancedMetrics,
    adjustedMetrics: balancedAdjusted,
    attractedInsectIds: balancedAttracted,
    score: balancedScore.total,
    scoreDetail: {
      ecology: balancedScore.ecology,
      attraction: balancedScore.attraction,
      space: balancedScore.space
    },
    canCompleteChallenge: balancedChallengeResult.success,
    challengeNote: balancedChallengeResult.message
  });

  const challengePlaced = generateChallengeOrientedLayout(challenge, season, maxCells);
  const challengeMetrics = calculateMetricsForPlaced(challengePlaced.filter(Boolean));
  const challengeAdjusted = calculateAdjustedMetrics(challengePlaced.filter(Boolean), season);
  const challengeAttracted = getAttractedInsectIds(challengeAdjusted, season);
  const challengeScore = calculateLayoutScore(
    challengeAdjusted,
    challengePlaced.filter(Boolean),
    season,
    config.targetInsectId
  );
  const challengeChallengeResult = checkChallengeCompletion(
    challenge,
    challengeAdjusted,
    challengePlaced.filter(Boolean).length,
    challengeAttracted
  );

  candidates.push({
    id: "challenge-" + Date.now() + "-3",
    name: "挑战优先型",
    strategy: "challenge",
    placed: challengePlaced,
    metrics: challengeMetrics,
    adjustedMetrics: challengeAdjusted,
    attractedInsectIds: challengeAttracted,
    score: challengeScore.total,
    scoreDetail: {
      ecology: challengeScore.ecology,
      attraction: challengeScore.attraction,
      space: challengeScore.space
    },
    canCompleteChallenge: challengeChallengeResult.success,
    challengeNote: challengeChallengeResult.message
  });

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 3);
}

type DragSource = { type: "material"; id: string } | { type: "cell"; index: number } | null;

export default function App() {
  const [state, setState] = useState<HotelState>(loadState);
  const [challengeState, setChallengeState] = useState<ChallengeState>(loadChallengeState);
  const [currentSeasonId, setCurrentSeasonId] = useState<SeasonId | null>(loadSeason);
  const [showEncyclopedia, setShowEncyclopedia] = useState(false);
  const [showChallengeResult, setShowChallengeResult] = useState(false);
  const [challengeResult, setChallengeResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedDecoration, setSelectedDecoration] = useState<Decoration | null>(null);
  const [showMaterialDrawer, setShowMaterialDrawer] = useState(false);
  const [snapshots, setSnapshots] = useState<Snapshot[]>(loadSnapshots);
  const [snapshotName, setSnapshotName] = useState("");
  const [showSnapshotPanel, setShowSnapshotPanel] = useState(false);
  const [showSeasonPanel, setShowSeasonPanel] = useState(false);
  const [showEcoCalendar, setShowEcoCalendar] = useState(false);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<CalendarDayChallenge | null>(null);
  const [showLayoutLab, setShowLayoutLab] = useState(false);
  const [layoutLabConfig, setLayoutLabConfig] = useState<LayoutLabConfig>({
    targetInsectId: null,
    seasonId: null,
    maxCells: 6
  });
  const [layoutCandidates, setLayoutCandidates] = useState<LayoutCandidate[]>([]);
  const [hasGeneratedLayouts, setHasGeneratedLayouts] = useState(false);
  const [logs, setLogs] = useState<ObservationLog[]>(loadLogs);
  const [showLogPanel, setShowLogPanel] = useState(false);
  const [logFilterInsect, setLogFilterInsect] = useState<string | null>(null);
  const [logFilterSeason, setLogFilterSeason] = useState<SeasonId | null>(null);
  const [logFilterChallengeSuccess, setLogFilterChallengeSuccess] = useState<"all" | "success" | "fail">("all");

  const weekCalendar = useMemo(() => generateWeekCalendar(), []);

  const [dragSource, setDragSource] = useState<DragSource>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const touchDragRef = useRef<{
    active: boolean;
    source: DragSource;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    ghostEl: HTMLElement | null;
  }>({
    active: false,
    source: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    ghostEl: null
  });
  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const currentSeason = useMemo(
    () => (currentSeasonId ? seasons.find((s) => s.id === currentSeasonId) || null : null),
    [currentSeasonId]
  );

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
    localStorage.setItem(seasonStorageKey, JSON.stringify(currentSeasonId));
  }, [currentSeasonId]);

  useEffect(() => {
    saveSnapshots(snapshots);
  }, [snapshots]);

  useEffect(() => {
    saveLogs(logs);
  }, [logs]);

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

  const adjustedMetrics = useMemo(() => {
    if (!currentSeason || state.placed.length === 0) return metrics;
    const seasonBoosts = currentSeason.metricBoosts;
    const boosted = state.placed.reduce(
      (total, id) => {
        const decoration = decorations.find((item) => item.id === id);
        if (!decoration) return total;
        (Object.keys(total) as Metric[]).forEach((metric) => {
          let value = decoration.metrics[metric];
          if (value > 0 && seasonBoosts[metric] !== undefined) {
            value += seasonBoosts[metric]!;
          }
          total[metric] += value;
        });
        return total;
      },
      { shade: 0, nectar: 0, shelter: 0, moisture: 0 }
    );
    return boosted;
  }, [metrics, currentSeason, state.placed]);

  const hotelRating = useMemo(() => {
    if (state.placed.length === 0) {
      return {
        ecologyBalance: 0,
        visitorAttraction: 0,
        spaceUtilization: 0,
        overallGrade: "—",
        suggestions: [{ text: "放置一些材料，开始搭建你的昆虫旅馆吧！", type: "praise" as const, metricDeltas: [] }]
      };
    }

    const effectiveMetrics = currentSeason ? adjustedMetrics : metrics;
    const metricValues = (Object.keys(effectiveMetrics) as Metric[]).map((m) => effectiveMetrics[m]);

    const totalMetricSum = metricValues.reduce((a, b) => a + b, 0);
    const mean = totalMetricSum / 4;
    let ecologyBalance = 0;
    if (mean > 0) {
      const variance = metricValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / 4;
      const stddev = Math.sqrt(variance);
      const cv = stddev / mean;
      ecologyBalance = Math.round(Math.max(0, Math.min(100, (1 - cv) * 100)));
    }
    const zeroMetrics = metricValues.filter((v) => v === 0).length;
    ecologyBalance = Math.max(0, ecologyBalance - zeroMetrics * 18);

    const validGuestIds = new Set(state.guests.filter((id) => insects.some((insect) => insect.id === id)));
    const currentlyAttractedIds = new Set<string>();
    let totalRequirementRatio = 0;
    insects.forEach((insect) => {
      const adjustedLikes = getAdjustedLikes(insect, currentSeason);
      const requirements = Object.entries(adjustedLikes);
      if (requirements.length === 0) return;
      let metCount = 0;
      requirements.forEach(([metric, value]) => {
        if (effectiveMetrics[metric as Metric] >= Number(value)) metCount++;
      });
      totalRequirementRatio += metCount / requirements.length;
      if (metCount === requirements.length) {
        currentlyAttractedIds.add(insect.id);
      }
    });
    const environmentReadiness = totalRequirementRatio / insects.length;
    const guestOccupancy = validGuestIds.size / insects.length;
    const visitorAttraction = Math.round((environmentReadiness * 0.75 + guestOccupancy * 0.25) * 100);

    const fillRate = state.placed.length / 12;
    const uniqueTypes = new Set(state.placed).size;
    const diversity = uniqueTypes / decorations.length;
    const counts: Record<string, number> = {};
    state.placed.forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    });
    const maxCount = Math.max(...Object.values(counts));
    const excessiveDupPenalty = maxCount > 4 ? 0.5 : maxCount > 3 ? 0.8 : 1;
    const spaceUtilization = Math.round(
      (fillRate * 0.4 + diversity * 0.35 + fillRate * excessiveDupPenalty * 0.25) * 100
    );

    const avgScore = (ecologyBalance + visitorAttraction + spaceUtilization) / 3;
    let overallGrade = "D";
    if (avgScore >= 90) overallGrade = "S";
    else if (avgScore >= 75) overallGrade = "A";
    else if (avgScore >= 60) overallGrade = "B";
    else if (avgScore >= 40) overallGrade = "C";

    const suggestions: SuggestionItem[] = [];

    (Object.keys(effectiveMetrics) as Metric[]).forEach((metric) => {
      if (effectiveMetrics[metric] === 0) {
        const bestDeco = decorations
          .filter((d) => d.metrics[metric] > 0)
          .sort((a, b) => b.metrics[metric] - a.metrics[metric])[0];
        if (bestDeco && suggestions.length < 3) {
          const deltas: { metric: Metric; delta: number }[] = [];
          (Object.keys(bestDeco.metrics) as Metric[]).forEach((m) => {
            if (bestDeco.metrics[m] > 0) {
              deltas.push({ metric: m, delta: bestDeco.metrics[m] });
            }
          });
          suggestions.push({
            text: `缺少${metricLabels[metric]}，添加${bestDeco.name}可提升${deltas.map((d) => `${metricLabels[d.metric]}+${d.delta}`).join("、")}`,
            type: "add",
            metricDeltas: deltas,
            relatedDecoration: bestDeco.id
          });
        }
      }
    });

    Object.entries(counts).forEach(([id, count]) => {
      if (count >= 4 && suggestions.length < 3) {
        const deco = decorations.find((d) => d.id === id);
        if (deco) {
          const absentMetrics = (Object.keys(effectiveMetrics) as Metric[]).filter(
            (m) => effectiveMetrics[m] === 0 && deco.metrics[m] === 0
          );
          const replacement = decorations.find((d) => {
            if (d.id === id) return false;
            return absentMetrics.some((m) => d.metrics[m] > 0);
          });
          let text = `${deco.name}重复过多（${count}个），考虑替换以提升多样性`;
          const deltas: { metric: Metric; delta: number }[] = [];
          if (replacement) {
            (Object.keys(replacement.metrics) as Metric[]).forEach((m) => {
              if (replacement.metrics[m] > 0 && effectiveMetrics[m] === 0) {
                deltas.push({ metric: m, delta: replacement.metrics[m] });
              }
            });
            if (deltas.length > 0) {
              text = `${deco.name}重复过多（${count}个），替换为${replacement.name}可增加${deltas.map((d) => `${metricLabels[d.metric]}+${d.delta}`).join("、")}`;
            }
          }
          suggestions.push({
            text,
            type: "replace",
            metricDeltas: deltas,
            relatedDecoration: replacement?.id
          });
        }
      }
    });

    const unattracted = insects.filter(
      (insect) => !validGuestIds.has(insect.id) && !currentlyAttractedIds.has(insect.id)
    );

    if (unattracted.length > 0 && suggestions.length < 3) {
      const closest = unattracted
        .map((insect) => {
          const adjustedLikes = getAdjustedLikes(insect, currentSeason);
          let metCount = 0;
          let totalCount = 0;
          Object.entries(adjustedLikes).forEach(([metric, value]) => {
            totalCount++;
            if (effectiveMetrics[metric as Metric] >= Number(value)) metCount++;
          });
          return { insect, metCount, totalCount, ratio: metCount / totalCount };
        })
        .sort((a, b) => b.ratio - a.ratio)[0];

      if (closest) {
        const gaps: { metric: Metric; needed: number; current: number }[] = [];
        Object.entries(getAdjustedLikes(closest.insect, currentSeason)).forEach(([metric, value]) => {
          const gap = Number(value) - effectiveMetrics[metric as Metric];
          if (gap > 0) {
            gaps.push({ metric: metric as Metric, needed: Number(value), current: effectiveMetrics[metric as Metric] });
          }
        });
        if (gaps.length > 0 && suggestions.length < 3) {
          const bestDecoForGap = decorations
            .filter((d) => gaps.some((g) => d.metrics[g.metric] > 0))
            .sort((a, b) => {
              const scoreA = gaps.reduce((s, g) => s + Math.min(a.metrics[g.metric], g.needed), 0);
              const scoreB = gaps.reduce((s, g) => s + Math.min(b.metrics[g.metric], g.needed), 0);
              return scoreB - scoreA;
            })[0];
          const deltas: { metric: Metric; delta: number }[] = [];
          let text = `要吸引${closest.insect.name}，还需补足${gaps.map((g) => `${metricLabels[g.metric]}还差${g.needed - g.current}`).join("、")}`;
          if (bestDecoForGap) {
            gaps.forEach((g) => {
              if (bestDecoForGap.metrics[g.metric] > 0) {
                deltas.push({ metric: g.metric, delta: bestDecoForGap.metrics[g.metric] });
              }
            });
            if (deltas.length > 0) {
              text = `要吸引${closest.insect.name}，${gaps.map((g) => `${metricLabels[g.metric]}还差${g.needed - g.current}`).join("、")}，添加${bestDecoForGap.name}可补足${deltas.map((d) => `${metricLabels[d.metric]}+${d.delta}`).join("、")}`;
            }
          }
          suggestions.push({
            text,
            type: "attract",
            metricDeltas: deltas,
            relatedDecoration: bestDecoForGap?.id,
            relatedInsect: closest.insect.id
          });
        }
      }
    }

    if (validGuestIds.size > 0 && suggestions.length < 3) {
      const guestGaps = insects
        .filter((insect) => validGuestIds.has(insect.id))
        .flatMap((insect) =>
          Object.entries(getAdjustedLikes(insect, currentSeason)).map(([metric, value]) => ({
            insect,
            metric: metric as Metric,
            margin: effectiveMetrics[metric as Metric] - Number(value)
          }))
        )
        .sort((a, b) => a.margin - b.margin);
      const tightest = guestGaps[0];
      if (tightest) {
        const supportDeco = decorations
          .filter((d) => d.metrics[tightest.metric] > 0)
          .sort((a, b) => b.metrics[tightest.metric] - a.metrics[tightest.metric])[0];
        if (supportDeco) {
          suggestions.push({
            text: `${tightest.insect.name}已入住，${metricLabels[tightest.metric]}余量${Math.max(0, tightest.margin)}，增加${supportDeco.name}可稳住访客`,
            type: "add",
            metricDeltas: [{ metric: tightest.metric, delta: supportDeco.metrics[tightest.metric] }],
            relatedDecoration: supportDeco.id,
            relatedInsect: tightest.insect.id
          });
        }
      }
    }

    if (suggestions.length === 0) {
      suggestions.push({
        text: "布局非常出色，旅馆运行良好！",
        type: "praise",
        metricDeltas: []
      });
    }

    return {
      ecologyBalance: Math.min(100, ecologyBalance),
      visitorAttraction: Math.min(100, visitorAttraction),
      spaceUtilization: Math.min(100, spaceUtilization),
      overallGrade,
      suggestions
    };
  }, [adjustedMetrics, metrics, currentSeason, state.placed, state.guests]);

  const prevRatingRef = useRef({ ecologyBalance: 0, visitorAttraction: 0, spaceUtilization: 0 });

  const ratingDeltas = useMemo(() => {
    const prev = prevRatingRef.current;
    return {
      ecologyBalance: hotelRating.ecologyBalance - prev.ecologyBalance,
      visitorAttraction: hotelRating.visitorAttraction - prev.visitorAttraction,
      spaceUtilization: hotelRating.spaceUtilization - prev.spaceUtilization
    };
  }, [hotelRating.ecologyBalance, hotelRating.visitorAttraction, hotelRating.spaceUtilization]);

  useEffect(() => {
    prevRatingRef.current = {
      ecologyBalance: hotelRating.ecologyBalance,
      visitorAttraction: hotelRating.visitorAttraction,
      spaceUtilization: hotelRating.spaceUtilization
    };
  }, [hotelRating.ecologyBalance, hotelRating.visitorAttraction, hotelRating.spaceUtilization]);

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

  function moveItem(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setState((current) => {
      const newPlaced = [...current.placed];
      while (newPlaced.length < 12) {
        newPlaced.push("");
      }
      const item = newPlaced[fromIndex];
      const targetItem = newPlaced[toIndex];
      newPlaced[fromIndex] = targetItem || "";
      newPlaced[toIndex] = item;
      const cleanedPlaced = cleanPlacedArray(newPlaced);
      return { ...current, placed: cleanedPlaced };
    });
  }

  function placeMaterialAt(materialId: string, targetIndex: number) {
    setState((current) => {
      const newPlaced = [...current.placed];
      while (newPlaced.length < 12) {
        newPlaced.push("");
      }
      newPlaced[targetIndex] = materialId;
      return { ...current, placed: newPlaced };
    });
  }

  function removeMaterial(index: number) {
    setState((current) => {
      const newPlaced = [...current.placed];
      while (newPlaced.length < 12) {
        newPlaced.push("");
      }
      newPlaced[index] = "";
      const cleanedPlaced = cleanPlacedArray(newPlaced);
      return { ...current, placed: cleanedPlaced };
    });
  }

  function getCellIndexFromPoint(clientX: number, clientY: number): number | null {
    const cells = cellRefs.current;
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (!cell) continue;
      const rect = cell.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return i;
      }
    }
    return null;
  }

  function createGhostElement(decoration: Decoration, clientX: number, clientY: number): HTMLElement {
    const ghost = document.createElement("div");
    ghost.className = "drag-ghost";
    ghost.innerHTML = `<span style="background: ${decoration.color}">${decoration.icon}</span>`;
    ghost.style.position = "fixed";
    ghost.style.pointerEvents = "none";
    ghost.style.zIndex = "9999";
    ghost.style.opacity = "0.85";
    ghost.style.transform = "translate(-50%, -50%) scale(1.1)";
    ghost.style.left = `${clientX}px`;
    ghost.style.top = `${clientY}px`;
    document.body.appendChild(ghost);
    return ghost;
  }

  function handleMaterialDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", id);
    setDragSource({ type: "material", id });
    setIsDragging(true);
  }

  function handleCellDragStart(e: React.DragEvent, index: number) {
    const id = state.placed[index];
    if (!id) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    setDragSource({ type: "cell", index });
    setIsDragging(true);
  }

  function handleCellDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = dragSource?.type === "material" ? "copy" : "move";
    setDragOverIndex(index);
  }

  function handleCellDragLeave() {
    setDragOverIndex(null);
  }

  function handleCellDrop(e: React.DragEvent, targetIndex: number) {
    e.preventDefault();
    const materialId = e.dataTransfer.getData("text/plain");

    if (dragSource?.type === "cell") {
      moveItem(dragSource.index, targetIndex);
    } else if (dragSource?.type === "material" && materialId) {
      placeMaterialAt(materialId, targetIndex);
    }

    setDragSource(null);
    setDragOverIndex(null);
    setIsDragging(false);
  }

  function handleDragEnd() {
    setDragSource(null);
    setDragOverIndex(null);
    setIsDragging(false);
  }

  function handleMaterialTouchStart(e: React.TouchEvent, id: string) {
    const touch = e.touches[0];
    const decoration = decorations.find((d) => d.id === id);
    if (!decoration) return;

    e.preventDefault();
    touchDragRef.current = {
      active: true,
      source: { type: "material", id },
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      ghostEl: createGhostElement(decoration, touch.clientX, touch.clientY)
    };
    setIsDragging(true);
    setDragSource({ type: "material", id });
  }

  function handleCellTouchStart(e: React.TouchEvent, index: number) {
    const id = state.placed[index];
    if (!id) return;

    const touch = e.touches[0];
    const decoration = decorations.find((d) => d.id === id);
    if (!decoration) return;

    e.preventDefault();
    touchDragRef.current = {
      active: true,
      source: { type: "cell", index },
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      ghostEl: createGhostElement(decoration, touch.clientX, touch.clientY)
    };
    setIsDragging(true);
    setDragSource({ type: "cell", index });
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!touchDragRef.current.active) return;
    e.preventDefault();

    const touch = e.touches[0];
    touchDragRef.current.currentX = touch.clientX;
    touchDragRef.current.currentY = touch.clientY;

    if (touchDragRef.current.ghostEl) {
      touchDragRef.current.ghostEl.style.left = `${touch.clientX}px`;
      touchDragRef.current.ghostEl.style.top = `${touch.clientY}px`;
    }

    const cellIndex = getCellIndexFromPoint(touch.clientX, touch.clientY);
    setDragOverIndex(cellIndex);
  }

  function handleTouchEnd() {
    if (!touchDragRef.current.active) return;

    const { source, currentX, currentY, ghostEl } = touchDragRef.current;

    if (ghostEl) {
      ghostEl.remove();
    }

    const targetIndex = getCellIndexFromPoint(currentX, currentY);

    if (targetIndex !== null && source) {
      if (source.type === "cell") {
        moveItem(source.index, targetIndex);
      } else if (source.type === "material") {
        placeMaterialAt(source.id, targetIndex);
      }
    }

    touchDragRef.current = {
      active: false,
      source: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      ghostEl: null
    };
    setIsDragging(false);
    setDragSource(null);
    setDragOverIndex(null);
  }

  function addDecoration(id: string) {
    const decoration = decorations.find((item) => item.id === id);
    if (decoration) {
      setSelectedDecoration(decoration);
      setShowMaterialDrawer(true);
    }
    setState((current) => {
      const newPlaced = [...current.placed];
      while (newPlaced.length < 12) {
        newPlaced.push("");
      }
      const firstEmptyIndex = newPlaced.findIndex((val) => !val || !decorations.find((d) => d.id === val));
      if (firstEmptyIndex === -1) return current;
      newPlaced[firstEmptyIndex] = id;
      const cleanedPlaced = cleanPlacedArray(newPlaced);
      return { ...current, placed: cleanedPlaced };
    });
  }

  function closeMaterialDrawer() {
    setShowMaterialDrawer(false);
    setTimeout(() => setSelectedDecoration(null), 300);
  }

  function settleDay() {
    const today = getTodayString();
    const effectiveMetrics = currentSeason ? adjustedMetrics : metrics;

    if (state.placed.length === 0) {
      let report = "旅馆空空如也，还没有放置任何材料，小昆虫们不会来访哦。";
      if (currentSeason) {
        report = `[${currentSeason.name}] ${report}`;
      }
      setState((current) => ({ ...current, lastReport: report }));
      let challengeResultForLog = { success: false, message: "" };
      if (!challengeState.completed) {
        const result = checkChallengeCompletion(todayChallenge, metrics, 0, []);
        challengeResultForLog = result;
        setChallengeResult(result);
        setShowChallengeResult(true);
        setChallengeState((current) => ({
          ...current,
          completed: result.success,
          lastResult: result.message
        }));
      }
      const logEntry: ObservationLog = {
        id: Date.now().toString(36),
        date: today,
        seasonId: currentSeasonId,
        seasonName: currentSeason ? currentSeason.name : "默认",
        placed: [],
        baseMetrics: { ...metrics },
        adjustedMetrics: { ...effectiveMetrics },
        newInsectIds: [],
        challengeId: todayChallenge.id,
        challengeTitle: todayChallenge.title,
        challengeSuccess: challengeResultForLog.success,
        hotelGrade: hotelRating.overallGrade,
        ecologyBalance: hotelRating.ecologyBalance,
        visitorAttraction: hotelRating.visitorAttraction,
        spaceUtilization: hotelRating.spaceUtilization,
        createdAt: new Date().toLocaleString("zh-CN")
      };
      setLogs((prev) => [...prev, logEntry]);
      return;
    }

    const matched = insects.filter((insect) => {
      const adjustedLikes = getAdjustedLikes(insect, currentSeason);
      return Object.entries(adjustedLikes).every(
        ([metric, value]) => effectiveMetrics[metric as Metric] >= Number(value)
      );
    });
    const matchedIds = matched.map((insect) => insect.id);
    const newInsectIds = matchedIds.filter((id) => !state.guests.includes(id));
    const guestIds = Array.from(new Set([...state.guests, ...matchedIds]));
    let report =
      matched.length > 0
        ? `今天有${matched.map((insect) => insect.name).join("、")}注意到了旅馆。`
        : "今天环境还不够有吸引力，试着增加花蜜、湿润或藏身处。";
    if (currentSeason) {
      report = `[${currentSeason.name}] ${report}`;
    }
    setState((current) => ({ ...current, guests: guestIds, lastReport: report }));

    let challengeResultForLog = { success: false, message: "" };
    if (!challengeState.completed) {
      const result = checkChallengeCompletion(todayChallenge, effectiveMetrics, state.placed.length, matchedIds);
      challengeResultForLog = result;
      setChallengeResult(result);
      setShowChallengeResult(true);
      setChallengeState((current) => ({
        ...current,
        completed: result.success,
        lastResult: result.message
      }));
    } else {
      challengeResultForLog = { success: true, message: challengeState.lastResult || "" };
    }

    const logEntry: ObservationLog = {
      id: Date.now().toString(36),
      date: today,
      seasonId: currentSeasonId,
      seasonName: currentSeason ? currentSeason.name : "默认",
      placed: [...state.placed],
      baseMetrics: { ...metrics },
      adjustedMetrics: { ...effectiveMetrics },
      newInsectIds,
      challengeId: todayChallenge.id,
      challengeTitle: todayChallenge.title,
      challengeSuccess: challengeResultForLog.success,
      hotelGrade: hotelRating.overallGrade,
      ecologyBalance: hotelRating.ecologyBalance,
      visitorAttraction: hotelRating.visitorAttraction,
      spaceUtilization: hotelRating.spaceUtilization,
      createdAt: new Date().toLocaleString("zh-CN")
    };
    setLogs((prev) => [...prev, logEntry]);
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
      placed: cleanPlacedArray([...snapshot.placed]),
      guests: [...snapshot.guests],
      lastReport: snapshot.lastReport
    }));
    setShowSnapshotPanel(false);
  }

  function deleteSnapshot(id: string) {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
  }

  function handleGenerateLayouts() {
    const candidates = generateLayoutCandidates(layoutLabConfig, todayChallenge);
    setLayoutCandidates(candidates);
    setHasGeneratedLayouts(true);
  }

  function applyLayoutToHotel(candidate: LayoutCandidate) {
    const placedClean = cleanPlacedArray([...candidate.placed]);
    setState((current) => ({
      ...current,
      placed: placedClean,
      lastReport: `已应用「${candidate.name}」布局方案。`
    }));
    setShowLayoutLab(false);
  }

  function openLayoutLab() {
    setLayoutLabConfig({
      targetInsectId: null,
      seasonId: currentSeasonId,
      maxCells: 6
    });
    setLayoutCandidates([]);
    setHasGeneratedLayouts(false);
    setShowLayoutLab(true);
  }

  return (
    <main className="hotel">
      <section className="topbar">
        <div>
          <p className="eyebrow">昆虫旅馆</p>
          <h1>给小客人搭一间好住处</h1>
        </div>
        <div className="actions">
          <button
            className={`season-btn ${currentSeason ? "active" : ""}`}
            style={currentSeason ? { borderColor: currentSeason.color, color: currentSeason.color } : {}}
            onClick={() => setShowSeasonPanel(true)}
          >
            {currentSeason ? `${currentSeason.icon} ${currentSeason.name}` : "🌍 选择季节"}
          </button>
          <button onClick={openLayoutLab}>🧪 布局实验室</button>
          <button onClick={() => setShowEcoCalendar(true)}>📅 生态日历</button>
          <button onClick={() => setShowEncyclopedia(true)}>昆虫图鉴</button>
          <button onClick={() => setShowLogPanel(true)}>📋 观察日志</button>
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

      {currentSeason && (
        <section
          className="season-banner"
          style={{ background: `linear-gradient(135deg, ${currentSeason.color}22, ${currentSeason.color}08)`, borderColor: currentSeason.color }}
        >
          <div className="season-icon" style={{ background: currentSeason.color }}>
            {currentSeason.icon}
          </div>
          <div className="season-info">
            <p className="eyebrow">当前季节</p>
            <h3 style={{ color: currentSeason.color }}>{currentSeason.name}</h3>
            <p className="season-description">{currentSeason.description}</p>
            <div className="season-effects">
              <div className="season-effect-group">
                <span className="effect-label">环境加成：</span>
                {currentSeason.affectedMetrics.map((m) => (
                  <span key={m} className="effect-tag boost">
                    {metricLabels[m]} +{currentSeason.metricBoosts[m]}/格
                  </span>
                ))}
              </div>
              <div className="season-effect-group">
                <span className="effect-label">受益昆虫：</span>
                {currentSeason.affectedInsects.map((id) => {
                  const insect = insects.find((i) => i.id === id);
                  return insect ? (
                    <span key={id} className="effect-tag insect">
                      {insect.icon} {insect.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>
          <button className="season-change-btn" onClick={() => setShowSeasonPanel(true)}>
            更换季节
          </button>
        </section>
      )}

      <section className="layout">
        <div className="panel">
          <h2>材料箱</h2>
          <div className="deco-list">
            {decorations.map((decoration) => (
              <button
                key={decoration.id}
                onClick={() => addDecoration(decoration.id)}
                draggable
                onDragStart={(e) => handleMaterialDragStart(e, decoration.id)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => handleMaterialTouchStart(e, decoration.id)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <span style={{ background: decoration.color }}>{decoration.icon}</span>
                <strong>{decoration.name}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="panel hotel-board">
          <h2>旅馆格</h2>
          <div
            className={`grid ${isDragging ? "dragging-active" : ""}`}
            ref={gridRef}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {Array.from({ length: 12 }).map((_, index) => {
              const placed = decorations.find((item) => item.id === state.placed[index]);
              const isDragOver = dragOverIndex === index;
              const isDragSource = dragSource?.type === "cell" && dragSource.index === index;
              return (
                <button
                  key={index}
                  ref={(el) => {
                    cellRefs.current[index] = el;
                  }}
                  draggable={!!placed}
                  onClick={() => removeMaterial(index)}
                  onDragStart={(e) => handleCellDragStart(e, index)}
                  onDragOver={(e) => handleCellDragOver(e, index)}
                  onDragLeave={handleCellDragLeave}
                  onDrop={(e) => handleCellDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={(e) => handleCellTouchStart(e, index)}
                  className={[
                    isDragOver ? "drag-over" : "",
                    isDragSource ? "drag-source" : "",
                    placed ? "has-material" : "empty"
                  ].join(" ").trim()}
                >
                  {placed && <span style={{ background: placed.color }}>{placed.icon}</span>}
                </button>
              );
            })}
          </div>
          <p className="report">{state.lastReport}</p>
        </div>

        <div className="panel">
          <h2>环境{currentSeason && <span className="season-hint" style={{ color: currentSeason.color }}>（{currentSeason.name}调整）</span>}</h2>
          <div className="metrics">
            {(Object.keys(adjustedMetrics) as Metric[]).map((metric) => {
              const base = metrics[metric];
              const adjusted = adjustedMetrics[metric];
              const boosted = currentSeason && currentSeason.affectedMetrics.includes(metric);
              let totalBoost = 0;
              let boostCount = 0;
              if (boosted && currentSeason) {
                const perCellBoost = currentSeason.metricBoosts[metric] || 0;
                state.placed.forEach((id) => {
                  const deco = decorations.find((d) => d.id === id);
                  if (deco && deco.metrics[metric] > 0) {
                    totalBoost += perCellBoost;
                    boostCount++;
                  }
                });
              }
              return (
                <label key={metric} className={boosted ? "boosted" : ""}>
                  <span>
                    {metricLabels[metric]}
                    {boosted && totalBoost > 0 && (
                      <span className="boost-badge" style={{ background: currentSeason?.color }}>
                        +{totalBoost}
                        {boostCount > 1 && <i className="boost-count">×{boostCount}格</i>}
                      </span>
                    )}
                  </span>
                  <meter min={0} max={12} value={adjusted} />
                  <b>
                    {boosted && base !== adjusted ? (
                      <>
                        <s className="base-value">{base}</s>→{adjusted}
                      </>
                    ) : (
                      adjusted
                    )}
                  </b>
                </label>
              );
            })}
          </div>
          <h2>已入住</h2>
          <div className="guest-list">
            {insects.map((insect) => {
              const isActive = state.guests.includes(insect.id);
              const isFavored = currentSeason?.affectedInsects.includes(insect.id);
              const adjustedLikes = getAdjustedLikes(insect, currentSeason);
              return (
                <article className={`${isActive ? "active" : ""} ${isFavored ? "favored" : ""}`} key={insect.id}>
                  <span className="guest-icon" style={isFavored ? { boxShadow: `0 0 0 2px ${currentSeason?.color}` } : {}}>
                    {insect.icon}
                    {isFavored && <span className="favored-badge" style={{ background: currentSeason?.color }}>★</span>}
                  </span>
                  <div>
                    <strong>
                      {insect.name}
                      {isFavored && <span className="favored-label" style={{ color: currentSeason?.color }}>活跃</span>}
                    </strong>
                    <div className="insect-likes-mini">
                      {Object.entries(adjustedLikes).map(([metric, val]) => {
                        const baseVal = insect.likes[metric as Metric];
                        const changed = currentSeason && baseVal !== val;
                        return (
                          <span key={metric} className={`mini-like ${changed ? (val! < baseVal! ? "easier" : "harder") : ""}`}>
                            {metricLabels[metric as Metric]}
                            {changed && baseVal !== undefined && <s>{baseVal}</s>}
                            <b>{val}</b>
                          </span>
                        );
                      })}
                    </div>
                    <p>{insect.note}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rating-section">
        <div className="rating-header">
          <div>
            <p className="eyebrow">旅馆评估</p>
            <h2>评分与建议</h2>
          </div>
        </div>
        <div className="rating-cards">
          <div className="rating-card">
            <div className="rating-score-wrapper">
              <div className="rating-score ecology">{hotelRating.ecologyBalance}</div>
              {ratingDeltas.ecologyBalance !== 0 && (
                <span className={`rating-delta ${ratingDeltas.ecologyBalance > 0 ? "up" : "down"}`}>
                  {ratingDeltas.ecologyBalance > 0 ? "↑" : "↓"}{Math.abs(ratingDeltas.ecologyBalance)}
                </span>
              )}
            </div>
            <div className="rating-label">生态平衡</div>
            <div className="rating-bar-wrapper">
              <div className="rating-bar ecology-bar" style={{ width: `${hotelRating.ecologyBalance}%` }} />
            </div>
          </div>
          <div className="rating-card">
            <div className="rating-score-wrapper">
              <div className="rating-score attraction">{hotelRating.visitorAttraction}</div>
              {ratingDeltas.visitorAttraction !== 0 && (
                <span className={`rating-delta ${ratingDeltas.visitorAttraction > 0 ? "up" : "down"}`}>
                  {ratingDeltas.visitorAttraction > 0 ? "↑" : "↓"}{Math.abs(ratingDeltas.visitorAttraction)}
                </span>
              )}
            </div>
            <div className="rating-label">访客吸引力</div>
            <div className="rating-bar-wrapper">
              <div className="rating-bar attraction-bar" style={{ width: `${hotelRating.visitorAttraction}%` }} />
            </div>
          </div>
          <div className="rating-card">
            <div className="rating-score-wrapper">
              <div className="rating-score space">{hotelRating.spaceUtilization}</div>
              {ratingDeltas.spaceUtilization !== 0 && (
                <span className={`rating-delta ${ratingDeltas.spaceUtilization > 0 ? "up" : "down"}`}>
                  {ratingDeltas.spaceUtilization > 0 ? "↑" : "↓"}{Math.abs(ratingDeltas.spaceUtilization)}
                </span>
              )}
            </div>
            <div className="rating-label">空间利用率</div>
            <div className="rating-bar-wrapper">
              <div className="rating-bar space-bar" style={{ width: `${hotelRating.spaceUtilization}%` }} />
            </div>
          </div>
          <div className="rating-card grade-card">
            <div className={`rating-grade ${hotelRating.overallGrade === "—" ? "" : hotelRating.overallGrade.toLowerCase()}`}>
              {hotelRating.overallGrade}
            </div>
            <div className="rating-label">综合评级</div>
          </div>
        </div>
        {hotelRating.suggestions.length > 0 && (
          <div className="rating-suggestions">
            <div className="suggestions-title">💡 改善建议</div>
            <ul className="suggestions-list">
              {hotelRating.suggestions.map((suggestion, index) => (
                <li key={index} className={`suggestion-item suggestion-${suggestion.type}`}>
                  <span className={`suggestion-icon ${suggestion.type}`}>
                    {suggestion.type === "add" ? "➕" : suggestion.type === "replace" ? "🔄" : suggestion.type === "attract" ? "🦋" : "✨"}
                  </span>
                  <div className="suggestion-content">
                    <span className="suggestion-text">{suggestion.text}</span>
                    {suggestion.metricDeltas.length > 0 && (
                      <div className="suggestion-deltas">
                        {suggestion.metricDeltas.map((d, i) => (
                          <span key={i} className={`suggestion-delta-chip delta-${d.metric}`}>
                            {metricLabels[d.metric]}+{d.delta}
                          </span>
                        ))}
                      </div>
                    )}
                    {suggestion.relatedDecoration && (
                      <button
                        className="suggestion-action-btn"
                        onClick={() => addDecoration(suggestion.relatedDecoration!)}
                      >
                        添加{decorations.find((d) => d.id === suggestion.relatedDecoration)?.name}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
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

      {showSeasonPanel && (
        <div className="season-overlay" onClick={() => setShowSeasonPanel(false)}>
          <div className="season-modal" onClick={(e) => e.stopPropagation()}>
            <div className="season-modal-header">
              <div>
                <p className="eyebrow">季节系统</p>
                <h2>选择一个季节</h2>
                <p className="season-modal-hint">不同季节会改变环境加成和昆虫偏好阈值。不选择则使用默认规则。</p>
              </div>
              <button className="season-modal-close" onClick={() => setShowSeasonPanel(false)}>✕</button>
            </div>

            <button
              className={`season-default-option ${currentSeasonId === null ? "selected" : ""}`}
              onClick={() => {
                setCurrentSeasonId(null);
              }}
            >
              <div className="season-default-icon">🌍</div>
              <div className="season-default-info">
                <strong>默认模式</strong>
                <p>不应用任何季节调整，使用原始游戏规则。</p>
              </div>
              {currentSeasonId === null && <div className="season-check">✓</div>}
            </button>

            <div className="season-grid">
              {seasons.map((season) => (
                <button
                  key={season.id}
                  className={`season-card ${currentSeasonId === season.id ? "selected" : ""}`}
                  style={{ borderColor: currentSeasonId === season.id ? season.color : "transparent" }}
                  onClick={() => {
                    setCurrentSeasonId(season.id);
                  }}
                >
                  <div className="season-card-header" style={{ background: `linear-gradient(135deg, ${season.color}33, ${season.color}11)` }}>
                    <div className="season-card-icon" style={{ background: season.color }}>
                      {season.icon}
                    </div>
                    <div className="season-card-check" style={{ background: season.color }}>✓</div>
                  </div>
                  <div className="season-card-body">
                    <h3 style={{ color: season.color }}>{season.name}</h3>
                    <p className="season-card-desc">{season.description}</p>
                    <div className="season-card-effects">
                      <div className="season-card-effect-row">
                        <span className="effect-title">环境加成：</span>
                        <div className="season-card-tags">
                          {season.affectedMetrics.map((m) => (
                            <span key={m} className="effect-tag boost">
                              {metricLabels[m]} +{season.metricBoosts[m]}/格
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="season-card-effect-row">
                        <span className="effect-title">受益昆虫：</span>
                        <div className="season-card-tags">
                          {season.affectedInsects.map((id) => {
                            const insect = insects.find((i) => i.id === id);
                            return insect ? (
                              <span key={id} className="effect-tag insect">
                                {insect.icon} {insect.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="season-card-thresholds">
                      <p className="thresholds-title">偏好阈值调整：</p>
                      <div className="thresholds-grid">
                        {insects.map((insect) => {
                          const adjustments = season.insectThresholdAdjustments[insect.id] || {};
                          const hasChanges = Object.values(adjustments).some((v) => v !== 0);
                          if (!hasChanges) return null;
                          return (
                            <div key={insect.id} className="threshold-row">
                              <span className="threshold-insect">{insect.icon} {insect.name}</span>
                              <div className="threshold-changes">
                                {Object.entries(adjustments).map(([metric, val]) => {
                                  if (val === 0) return null;
                                  return (
                                    <span key={metric} className={`threshold-change ${val! < 0 ? "easier" : "harder"}`}>
                                      {metricLabels[metric as Metric]} {val! > 0 ? `+${val}` : val}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="season-modal-footer">
              <button className="season-modal-confirm" onClick={() => setShowSeasonPanel(false)}>
                确认选择
              </button>
            </div>
          </div>
        </div>
      )}

      {showEcoCalendar && (
        <div className="eco-calendar-overlay" onClick={() => { setShowEcoCalendar(false); setSelectedCalendarDay(null); }}>
          <div className="eco-calendar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="eco-calendar-header">
              <div>
                <p className="eyebrow">生态日历</p>
                <h2>未来7天生态行程</h2>
                <p className="eco-calendar-hint">预览每日挑战、推荐季节、受益昆虫和关键环境指标，点击查看详情和材料建议。</p>
              </div>
              <button className="eco-calendar-close" onClick={() => { setShowEcoCalendar(false); setSelectedCalendarDay(null); }}>✕</button>
            </div>

            <div className="eco-calendar-week">
              {weekCalendar.map((day) => (
                <button
                  key={day.dateStr}
                  className={`eco-calendar-day-card ${day.isToday ? "today" : ""} ${selectedCalendarDay?.dateStr === day.dateStr ? "selected" : ""}`}
                  style={selectedCalendarDay?.dateStr === day.dateStr ? { borderColor: day.recommendedSeason.color } : {}}
                  onClick={() => setSelectedCalendarDay(day)}
                >
                  <div className="eco-calendar-day-header" style={day.isToday ? { background: day.recommendedSeason.color } : {}}>
                    <span className="eco-calendar-weekday">{day.dayOfWeek}</span>
                    <span className="eco-calendar-date">{day.dayOfMonth}日</span>
                    {day.isToday && <span className="eco-calendar-today-badge">今天</span>}
                  </div>
                  <div className="eco-calendar-day-body">
                    <div className="eco-calendar-season-tag" style={{ color: day.recommendedSeason.color }}>
                      {day.recommendedSeason.icon} {day.recommendedSeason.name}
                    </div>
                    <h4 className="eco-calendar-challenge-title">{day.challenge.title}</h4>
                    <div className="eco-calendar-insects-row">
                      {day.beneficialInsects.slice(0, 3).map((insect) => (
                        <span key={insect.id} className="eco-calendar-insect-mini" title={insect.name}>
                          {insect.icon}
                        </span>
                      ))}
                    </div>
                    <div className="eco-calendar-metrics-row">
                      {day.keyMetrics.map((m) => (
                        <span key={m} className="eco-calendar-metric-chip">
                          {metricLabels[m]}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedCalendarDay && (
              <div className="eco-calendar-detail">
                <div className="eco-calendar-detail-header" style={{ borderLeftColor: selectedCalendarDay.recommendedSeason.color }}>
                  <div>
                    <h3>
                      {selectedCalendarDay.dayOfWeek} · {selectedCalendarDay.dateStr}
                      {selectedCalendarDay.isToday && <span className="eco-calendar-today-badge-inline">今天</span>}
                    </h3>
                    <div className="eco-calendar-detail-season">
                      <span style={{ color: selectedCalendarDay.recommendedSeason.color }}>
                        {selectedCalendarDay.recommendedSeason.icon} 推荐季节：{selectedCalendarDay.recommendedSeason.name}
                      </span>
                      <span className="eco-calendar-detail-season-desc">
                        {selectedCalendarDay.recommendedSeason.description}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="eco-calendar-detail-grid">
                  <div className="eco-calendar-detail-section">
                    <h4>🎯 挑战目标</h4>
                    <div className="eco-calendar-challenge-type-tag">
                      {selectedCalendarDay.challenge.type === "attract" ? "吸引昆虫" :
                       selectedCalendarDay.challenge.type === "metric_limit" ? "环境目标" : "双重满足"}
                    </div>
                    <h5>{selectedCalendarDay.challenge.title}</h5>
                    <p>{selectedCalendarDay.challenge.description}</p>
                    <div className="eco-calendar-target-detail">
                      {selectedCalendarDay.challenge.type === "attract" && (
                        <p>目标：吸引 <b>{insects.find(i => i.id === selectedCalendarDay.challenge.target.insectId)?.name}</b> 入住</p>
                      )}
                      {selectedCalendarDay.challenge.type === "metric_limit" && (
                        <p>目标：{metricLabels[selectedCalendarDay.challenge.target.metric as Metric]} ≥ <b>{selectedCalendarDay.challenge.target.value}</b>，材料不超过 <b>{selectedCalendarDay.challenge.target.maxCells}</b> 格</p>
                      )}
                      {selectedCalendarDay.challenge.type === "dual_insect" && (
                        <p>目标：同时满足 <b>{(selectedCalendarDay.challenge.target.insectIds as string[]).map(id => insects.find(i => i.id === id)?.name).join("、")}</b> 的入住条件</p>
                      )}
                    </div>
                  </div>

                  <div className="eco-calendar-detail-section">
                    <h4>🐛 预计受益昆虫</h4>
                    <div className="eco-calendar-insects-list">
                      {selectedCalendarDay.beneficialInsects.map((insect) => (
                        <div key={insect.id} className="eco-calendar-insect-card">
                          <span className="eco-calendar-insect-icon">{insect.icon}</span>
                          <div>
                            <strong>{insect.name}</strong>
                            <div className="eco-calendar-insect-likes">
                              {Object.entries(insect.likes).map(([metric, val]) => (
                                <span key={metric} className="eco-calendar-insect-like">
                                  {metricLabels[metric as Metric]} {val}
                                </span>
                              ))}
                            </div>
                            <p>{insect.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="eco-calendar-detail-section">
                    <h4>📊 关键环境指标</h4>
                    <div className="eco-calendar-key-metrics">
                      {selectedCalendarDay.keyMetrics.map((m) => {
                        const seasonBoost = selectedCalendarDay.recommendedSeason.affectedMetrics.includes(m)
                          ? selectedCalendarDay.recommendedSeason.metricBoosts[m]
                          : 0;
                        return (
                          <div key={m} className="eco-calendar-key-metric-item">
                            <span className="eco-calendar-key-metric-label">{metricLabels[m]}</span>
                            {seasonBoost && seasonBoost > 0 ? (
                              <span className="eco-calendar-key-metric-boost" style={{ background: selectedCalendarDay.recommendedSeason.color }}>
                                +{seasonBoost}/格（季节加成）
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="eco-calendar-detail-section">
                    <h4>🧱 建议材料组合</h4>
                    <div className="eco-calendar-suggested-materials">
                      {selectedCalendarDay.suggestedMaterials.map((deco, idx) => (
                        <div key={deco.id} className="eco-calendar-material-card">
                          <span className="eco-calendar-material-rank">{idx + 1}</span>
                          <span className="eco-calendar-material-icon" style={{ background: deco.color }}>{deco.icon}</span>
                          <div>
                            <strong>{deco.name}</strong>
                            <div className="eco-calendar-material-metrics">
                              {(Object.keys(deco.metrics) as Metric[]).filter(m => deco.metrics[m] > 0).map(m => (
                                <span key={m} className="eco-calendar-material-metric-chip">
                                  {metricLabels[m]} +{deco.metrics[m]}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="eco-calendar-material-hint">
                      💡 以上材料按关键指标综合得分排序，建议组合搭配使用以达成挑战目标。
                    </p>
                  </div>
                </div>

                {selectedCalendarDay.isToday && (
                  <div className="eco-calendar-today-action">
                    <span className="eco-calendar-today-note">
                      {challengeState.completed ? "✅ 今日挑战已完成" : "⏳ 今日挑战进行中，完成旅馆布局后点击「结算今天」"}
                    </span>
                    {!challengeState.completed && (
                      <button
                        className="eco-calendar-action-btn primary"
                        onClick={() => { setShowEcoCalendar(false); setSelectedCalendarDay(null); }}
                      >
                        去布局旅馆
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {!selectedCalendarDay && (
              <div className="eco-calendar-empty-detail">
                <p>👈 点击左侧任一天的卡片，查看该日挑战详情和材料建议</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showLayoutLab && (
        <div className="layout-lab-overlay" onClick={() => setShowLayoutLab(false)}>
          <div className="layout-lab-modal" onClick={(e) => e.stopPropagation()}>
            <div className="layout-lab-header">
              <div>
                <p className="eyebrow">布局实验室</p>
                <h2>智能生成布局方案</h2>
                <p className="layout-lab-hint">
                  选择目标昆虫、季节和最多使用格数，系统将为你生成3个候选布局方案。
                </p>
              </div>
              <button className="layout-lab-close" onClick={() => setShowLayoutLab(false)}>✕</button>
            </div>

            <div className="layout-lab-config">
              <div className="config-section">
                <label className="config-label">🎯 目标昆虫</label>
                <div className="insect-selector">
                  <button
                    className={`insect-option ${layoutLabConfig.targetInsectId === null ? "selected" : ""}`}
                    onClick={() => setLayoutLabConfig((c) => ({ ...c, targetInsectId: null }))}
                  >
                    <span className="insect-option-icon">🎲</span>
                    <span>不指定</span>
                  </button>
                  {insects.map((insect) => (
                    <button
                      key={insect.id}
                      className={`insect-option ${layoutLabConfig.targetInsectId === insect.id ? "selected" : ""}`}
                      onClick={() => setLayoutLabConfig((c) => ({ ...c, targetInsectId: insect.id }))}
                    >
                      <span className="insect-option-icon">{insect.icon}</span>
                      <span>{insect.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="config-section">
                <label className="config-label">🌤️ 当前季节</label>
                <div className="season-selector">
                  <button
                    className={`season-option ${layoutLabConfig.seasonId === null ? "selected" : ""}`}
                    onClick={() => setLayoutLabConfig((c) => ({ ...c, seasonId: null }))}
                  >
                    🌍 默认
                  </button>
                  {seasons.map((season) => (
                    <button
                      key={season.id}
                      className={`season-option ${layoutLabConfig.seasonId === season.id ? "selected" : ""}`}
                      style={layoutLabConfig.seasonId === season.id ? { borderColor: season.color, color: season.color } : {}}
                      onClick={() => setLayoutLabConfig((c) => ({ ...c, seasonId: season.id }))}
                    >
                      {season.icon} {season.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="config-section">
                <label className="config-label">
                  📦 最多使用格数：<b>{layoutLabConfig.maxCells}</b> 格
                </label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={layoutLabConfig.maxCells}
                  onChange={(e) => setLayoutLabConfig((c) => ({ ...c, maxCells: parseInt(e.target.value) }))}
                  className="cells-slider"
                />
                <div className="cells-scale">
                  <span>1</span>
                  <span>6</span>
                  <span>12</span>
                </div>
              </div>

              <button className="generate-btn" onClick={handleGenerateLayouts}>
                🧪 生成候选方案
              </button>
            </div>

            {hasGeneratedLayouts && layoutCandidates.length > 0 && (
              <div className="layout-candidates">
                <h3>候选方案</h3>
                <div className="candidate-grid">
                  {layoutCandidates.map((candidate, index) => {
                    const labSeason = layoutLabConfig.seasonId
                      ? seasons.find((s) => s.id === layoutLabConfig.seasonId) || null
                      : null;
                    return (
                      <article key={candidate.id} className="candidate-card">
                        <div className="candidate-header">
                          <div className="candidate-rank" style={{ background: index === 0 ? "#5aa06a" : index === 1 ? "#f9b208" : "#d97706" }}>
                            {index + 1}
                          </div>
                          <div className="candidate-title">
                            <h4>{candidate.name}</h4>
                            <span className="candidate-strategy-tag">
                              {candidate.strategy === "focus" ? "🎯 目标导向" :
                               candidate.strategy === "balanced" ? "⚖️ 均衡发展" :
                               candidate.strategy === "diversity" ? "🌈 多样探索" : "🏆 挑战优先"}
                            </span>
                          </div>
                          <div className="candidate-score">
                            <div className="score-number">{candidate.score}</div>
                            <div className="score-label">综合分</div>
                          </div>
                        </div>

                        <div className="candidate-preview">
                          <p className="preview-label">12格预览</p>
                          <div className="mini-grid">
                            {Array.from({ length: 12 }).map((_, i) => {
                              const placedId = candidate.placed[i];
                              const deco = decorations.find((d) => d.id === placedId);
                              return (
                                <div
                                  key={i}
                                  className={`mini-cell ${deco ? "filled" : "empty"}`}
                                  style={deco ? { background: deco.color } : {}}
                                >
                                  {deco && <span>{deco.icon}</span>}
                                </div>
                              );
                            })}
                          </div>
                          <p className="cells-used">已用 {candidate.placed.filter(Boolean).length} 格</p>
                        </div>

                        <div className="candidate-metrics">
                          <p className="section-label">环境指标 {labSeason && <span className="season-mini-hint" style={{ color: labSeason.color }}>（{labSeason.name}调整）</span>}</p>
                          <div className="metric-bars">
                            {(Object.keys(candidate.adjustedMetrics) as Metric[]).map((metric) => {
                              const base = candidate.metrics[metric];
                              const adjusted = candidate.adjustedMetrics[metric];
                              const boosted = labSeason && labSeason.affectedMetrics.includes(metric);
                              return (
                                <div key={metric} className="metric-row">
                                  <span className="metric-name">{metricLabels[metric]}</span>
                                  <div className="metric-bar-track">
                                    <div
                                      className="metric-bar-fill"
                                      style={{ width: `${Math.min(100, (adjusted / 12) * 100)}%` }}
                                    />
                                  </div>
                                  <b className="metric-value">
                                    {boosted && base !== adjusted ? (
                                      <>
                                        <s>{base}</s>→{adjusted}
                                      </>
                                    ) : (
                                      adjusted
                                    )}
                                  </b>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="candidate-insects">
                          <p className="section-label">可吸引昆虫</p>
                          <div className="attracted-insects">
                            {candidate.attractedInsectIds.length > 0 ? (
                              candidate.attractedInsectIds.map((id) => {
                                const insect = insects.find((i) => i.id === id);
                                return insect ? (
                                  <span key={id} className="attracted-insect-tag">
                                    {insect.icon} {insect.name}
                                  </span>
                                ) : null;
                              })
                            ) : (
                              <span className="no-insects-hint">暂无满足条件的昆虫</span>
                            )}
                          </div>
                        </div>

                        <div className="candidate-score-detail">
                          <div className="score-item">
                            <span className="score-item-label">生态平衡</span>
                            <span className="score-item-value">{candidate.scoreDetail.ecology}</span>
                          </div>
                          <div className="score-item">
                            <span className="score-item-label">访客吸引</span>
                            <span className="score-item-value">{candidate.scoreDetail.attraction}</span>
                          </div>
                          <div className="score-item">
                            <span className="score-item-label">空间利用</span>
                            <span className="score-item-value">{candidate.scoreDetail.space}</span>
                          </div>
                        </div>

                        <div className={`candidate-challenge ${candidate.canCompleteChallenge ? "success" : "fail"}`}>
                          <div className="challenge-status-icon">
                            {candidate.canCompleteChallenge ? "✅" : "❌"}
                          </div>
                          <div className="challenge-status-text">
                            <p className="challenge-status-title">
                              {candidate.canCompleteChallenge ? "可完成今日挑战" : "暂无法完成今日挑战"}
                            </p>
                            <p className="challenge-status-desc">{candidate.challengeNote}</p>
                          </div>
                        </div>

                        <button
                          className="apply-layout-btn"
                          onClick={() => applyLayoutToHotel(candidate)}
                        >
                          🚀 一键应用到旅馆
                        </button>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {!hasGeneratedLayouts && (
              <div className="layout-lab-empty">
                <div className="empty-icon">🧪</div>
                <p>配置好参数后，点击「生成候选方案」</p>
                <p className="empty-hint">系统将从5种材料中智能组合出3套不同策略的布局方案</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showLogPanel && (
        <div className="log-overlay" onClick={() => setShowLogPanel(false)}>
          <div className="log-modal" onClick={(e) => e.stopPropagation()}>
            <div className="log-header">
              <div>
                <p className="eyebrow">观察日志</p>
                <h2>结算记录与趋势</h2>
                <p className="log-progress">
                  共 <b>{logs.length}</b> 条记录
                </p>
              </div>
              <button className="log-close" onClick={() => setShowLogPanel(false)}>✕</button>
            </div>

            <div className="log-filters">
              <div className="log-filter-group">
                <label className="log-filter-label">🐛 昆虫</label>
                <div className="log-filter-options">
                  <button
                    className={`log-filter-btn ${logFilterInsect === null ? "selected" : ""}`}
                    onClick={() => setLogFilterInsect(null)}
                  >
                    全部
                  </button>
                  {insects.map((insect) => (
                    <button
                      key={insect.id}
                      className={`log-filter-btn ${logFilterInsect === insect.id ? "selected" : ""}`}
                      onClick={() => setLogFilterInsect(insect.id)}
                    >
                      {insect.icon} {insect.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="log-filter-group">
                <label className="log-filter-label">🌤️ 季节</label>
                <div className="log-filter-options">
                  <button
                    className={`log-filter-btn ${logFilterSeason === null ? "selected" : ""}`}
                    onClick={() => setLogFilterSeason(null)}
                  >
                    全部
                  </button>
                  {seasons.map((season) => (
                    <button
                      key={season.id}
                      className={`log-filter-btn season ${logFilterSeason === season.id ? "selected" : ""}`}
                      style={logFilterSeason === season.id ? { borderColor: season.color, color: season.color } : {}}
                      onClick={() => setLogFilterSeason(season.id)}
                    >
                      {season.icon} {season.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="log-filter-group">
                <label className="log-filter-label">🏆 挑战</label>
                <div className="log-filter-options">
                  <button
                    className={`log-filter-btn ${logFilterChallengeSuccess === "all" ? "selected" : ""}`}
                    onClick={() => setLogFilterChallengeSuccess("all")}
                  >
                    全部
                  </button>
                  <button
                    className={`log-filter-btn success ${logFilterChallengeSuccess === "success" ? "selected" : ""}`}
                    onClick={() => setLogFilterChallengeSuccess("success")}
                  >
                    ✅ 成功
                  </button>
                  <button
                    className={`log-filter-btn fail ${logFilterChallengeSuccess === "fail" ? "selected" : ""}`}
                    onClick={() => setLogFilterChallengeSuccess("fail")}
                  >
                    ❌ 失败
                  </button>
                </div>
              </div>
            </div>

            {logs.length === 0 ? (
              <div className="log-empty">
                <div className="log-empty-icon">📋</div>
                <p>还没有观察日志。</p>
                <p className="log-empty-hint">点击「结算今天」后，系统会自动记录一条观察日志。</p>
              </div>
            ) : (
              <>
                {(() => {
                  const filtered = logs.filter((log) => {
                    if (logFilterInsect && !log.newInsectIds.includes(logFilterInsect)) return false;
                    if (logFilterSeason && log.seasonId !== logFilterSeason) return false;
                    if (logFilterChallengeSuccess === "success" && !log.challengeSuccess) return false;
                    if (logFilterChallengeSuccess === "fail" && log.challengeSuccess) return false;
                    return true;
                  });
                  const trendLogs = filtered.slice(-7);
                  return (
                    <>
                      {trendLogs.length >= 2 && (
                        <div className="log-trend">
                          <h3>📈 最近{trendLogs.length}次结算指标趋势</h3>
                          <div className="log-trend-chart">
                            <div className="log-trend-y-axis">
                              <span>100</span>
                              <span>75</span>
                              <span>50</span>
                              <span>25</span>
                              <span>0</span>
                            </div>
                            <div className="log-trend-grid">
                              {[25, 50, 75].map((v) => (
                                <div key={v} className="log-trend-grid-line" style={{ bottom: `${v}%` }} />
                              ))}
                              <div className="log-trend-bars">
                                {trendLogs.map((log, i) => (
                                  <div key={log.id} className="log-trend-column">
                                    <div className="log-trend-bars-group">
                                      <div
                                        className="log-trend-bar ecology"
                                        style={{ height: `${log.ecologyBalance}%` }}
                                        title={`生态平衡: ${log.ecologyBalance}`}
                                      />
                                      <div
                                        className="log-trend-bar attraction"
                                        style={{ height: `${log.visitorAttraction}%` }}
                                        title={`访客吸引: ${log.visitorAttraction}`}
                                      />
                                      <div
                                        className="log-trend-bar space"
                                        style={{ height: `${log.spaceUtilization}%` }}
                                        title={`空间利用: ${log.spaceUtilization}`}
                                      />
                                    </div>
                                    <span className="log-trend-label">
                                      {log.date.slice(5)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="log-trend-legend">
                            <span className="log-trend-legend-item"><i className="legend-dot ecology" />生态平衡</span>
                            <span className="log-trend-legend-item"><i className="legend-dot attraction" />访客吸引</span>
                            <span className="log-trend-legend-item"><i className="legend-dot space" />空间利用</span>
                          </div>
                        </div>
                      )}

                      <div className="log-list">
                        {[...filtered].reverse().map((log) => {
                          const logSeason = log.seasonId ? seasons.find((s) => s.id === log.seasonId) : null;
                          const logChallenge = challengePool.find((c) => c.id === log.challengeId);
                          return (
                            <article key={log.id} className="log-card">
                              <div className="log-card-header">
                                <div className="log-card-date">
                                  <span className="log-date-value">{log.date}</span>
                                  {logSeason && (
                                    <span className="log-season-tag" style={{ color: logSeason.color }}>
                                      {logSeason.icon} {logSeason.name}
                                    </span>
                                  )}
                                  {!logSeason && (
                                    <span className="log-season-tag default">🌍 默认</span>
                                  )}
                                </div>
                                <div className="log-card-badges">
                                  <span className={`log-challenge-badge ${log.challengeSuccess ? "success" : "fail"}`}>
                                    {log.challengeSuccess ? "✅ 挑战成功" : "❌ 挑战失败"}
                                  </span>
                                  <span className={`log-grade-badge grade-${log.hotelGrade === "—" ? "none" : log.hotelGrade.toLowerCase()}`}>
                                    {log.hotelGrade}
                                  </span>
                                </div>
                              </div>

                              <div className="log-card-body">
                                <div className="log-card-section">
                                  <h4>🧱 布局材料</h4>
                                  <div className="log-placed-row">
                                    {log.placed.length > 0 ? (
                                      log.placed.map((id, i) => {
                                        const deco = decorations.find((d) => d.id === id);
                                        return deco ? (
                                          <span key={i} className="log-placed-chip" style={{ background: deco.color }}>
                                            {deco.icon}
                                          </span>
                                        ) : null;
                                      })
                                    ) : (
                                      <span className="log-placed-empty">未放置材料</span>
                                    )}
                                  </div>
                                </div>

                                <div className="log-card-section">
                                  <h4>📊 环境指标</h4>
                                  <div className="log-metrics-row">
                                    {(Object.keys(log.adjustedMetrics) as Metric[]).map((metric) => {
                                      const base = log.baseMetrics[metric];
                                      const adjusted = log.adjustedMetrics[metric];
                                      return (
                                        <span key={metric} className="log-metric-chip">
                                          {metricLabels[metric]}
                                          {base !== adjusted ? (
                                            <><s>{base}</s>→{adjusted}</>
                                          ) : (
                                            <b>{adjusted}</b>
                                          )}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>

                                {log.newInsectIds.length > 0 && (
                                  <div className="log-card-section">
                                    <h4>🦋 新吸引昆虫</h4>
                                    <div className="log-insects-row">
                                      {log.newInsectIds.map((id) => {
                                        const insect = insects.find((i) => i.id === id);
                                        return insect ? (
                                          <span key={id} className="log-insect-tag">
                                            {insect.icon} {insect.name}
                                          </span>
                                        ) : null;
                                      })}
                                    </div>
                                  </div>
                                )}

                                <div className="log-card-section">
                                  <h4>🎯 挑战</h4>
                                  <p className="log-challenge-info">
                                    {logChallenge?.title || log.challengeTitle}
                                  </p>
                                </div>

                                <div className="log-card-section">
                                  <h4>⭐ 旅馆评级</h4>
                                  <div className="log-rating-row">
                                    <span className="log-rating-chip ecology">生态 {log.ecologyBalance}</span>
                                    <span className="log-rating-chip attraction">吸引 {log.visitorAttraction}</span>
                                    <span className="log-rating-chip space">空间 {log.spaceUtilization}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="log-card-footer">
                                <span className="log-created-at">{log.createdAt}</span>
                              </div>
                            </article>
                          );
                        })}
                      </div>

                      {filtered.length === 0 && (
                        <div className="log-no-match">
                          <p>没有符合筛选条件的日志记录。</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
