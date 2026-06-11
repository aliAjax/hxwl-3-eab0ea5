export type Metric = "shade" | "nectar" | "shelter" | "moisture";

export type SeasonId = "spring" | "summer" | "autumn" | "winter";

export type Season = {
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

export type Decoration = {
  id: string;
  name: string;
  icon: string;
  color: string;
  metrics: Record<Metric, number>;
};

export type Insect = {
  id: string;
  name: string;
  icon: string;
  likes: Partial<Record<Metric, number>>;
  note: string;
};

export type ChallengeType = "attract" | "metric_limit" | "dual_insect";

export type Challenge = {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  target: Record<string, number | string | string[]>;
  feedback: {
    success: string;
    fail: string;
  };
  isCustom?: boolean;
  enabled?: boolean;
  createdAt?: string;
};

export type HotelState = {
  placed: string[];
  guests: string[];
  lastReport: string;
};

export type Snapshot = {
  id: string;
  name: string;
  placed: string[];
  guests: string[];
  metrics: Record<Metric, number>;
  lastReport: string;
  createdAt: string;
  branchSourceId?: string;
  branchSourceName?: string;
  seasonId?: SeasonId | null;
  targetInsectId?: string | null;
};

export type ObservationLog = {
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
  hotelGrade?: string;
  ecologyBalance?: number;
  visitorAttraction?: number;
  spaceUtilization?: number;
  createdAt: string;
};

export type SimReasonItem = {
  type: "arrival" | "departure" | "stay" | "challenge" | "season" | "penalty" | "boost";
  insectId?: string;
  metric?: Metric;
  text: string;
  value?: number;
};

export type SimDayResult = {
  dayIndex: number;
  dateStr: string;
  dayOfWeek: string;
  seasonId: SeasonId;
  seasonName: string;
  seasonIcon: string;
  seasonColor: string;
  challenge: Challenge;
  challengeSuccess: boolean;
  challengeMessage: string;
  baseMetrics: Record<Metric, number>;
  adjustedMetrics: Record<Metric, number>;
  metricPenalties: Partial<Record<Metric, number>>;
  ecologyBalance: number;
  visitorAttraction: number;
  spaceUtilization: number;
  overallGrade: string;
  guestsAtStart: string[];
  guestsAtEnd: string[];
  arrivals: string[];
  departures: string[];
  stayed: string[];
  insectResidenceDays: Record<string, number>;
  reasons: SimReasonItem[];
  summaryNote: string;
};

export type SimConfig = {
  sourceType: "current" | "snapshot";
  snapshotId: string | null;
  daysCount: number;
  startDate: string;
  seasonMode: "auto" | "fixed";
  fixedSeasonId: SeasonId | null;
  seedMode: "random" | "fixed";
  seedValue: number;
};

export type SimulationResult = {
  config: SimConfig;
  seed: number;
  sourceName: string;
  sourcePlaced: string[];
  sourceGuests: string[];
  days: SimDayResult[];
  summaryStats: {
    totalArrivals: number;
    totalDepartures: number;
    peakGuests: number;
    challengeWinRate: number;
    avgEcology: number;
    avgAttraction: number;
    avgSpace: number;
    avgOverall: number;
  };
  finalState: {
    placed: string[];
    guests: string[];
    metrics: Record<Metric, number>;
  };
};

export type GradeKey = "S" | "A" | "B" | "C" | "D";
export const GRADE_ORDER: GradeKey[] = ["D", "C", "B", "A", "S"];
export const GRADE_VALUES: Record<GradeKey, number> = { D: 1, C: 2, B: 3, A: 4, S: 5 };

export type TrendMetrics = {
  ecology: number[];
  attraction: number[];
  space: number[];
  grades: (GradeKey | null)[];
  avgEcology: number | null;
  avgAttraction: number | null;
  avgSpace: number | null;
  ecologyDelta: number | null;
  attractionDelta: number | null;
  spaceDelta: number | null;
  gradeDelta: string | null;
  missingCount: number;
};

export type LayoutCandidate = {
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

export type LayoutLabConfig = {
  targetInsectId: string | null;
  seasonId: SeasonId | null;
  maxCells: number;
  lockedCells: number[];
  basePlaced: string[];
};

export type SnapshotCompareResult = {
  placedDiff: { index: number; current: string | null; snapshot: string | null; changeType: "added" | "removed" | "changed" | "same" }[];
  metricsDiff: { metric: Metric; current: number; snapshot: number; delta: number }[];
  guestsDiff: { insectId: string; changeType: "added" | "removed" | "same" }[];
  ratingDiff: {
    current: { ecologyBalance: number; visitorAttraction: number; spaceUtilization: number; overallGrade: string };
    snapshot: { ecologyBalance: number; visitorAttraction: number; spaceUtilization: number; overallGrade: string };
    deltas: { ecologyBalance: number; visitorAttraction: number; spaceUtilization: number };
  };
};

export type CalendarDayChallenge = {
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

export type ChallengeState = {
  currentChallengeId: string;
  date: string;
  completed: boolean;
  lastResult: string | null;
};

export type SuggestionItem = {
  text: string;
  type: "add" | "replace" | "attract" | "praise";
  metricDeltas: { metric: Metric; delta: number }[];
  relatedDecoration?: string;
  relatedInsect?: string;
};

export const SIM_DAYS_COUNT = 14;
export const WEEKDAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
export const MAX_SNAPSHOTS = 5;
export const MAX_CUSTOM_CHALLENGES = 20;

export const metricLabels: Record<Metric, string> = {
  shade: "遮阴",
  nectar: "花蜜",
  shelter: "藏身",
  moisture: "湿润"
};

export const decorations: Decoration[] = [
  { id: "twig", name: "空心树枝", icon: "╎", color: "#9c6b43", metrics: { shade: 1, nectar: 0, shelter: 3, moisture: 0 } },
  { id: "leaf", name: "阔叶伞", icon: "◒", color: "#5aa06a", metrics: { shade: 3, nectar: 0, shelter: 1, moisture: 1 } },
  { id: "stone", name: "温石堆", icon: "◆", color: "#8d8a82", metrics: { shade: 0, nectar: 0, shelter: 2, moisture: 0 } },
  { id: "flower", name: "小花盆", icon: "✽", color: "#df8a9b", metrics: { shade: 0, nectar: 4, shelter: 0, moisture: 1 } },
  { id: "moss", name: "苔藓毯", icon: "▧", color: "#4c7a50", metrics: { shade: 1, nectar: 0, shelter: 1, moisture: 4 } }
];

export const insects: Insect[] = [
  { id: "bee", name: "独居蜂", icon: "蜂", likes: { nectar: 3, shelter: 2 }, note: "喜欢花蜜和能钻进去的小洞。" },
  { id: "ladybird", name: "七星瓢虫", icon: "瓢", likes: { shade: 2, shelter: 2 }, note: "偏爱安静的叶下角落。" },
  { id: "firefly", name: "萤火虫", icon: "萤", likes: { moisture: 3, shade: 2 }, note: "湿润环境会让它停留更久。" },
  { id: "beetle", name: "蓝背甲虫", icon: "甲", likes: { shelter: 4 }, note: "只要藏身处足够多，它就会入住。" },
  { id: "butterfly", name: "薄翅蝶", icon: "蝶", likes: { nectar: 4, shade: 1 }, note: "会被花蜜吸引，但不喜欢太暴晒。" }
];

export const seasons: Season[] = [
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

export const challengePool: Challenge[] = [
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

export function addDaysToDate(dateStr: string, days: number): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return date;
}

export function createSeededRandom(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateRandomSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

export function getDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getSeasonForDate(date: Date): Season {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return seasons[0];
  if (month >= 5 && month <= 7) return seasons[1];
  if (month >= 8 && month <= 10) return seasons[2];
  return seasons[3];
}

export function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getLocalDayOfYear(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = current - start;
  return Math.floor(diff / 86400000);
}

export function cleanPlacedArray(placed: string[]): string[] {
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

export function calculateMetricsForPlaced(placed: string[]): Record<Metric, number> {
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

export function calculateAdjustedMetrics(placed: string[], season: Season | null): Record<Metric, number> {
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

export function getAdjustedLikes(insect: Insect, season: Season | null): Partial<Record<Metric, number>> {
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

export function getAttractedInsectIds(metrics: Record<Metric, number>, season: Season | null): string[] {
  return insects
    .filter((insect) => {
      const adjustedLikes = getAdjustedLikes(insect, season);
      return Object.entries(adjustedLikes).every(
        ([metric, value]) => metrics[metric as Metric] >= Number(value)
      );
    })
    .map((insect) => insect.id);
}

export function checkChallengeCompletion(
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

export function getEffectiveChallengePool(customChallenges: Challenge[]): Challenge[] {
  const enabledCustom = customChallenges.filter((c) => c.enabled && c.isCustom);
  return [...challengePool, ...enabledCustom];
}

export function findChallengeById(challengeId: string, customChallenges: Challenge[]): Challenge | undefined {
  const builtIn = challengePool.find((c) => c.id === challengeId);
  if (builtIn) return builtIn;
  return customChallenges.find((c) => c.id === challengeId);
}

export function getTodayChallenge(customChallenges: Challenge[] = []): Challenge {
  const pool = getEffectiveChallengePool(customChallenges);
  const dayOfYear = getLocalDayOfYear(new Date());
  const index = dayOfYear % pool.length;
  return pool[index];
}

export function getChallengeForDate(date: Date, customChallenges: Challenge[] = []): Challenge {
  const pool = getEffectiveChallengePool(customChallenges);
  const dayOfYear = getLocalDayOfYear(date);
  const index = dayOfYear % pool.length;
  return pool[index];
}

export function getBeneficialInsectsForChallenge(challenge: Challenge): Insect[] {
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

export function getKeyMetricsForChallenge(challenge: Challenge): Metric[] {
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

export function getSuggestedMaterialsForChallenge(
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

export function computeInsectSatisfaction(
  insect: Insect,
  adjustedMetrics: Record<Metric, number>,
  season: Season | null
): number {
  const adjustedLikes = getAdjustedLikes(insect, season);
  const entries = Object.entries(adjustedLikes) as [Metric, number][];
  if (entries.length === 0) return 1;
  let satisfaction = 0;
  entries.forEach(([metric, required]) => {
    const actual = adjustedMetrics[metric];
    const ratio = required > 0 ? actual / required : 1;
    if (ratio >= 1.5) satisfaction += 1;
    else if (ratio >= 1) satisfaction += 0.85 + (ratio - 1) * 0.3;
    else if (ratio >= 0.7) satisfaction += 0.4 + (ratio - 0.7) * 1.5;
    else if (ratio >= 0.4) satisfaction += 0.15 + (ratio - 0.4) * 0.8;
    else satisfaction += ratio * 0.3;
  });
  return Math.max(0, Math.min(1, satisfaction / entries.length));
}

export function computeWeakestPenalty(adjustedMetrics: Record<Metric, number>): {
  penalties: Partial<Record<Metric, number>>;
  totalPenalty: number;
  weakestMetric: Metric | null;
} {
  const penalties: Partial<Record<Metric, number>> = {};
  let totalPenalty = 0;
  let weakestMetric: Metric | null = null;
  let weakestValue = Infinity;
  const allMetrics: Metric[] = ["shade", "nectar", "shelter", "moisture"];
  allMetrics.forEach((m) => {
    const v = adjustedMetrics[m];
    if (v < 3) {
      const penalty = (3 - v) * 0.12;
      penalties[m] = penalty;
      totalPenalty += penalty;
    }
    if (v < weakestValue) {
      weakestValue = v;
      weakestMetric = m;
    }
  });
  return { penalties, totalPenalty, weakestMetric };
}

export function calculateStayProbability(
  insect: Insect,
  residenceDays: number,
  satisfaction: number,
  totalPenalty: number,
  seasonMatch: boolean
): number {
  let base = 0.58 + satisfaction * 0.35;
  if (residenceDays >= 6) base -= 0.08;
  else if (residenceDays >= 3) base += 0.04;
  base -= totalPenalty * 0.6;
  if (seasonMatch) base += 0.08;
  return Math.max(0.05, Math.min(0.98, base));
}

export function calculateArrivalProbability(
  insect: Insect,
  satisfaction: number,
  totalPenalty: number,
  seasonMatch: boolean,
  alreadyGuests: string[]
): number {
  if (alreadyGuests.includes(insect.id)) return 0;
  let base = satisfaction * 0.75;
  if (seasonMatch) base += 0.12;
  base -= totalPenalty * 0.4;
  return Math.max(0, Math.min(0.95, base));
}

export function normalizeGrade(raw: string | undefined | null): GradeKey | null {
  if (!raw) return null;
  const upper = raw.trim().toUpperCase();
  return (GRADE_ORDER as string[]).includes(upper) ? (upper as GradeKey) : null;
}

export function hasCompleteMetrics(log: ObservationLog): boolean {
  return (
    typeof log.ecologyBalance === "number" &&
    typeof log.visitorAttraction === "number" &&
    typeof log.spaceUtilization === "number" &&
    log.hotelGrade !== undefined &&
    log.hotelGrade !== null &&
    log.hotelGrade !== ""
  );
}

export function formatLogRatingMetric(value: number | undefined): string {
  return typeof value === "number" ? String(value) : "—";
}

export function computeTrendMetrics(logs: ObservationLog[]): TrendMetrics {
  const ecology: number[] = [];
  const attraction: number[] = [];
  const space: number[] = [];
  const grades: (GradeKey | null)[] = [];
  let missingCount = 0;

  logs.forEach((log) => {
    if (typeof log.ecologyBalance === "number") {
      ecology.push(log.ecologyBalance);
    } else {
      ecology.push(NaN);
      missingCount++;
    }
    if (typeof log.visitorAttraction === "number") {
      attraction.push(log.visitorAttraction);
    } else {
      attraction.push(NaN);
      missingCount++;
    }
    if (typeof log.spaceUtilization === "number") {
      space.push(log.spaceUtilization);
    } else {
      space.push(NaN);
      missingCount++;
    }
    grades.push(normalizeGrade(log.hotelGrade));
    if (!normalizeGrade(log.hotelGrade)) missingCount++;
  });

  const validAvg = (arr: number[]): number | null => {
    const valid = arr.filter((n) => !Number.isNaN(n));
    if (valid.length === 0) return null;
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  };

  const calcDelta = (arr: number[]): number | null => {
    const valid = arr.filter((n) => !Number.isNaN(n));
    if (valid.length < 2) return null;
    return valid[valid.length - 1] - valid[0];
  };

  const validGrades = grades.filter((g): g is GradeKey => g !== null);
  let gradeDelta: string | null = null;
  if (validGrades.length >= 2) {
    const first = GRADE_VALUES[validGrades[0]];
    const last = GRADE_VALUES[validGrades[validGrades.length - 1]];
    const diff = last - first;
    if (diff > 0) gradeDelta = `↑${diff}`;
    else if (diff < 0) gradeDelta = `↓${Math.abs(diff)}`;
    else gradeDelta = "—";
  }

  return {
    ecology,
    attraction,
    space,
    grades,
    avgEcology: validAvg(ecology),
    avgAttraction: validAvg(attraction),
    avgSpace: validAvg(space),
    ecologyDelta: calcDelta(ecology),
    attractionDelta: calcDelta(attraction),
    spaceDelta: calcDelta(space),
    gradeDelta,
    missingCount
  };
}

export function calculateLayoutScore(
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

export function calculateSnapshotRating(
  snapshot: Snapshot,
  season: Season | null
): { ecologyBalance: number; visitorAttraction: number; spaceUtilization: number; overallGrade: string } {
  const cleanPlaced = snapshot.placed.filter(Boolean);
  if (cleanPlaced.length === 0) {
    return {
      ecologyBalance: 0,
      visitorAttraction: 0,
      spaceUtilization: 0,
      overallGrade: "—"
    };
  }

  const effectiveMetrics = season
    ? calculateAdjustedMetrics(cleanPlaced, season)
    : calculateMetricsForPlaced(cleanPlaced);
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

  const validGuestIds = new Set(snapshot.guests.filter((id) => insects.some((insect) => insect.id === id)));
  let totalRequirementRatio = 0;
  insects.forEach((insect) => {
    const adjustedLikes = getAdjustedLikes(insect, season);
    const requirements = Object.entries(adjustedLikes);
    if (requirements.length === 0) return;
    let metCount = 0;
    requirements.forEach(([metric, value]) => {
      if (effectiveMetrics[metric as Metric] >= Number(value)) metCount++;
    });
    totalRequirementRatio += metCount / requirements.length;
  });
  const environmentReadiness = totalRequirementRatio / insects.length;
  const guestOccupancy = validGuestIds.size / insects.length;
  const visitorAttraction = Math.round((environmentReadiness * 0.75 + guestOccupancy * 0.25) * 100);

  const fillRate = cleanPlaced.length / 12;
  const uniqueTypes = new Set(cleanPlaced).size;
  const diversity = uniqueTypes / decorations.length;
  const counts: Record<string, number> = {};
  cleanPlaced.forEach((id) => {
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

  return { ecologyBalance, visitorAttraction, spaceUtilization, overallGrade };
}

export function compareSnapshotWithCurrent(
  snapshot: Snapshot,
  currentState: HotelState,
  currentMetrics: Record<Metric, number>,
  currentRating: { ecologyBalance: number; visitorAttraction: number; spaceUtilization: number; overallGrade: string },
  season: Season | null
): SnapshotCompareResult {
  const currentPlacedPadded = [...currentState.placed];
  while (currentPlacedPadded.length < 12) currentPlacedPadded.push("");
  const snapshotPlacedPadded = [...snapshot.placed];
  while (snapshotPlacedPadded.length < 12) snapshotPlacedPadded.push("");

  const placedDiff = Array.from({ length: 12 }, (_, index) => {
    const current = currentPlacedPadded[index] || null;
    const snap = snapshotPlacedPadded[index] || null;
    let changeType: "added" | "removed" | "changed" | "same" = "same";
    if (current && !snap) changeType = "added";
    else if (!current && snap) changeType = "removed";
    else if (current && snap && current !== snap) changeType = "changed";
    return { index, current, snapshot: snap, changeType };
  });

  const metricsDiff = (Object.keys(currentMetrics) as Metric[]).map((metric) => ({
    metric,
    current: currentMetrics[metric],
    snapshot: snapshot.metrics[metric] || 0,
    delta: currentMetrics[metric] - (snapshot.metrics[metric] || 0)
  }));

  const allGuestIds = Array.from(new Set([...currentState.guests, ...snapshot.guests]));
  const guestsDiff = allGuestIds.map((insectId) => {
    const inCurrent = currentState.guests.includes(insectId);
    const inSnapshot = snapshot.guests.includes(insectId);
    let changeType: "added" | "removed" | "same" = "same";
    if (inCurrent && !inSnapshot) changeType = "added";
    else if (!inCurrent && inSnapshot) changeType = "removed";
    return { insectId, changeType };
  });

  const snapshotRating = calculateSnapshotRating(snapshot, season);
  const ratingDiff = {
    current: {
      ecologyBalance: currentRating.ecologyBalance,
      visitorAttraction: currentRating.visitorAttraction,
      spaceUtilization: currentRating.spaceUtilization,
      overallGrade: currentRating.overallGrade
    },
    snapshot: {
      ecologyBalance: snapshotRating.ecologyBalance,
      visitorAttraction: snapshotRating.visitorAttraction,
      spaceUtilization: snapshotRating.spaceUtilization,
      overallGrade: snapshotRating.overallGrade
    },
    deltas: {
      ecologyBalance: currentRating.ecologyBalance - snapshotRating.ecologyBalance,
      visitorAttraction: currentRating.visitorAttraction - snapshotRating.visitorAttraction,
      spaceUtilization: currentRating.spaceUtilization - snapshotRating.spaceUtilization
    }
  };

  return { placedDiff, metricsDiff, guestsDiff, ratingDiff };
}

export function generateWeekCalendar(customChallenges: Challenge[] = []): CalendarDayChallenge[] {
  const result: CalendarDayChallenge[] = [];
  const today = new Date();
  const todayStr = getDateString(today);

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const challenge = getChallengeForDate(date, customChallenges);
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

export function runEcosystemSimulation(
  config: SimConfig,
  initialPlaced: string[],
  initialGuests: string[],
  allSnapshots: Snapshot[],
  customChallenges: Challenge[] = []
): SimulationResult {
  const seed = config.seedMode === "fixed" ? config.seedValue : generateRandomSeed();
  const random = createSeededRandom(seed);

  const days: SimDayResult[] = [];
  let currentGuests = [...initialGuests];
  const residenceDays: Record<string, number> = {};
  currentGuests.forEach((id) => (residenceDays[id] = 1));
  const placed = [...initialPlaced];
  const validPlaced = placed.filter(Boolean);
  const baseMetrics = calculateMetricsForPlaced(validPlaced);

  let totalArrivals = 0;
  let totalDepartures = 0;
  let peakGuests = initialGuests.length;
  let ecologySum = 0;
  let attractionSum = 0;
  let spaceSum = 0;
  let overallSum = 0;
  let challengeWins = 0;

  for (let dayIdx = 0; dayIdx < config.daysCount; dayIdx++) {
    const date = addDaysToDate(config.startDate, dayIdx);
    const dateStr = getDateString(date);
    const challenge = getChallengeForDate(date, customChallenges);
    const season =
      config.seasonMode === "fixed" && config.fixedSeasonId
        ? seasons.find((s) => s.id === config.fixedSeasonId)!
        : getSeasonForDate(date);
    const adjustedMetrics = calculateAdjustedMetrics(validPlaced, season);
    const { penalties, totalPenalty, weakestMetric } = computeWeakestPenalty(adjustedMetrics);

    const reasons: SimReasonItem[] = [];
    const arrivals: string[] = [];
    const departures: string[] = [];
    const stayed: string[] = [];
    const guestsAtStart = [...currentGuests];

    const seasonEffectNote = season.affectedMetrics.length > 0;
    if (seasonEffectNote && dayIdx === 0) {
      reasons.push({
        type: "season",
        text: `${season.name}来临：${season.affectedMetrics.map((m) => `${metricLabels[m]}+${season.metricBoosts[m]}/格`).join("、")}；受益昆虫：${season.affectedInsects
          .map((id) => insects.find((i) => i.id === id)?.name)
          .filter(Boolean)
          .join("、")}`
      });
    } else if (dayIdx > 0) {
      const prevSeason =
        config.seasonMode === "fixed" && config.fixedSeasonId
          ? seasons.find((s) => s.id === config.fixedSeasonId)!
          : getSeasonForDate(addDaysToDate(config.startDate, dayIdx - 1));
      if (prevSeason.id !== season.id) {
        reasons.push({
          type: "season",
          text: `季节变换：从${prevSeason.name}进入${season.name}`
        });
      }
    }

    if (weakestMetric !== null) {
      const weakValue = adjustedMetrics[weakestMetric];
      if (weakValue < 3) {
        reasons.push({
          type: "penalty",
          metric: weakestMetric,
          text: `环境短板：${metricLabels[weakestMetric]}仅${weakValue}，低于阈值3，入住率和停留率受影响`,
          value: Math.round(totalPenalty * 100)
        });
      }
    }

    const seasonBoostMetric =
      totalPenalty < 0.15 && season.affectedMetrics.some((m) => adjustedMetrics[m] >= 4)
        ? season.affectedMetrics.find((m) => adjustedMetrics[m] >= 4)
        : null;
    if (seasonBoostMetric) {
      reasons.push({
        type: "boost",
        metric: seasonBoostMetric,
        text: `${season.name}加成生效：${metricLabels[seasonBoostMetric]}充足，访客吸引力提升`
      });
    }

    const prevGuests = [...currentGuests];
    const newResidenceDays: Record<string, number> = { ...residenceDays };

    prevGuests.forEach((insectId) => {
      const insect = insects.find((i) => i.id === insectId);
      if (!insect) return;
      const satisfaction = computeInsectSatisfaction(insect, adjustedMetrics, season);
      const seasonMatch = season.affectedInsects.includes(insectId);
      const stayProb = calculateStayProbability(
        insect,
        newResidenceDays[insectId] || 0,
        satisfaction,
        totalPenalty,
        seasonMatch
      );
      const rnd = random();
      if (rnd <= stayProb) {
        stayed.push(insectId);
        newResidenceDays[insectId] = (newResidenceDays[insectId] || 0) + 1;
        if (satisfaction < 0.5) {
          reasons.push({
            type: "stay",
            insectId,
            text: `${insect.name}勉强留下（满意度${Math.round(satisfaction * 100)}%），建议改善${metricLabels[weakestMetric || "shelter"]}`
          });
        }
      } else {
        departures.push(insectId);
        const daysStayed = newResidenceDays[insectId] || 0;
        delete newResidenceDays[insectId];
        let leaveReason = "";
        if (weakestMetric !== null && adjustedMetrics[weakestMetric] < 2) {
          leaveReason = `${metricLabels[weakestMetric]}严重不足（${adjustedMetrics[weakestMetric]}）`;
        } else if (satisfaction < 0.4) {
          leaveReason = "整体环境满意度低";
        } else if (daysStayed >= 7) {
          leaveReason = "已居住较久，寻找新环境";
        } else if (!seasonMatch && season.affectedInsects.length > 0) {
          leaveReason = `${season.name}不是活跃期`;
        } else {
          leaveReason = "自然迁移";
        }
        reasons.push({
          type: "departure",
          insectId,
          text: `${insect.name}离开（${leaveReason}），停留${daysStayed}天`
        });
      }
    });

    const notGuestInsects = insects.filter((i) => !stayed.includes(i.id) && !departures.includes(i.id));
    notGuestInsects.forEach((insect) => {
      const satisfaction = computeInsectSatisfaction(insect, adjustedMetrics, season);
      const seasonMatch = season.affectedInsects.includes(insect.id);
      const arrivalProb = calculateArrivalProbability(
        insect,
        satisfaction,
        totalPenalty,
        seasonMatch,
        stayed
      );
      if (arrivalProb <= 0) return;
      const rnd = random();
      if (rnd <= arrivalProb) {
        arrivals.push(insect.id);
        stayed.push(insect.id);
        newResidenceDays[insect.id] = 1;
        const likes = Object.entries(getAdjustedLikes(insect, season));
        const strongestLike = likes.sort((a, b) => (b[1] as number) - (a[1] as number))[0];
        let arriveReason = "环境适宜";
        if (strongestLike) {
          const [m, v] = strongestLike as [Metric, number];
          if (adjustedMetrics[m] >= v) {
            arriveReason = `${metricLabels[m]}达标（${adjustedMetrics[m]}≥${v}）`;
          }
        }
        if (seasonMatch) arriveReason += `，${season.name}活跃期加成`;
        reasons.push({
          type: "arrival",
          insectId: insect.id,
          text: `${insect.name}入住！${arriveReason}`
        });
      }
    });

    currentGuests = [...stayed];
    Object.keys(residenceDays).forEach((k) => delete residenceDays[k]);
    Object.entries(newResidenceDays).forEach(([k, v]) => (residenceDays[k] = v));

    const challengedInsectIds = [...stayed];
    const challengeResult = checkChallengeCompletion(
      challenge,
      adjustedMetrics,
      validPlaced.length,
      challengedInsectIds
    );

    if (challengeResult.success) {
      challengeWins++;
      reasons.push({
        type: "challenge",
        text: `挑战达成：${challenge.title} — ${challenge.feedback.success}`
      });
    } else {
      let failReason = "";
      if (challenge.type === "attract") {
        const tgtId = challenge.target.insectId as string;
        const tgtInsect = insects.find((i) => i.id === tgtId);
        if (tgtInsect) {
          const adjustedLikes = getAdjustedLikes(tgtInsect, season);
          const gaps = Object.entries(adjustedLikes)
            .filter(([m, v]) => adjustedMetrics[m as Metric] < (v as number))
            .map(([m, v]) => `${metricLabels[m as Metric]}还差${(v as number) - adjustedMetrics[m as Metric]}`);
          failReason = gaps.length > 0 ? gaps.join("、") : "概率因素未到访";
        }
      } else if (challenge.type === "metric_limit") {
        const tgtMetric = challenge.target.metric as Metric;
        const tgtValue = challenge.target.value as number;
        const tgtCells = challenge.target.maxCells as number;
        if (adjustedMetrics[tgtMetric] < tgtValue) {
          failReason = `${metricLabels[tgtMetric]}仅${adjustedMetrics[tgtMetric]}，未达${tgtValue}`;
        } else if (validPlaced.length > tgtCells) {
          failReason = `使用了${validPlaced.length}格，超过限制${tgtCells}格`;
        }
      } else if (challenge.type === "dual_insect") {
        const missing = (challenge.target.insectIds as string[]).filter((id) => !stayed.includes(id));
        failReason = missing
          .map((id) => {
            const ins = insects.find((i) => i.id === id);
            return ins ? `${ins.name}未入住` : id;
          })
          .join("、");
      }
      reasons.push({
        type: "challenge",
        text: `挑战未达成：${challenge.title} — 原因：${failReason || "条件不足"}`
      });
    }

    const spaceScore = (() => {
      const fillRate = validPlaced.length / 12;
      const uniqueTypes = new Set(validPlaced).size;
      const diversity = uniqueTypes / decorations.length;
      const counts: Record<string, number> = {};
      validPlaced.forEach((id) => (counts[id] = (counts[id] || 0) + 1));
      const maxCount = Math.max(...Object.values(counts), 0);
      const dupPenalty = maxCount > 4 ? 0.5 : maxCount > 3 ? 0.8 : 1;
      return Math.round((fillRate * 0.4 + diversity * 0.35 + fillRate * dupPenalty * 0.25) * 100);
    })();

    const metricValues = (Object.keys(adjustedMetrics) as Metric[]).map((m) => adjustedMetrics[m]);
    const totalMetricSum = metricValues.reduce((a, b) => a + b, 0);
    const mean = totalMetricSum / 4;
    let ecologyScore = 0;
    if (mean > 0) {
      const variance = metricValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / 4;
      const stddev = Math.sqrt(variance);
      const cv = stddev / mean;
      ecologyScore = Math.max(0, Math.min(100, (1 - cv) * 100));
    }
    const zeroMetrics = metricValues.filter((v) => v === 0).length;
    ecologyScore = Math.max(0, ecologyScore - zeroMetrics * 18);

    let totalRatio = 0;
    insects.forEach((insect) => {
      const adjLikes = getAdjustedLikes(insect, season);
      const reqs = Object.entries(adjLikes);
      if (reqs.length === 0) return;
      let met = 0;
      reqs.forEach(([m, v]) => {
        if (adjustedMetrics[m as Metric] >= (v as number)) met++;
      });
      totalRatio += met / reqs.length;
    });
    const envReadiness = totalRatio / insects.length;
    const guestOcc = currentGuests.length / insects.length;
    const attractionScore = Math.round((envReadiness * 0.75 + guestOcc * 0.25) * 100);

    ecologySum += ecologyScore;
    attractionSum += attractionScore;
    spaceSum += spaceScore;
    overallSum += Math.round((ecologyScore + attractionScore + spaceScore) / 3);
    peakGuests = Math.max(peakGuests, currentGuests.length);

    const avgScore = (ecologyScore + attractionScore + spaceScore) / 3;
    let grade = "D";
    if (avgScore >= 90) grade = "S";
    else if (avgScore >= 75) grade = "A";
    else if (avgScore >= 60) grade = "B";
    else if (avgScore >= 40) grade = "C";

    let summaryNote = "";
    if (arrivals.length > 0 && departures.length > 0) {
      summaryNote = `${arrivals.length}位新访客入住，${departures.length}位离开`;
    } else if (arrivals.length > 0) {
      summaryNote = `新增${arrivals.length}位访客：${arrivals.map((id) => insects.find((i) => i.id === id)?.name).filter(Boolean).join("、")}`;
    } else if (departures.length > 0) {
      summaryNote = `${departures.length}位访客离开：${departures.map((id) => insects.find((i) => i.id === id)?.name).filter(Boolean).join("、")}`;
    } else if (stayed.length > 0) {
      summaryNote = `所有${stayed.length}位访客安稳留宿`;
    } else {
      summaryNote = "尚无访客";
    }
    if (!challengeResult.success) summaryNote += "，挑战失败";

    days.push({
      dayIndex: dayIdx,
      dateStr,
      dayOfWeek: WEEKDAY_NAMES[date.getDay()],
      seasonId: season.id,
      seasonName: season.name,
      seasonIcon: season.icon,
      seasonColor: season.color,
      challenge,
      challengeSuccess: challengeResult.success,
      challengeMessage: challengeResult.message,
      baseMetrics: { ...baseMetrics },
      adjustedMetrics: { ...adjustedMetrics },
      metricPenalties: penalties,
      ecologyBalance: Math.round(ecologyScore),
      visitorAttraction: Math.min(100, attractionScore),
      spaceUtilization: Math.min(100, spaceScore),
      overallGrade: grade,
      guestsAtStart,
      guestsAtEnd: [...currentGuests],
      arrivals,
      departures,
      stayed,
      insectResidenceDays: { ...residenceDays },
      reasons,
      summaryNote
    });

    totalArrivals += arrivals.length;
    totalDepartures += departures.length;
  }

  const sourceName =
    config.sourceType === "current"
      ? "当前旅馆布局"
      : allSnapshots.find((s) => s.id === config.snapshotId)?.name || "快照";

  return {
    config,
    seed,
    sourceName,
    sourcePlaced: initialPlaced,
    sourceGuests: initialGuests,
    days,
    summaryStats: {
      totalArrivals,
      totalDepartures,
      peakGuests,
      challengeWinRate: Math.round((challengeWins / config.daysCount) * 100),
      avgEcology: Math.round(ecologySum / config.daysCount),
      avgAttraction: Math.round(attractionSum / config.daysCount),
      avgSpace: Math.round(spaceSum / config.daysCount),
      avgOverall: Math.round(overallSum / config.daysCount)
    },
    finalState: {
      placed: [...placed],
      guests: [...currentGuests],
      metrics: baseMetrics
    }
  };
}
