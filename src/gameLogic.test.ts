import { describe, it, expect } from "vitest";
import {
  calculateMetricsForPlaced,
  calculateAdjustedMetrics,
  getAdjustedLikes,
  getAttractedInsectIds,
  checkChallengeCompletion,
  cleanPlacedArray,
  seasons,
  insects,
  decorations,
  challengePool,
  type Metric,
  type Challenge,
  computeInsectSatisfaction,
  computeWeakestPenalty,
  calculateStayProbability,
  calculateArrivalProbability,
  getKeyMetricsForChallenge,
  getBeneficialInsectsForChallenge,
  calculateLayoutScore,
  createSeededRandom,
  getSeasonForDate,
  getDateString,
  addDaysToDate
} from "./gameLogic";

describe("材料指标计算", () => {
  it("空布局返回全部为0", () => {
    const result = calculateMetricsForPlaced([]);
    expect(result).toEqual({ shade: 0, nectar: 0, shelter: 0, moisture: 0 });
  });

  it("单个材料指标正确", () => {
    const flower = calculateMetricsForPlaced(["flower"]);
    expect(flower.nectar).toBe(4);
    expect(flower.moisture).toBe(1);

    const twig = calculateMetricsForPlaced(["twig"]);
    expect(twig.shade).toBe(1);
    expect(twig.shelter).toBe(3);

    const moss = calculateMetricsForPlaced(["moss"]);
    expect(moss.moisture).toBe(4);
    expect(moss.shade).toBe(1);
    expect(moss.shelter).toBe(1);
  });

  it("多个材料指标累加", () => {
    const result = calculateMetricsForPlaced(["flower", "flower", "leaf"]);
    expect(result.nectar).toBe(4 + 4 + 0);
    expect(result.shade).toBe(0 + 0 + 3);
    expect(result.shelter).toBe(0 + 0 + 1);
    expect(result.moisture).toBe(1 + 1 + 1);
  });

  it("材料重复放置正确累加", () => {
    const fiveFlowers = calculateMetricsForPlaced(["flower", "flower", "flower", "flower", "flower"]);
    expect(fiveFlowers.nectar).toBe(20);
    expect(fiveFlowers.moisture).toBe(5);

    const fourTwigs = calculateMetricsForPlaced(["twig", "twig", "twig", "twig"]);
    expect(fourTwigs.shelter).toBe(12);
    expect(fourTwigs.shade).toBe(4);
  });

  it("所有类型材料齐全布局", () => {
    const all = ["twig", "leaf", "stone", "flower", "moss"];
    const result = calculateMetricsForPlaced(all);
    expect(result.shade).toBe(1 + 3 + 0 + 0 + 1);
    expect(result.nectar).toBe(0 + 0 + 0 + 4 + 0);
    expect(result.shelter).toBe(3 + 1 + 2 + 0 + 1);
    expect(result.moisture).toBe(0 + 1 + 0 + 1 + 4);
  });

  it("忽略无效材料ID", () => {
    const result = calculateMetricsForPlaced(["flower", "invalid_id", "leaf", ""]);
    expect(result.nectar).toBe(4);
    expect(result.shade).toBe(3);
  });
});

describe("季节加成", () => {
  const spring = seasons[0];
  const summer = seasons[1];
  const autumn = seasons[2];
  const winter = seasons[3];

  it("春季对花蜜和湿润有加成", () => {
    const placed = ["flower", "moss"];
    const base = calculateMetricsForPlaced(placed);
    const adjusted = calculateAdjustedMetrics(placed, spring);

    expect(adjusted.nectar).toBeGreaterThan(base.nectar);
    expect(adjusted.moisture).toBeGreaterThan(base.moisture);

    expect(base.nectar).toBe(4);
    expect(adjusted.nectar).toBe(4 + 1);

    expect(base.moisture).toBe(1 + 4);
    expect(adjusted.moisture).toBe((1 + 1) + (4 + 1));
  });

  it("夏季对遮阴和藏身有加成", () => {
    const placed = ["leaf", "twig"];
    const adjusted = calculateAdjustedMetrics(placed, summer);

    expect(adjusted.shade).toBe((3 + 1) + (1 + 1));
    expect(adjusted.shelter).toBe((1 + 1) + (3 + 1));
  });

  it("秋季对藏身和遮阴有加成（藏身+2）", () => {
    const placed = ["twig", "stone"];
    const adjusted = calculateAdjustedMetrics(placed, autumn);

    expect(adjusted.shelter).toBe((3 + 2) + (2 + 2));
    expect(adjusted.shade).toBe((1 + 1) + 0);
  });

  it("冬季对藏身有+2加成", () => {
    const placed = ["twig", "twig"];
    const adjusted = calculateAdjustedMetrics(placed, winter);
    expect(adjusted.shelter).toBe((3 + 2) + (3 + 2));
  });

  it("无季节时等同于基础指标", () => {
    const placed = ["flower", "leaf"];
    const adjusted = calculateAdjustedMetrics(placed, null);
    const base = calculateMetricsForPlaced(placed);
    expect(adjusted).toEqual(base);
  });

  it("空布局季节加成返回全0", () => {
    const adjusted = calculateAdjustedMetrics([], spring);
    expect(adjusted).toEqual({ shade: 0, nectar: 0, shelter: 0, moisture: 0 });
  });

  it("季节加成仅对值大于0的指标生效", () => {
    const placed = ["stone"];
    const adjusted = calculateAdjustedMetrics(placed, spring);
    expect(adjusted.nectar).toBe(0);
    expect(adjusted.shelter).toBe(2);
  });
});

describe("昆虫入住判断", () => {
  it("空布局无昆虫入住", () => {
    const metrics = { shade: 0, nectar: 0, shelter: 0, moisture: 0 };
    const attracted = getAttractedInsectIds(metrics, null);
    expect(attracted).toEqual([]);
  });

  it("独居蜂入住条件：花蜜≥3 藏身≥2", () => {
    const bee = insects.find(i => i.id === "bee")!;
    const nectarEnough = { shade: 0, nectar: 3, shelter: 2, moisture: 0 };
    expect(getAttractedInsectIds(nectarEnough, null)).toContain("bee");

    const nectarNotEnough = { shade: 0, nectar: 2, shelter: 2, moisture: 0 };
    expect(getAttractedInsectIds(nectarNotEnough, null)).not.toContain("bee");
  });

  it("蓝背甲虫入住条件：藏身≥4", () => {
    const beetleIn = { shade: 0, nectar: 0, shelter: 4, moisture: 0 };
    expect(getAttractedInsectIds(beetleIn, null)).toContain("beetle");

    const beetleOut = { shade: 0, nectar: 0, shelter: 3, moisture: 0 };
    expect(getAttractedInsectIds(beetleOut, null)).not.toContain("beetle");
  });

  it("萤火虫入住条件：湿润≥3 遮阴≥2", () => {
    const fireflyIn = { shade: 2, nectar: 0, shelter: 0, moisture: 3 };
    expect(getAttractedInsectIds(fireflyIn, null)).toContain("firefly");

    const fireflyOut = { shade: 1, nectar: 0, shelter: 0, moisture: 3 };
    expect(getAttractedInsectIds(fireflyOut, null)).not.toContain("firefly");
  });

  it("完美布局吸引所有昆虫", () => {
    const perfect = { shade: 3, nectar: 4, shelter: 4, moisture: 3 };
    const attracted = getAttractedInsectIds(perfect, null);
    expect(attracted).toContain("bee");
    expect(attracted).toContain("beetle");
    expect(attracted).toContain("firefly");
    expect(attracted).toContain("ladybird");
    expect(attracted).toContain("butterfly");
  });
});

describe("季节调整后昆虫阈值变化", () => {
  const spring = seasons[0];
  const summer = seasons[1];
  const autumn = seasons[2];
  const winter = seasons[3];

  it("春季降低独居蜂入住门槛", () => {
    const springLikes = getAdjustedLikes(insects.find(i => i.id === "bee")!, spring);
    expect(springLikes.nectar).toBe(3 - 1);
    expect(springLikes.shelter).toBe(2 - 1);
  });

  it("夏季降低萤火虫入住门槛", () => {
    const summerLikes = getAdjustedLikes(insects.find(i => i.id === "firefly")!, summer);
    expect(summerLikes.moisture).toBe(3 - 1);
    expect(summerLikes.shade).toBe(2 - 1);
  });

  it("秋季大幅降低蓝背甲虫藏身门槛", () => {
    const autumnLikes = getAdjustedLikes(insects.find(i => i.id === "beetle")!, autumn);
    expect(autumnLikes.shelter).toBe(4 - 2);
  });

  it("冬季大幅升高昆虫入住门槛", () => {
    const beeWinter = getAdjustedLikes(insects.find(i => i.id === "bee")!, winter);
    expect(beeWinter.nectar).toBe(3 + 2);
    expect(beeWinter.shelter).toBe(2 + 2);
  });

  it("春季阈值降低使原本不达标的昆虫能入住", () => {
    const metrics = { shade: 1, nectar: 2, shelter: 1, moisture: 2 };

    const attractedNoSeason = getAttractedInsectIds(metrics, null);
    expect(attractedNoSeason).not.toContain("bee");

    const attractedSpring = getAttractedInsectIds(metrics, spring);
    expect(attractedSpring).toContain("bee");
  });

  it("季节调整不低于0", () => {
    const likes = getAdjustedLikes(insects.find(i => i.id === "beetle")!, autumn);
    expect(likes.shelter).toBeGreaterThanOrEqual(0);
  });
});

describe("每日挑战判定", () => {
  describe("attract 类型挑战", () => {
    const attractBeeChallenge = challengePool.find(c => c.id === "attract_bee")!;

    it("目标昆虫在匹配列表中则成功", () => {
      const metrics = { shade: 0, nectar: 0, shelter: 0, moisture: 0 };
      const result = checkChallengeCompletion(
        attractBeeChallenge,
        metrics,
        3,
        ["bee", "ladybird"]
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe(attractBeeChallenge.feedback.success);
    });

    it("目标昆虫不在匹配列表中则失败", () => {
      const metrics = { shade: 0, nectar: 0, shelter: 0, moisture: 0 };
      const result = checkChallengeCompletion(
        attractBeeChallenge,
        metrics,
        3,
        ["ladybird", "firefly"]
      );
      expect(result.success).toBe(false);
      expect(result.message).toBe(attractBeeChallenge.feedback.fail);
    });
  });

  describe("metric_limit 类型挑战", () => {
    const nectar6Challenge = challengePool.find(c => c.id === "metric_nectar_6")!;
    const shelter5Challenge = challengePool.find(c => c.id === "metric_shelter_5")!;
    const shade4Challenge = challengePool.find(c => c.id === "metric_shade_4")!;

    it("花蜜值达标且格子数≤maxCells则成功", () => {
      const metrics = { shade: 0, nectar: 8, shelter: 0, moisture: 0 };
      const result = checkChallengeCompletion(nectar6Challenge, metrics, 5, []);
      expect(result.success).toBe(true);
    });

    it("花蜜值不达标则失败", () => {
      const metrics = { shade: 0, nectar: 7, shelter: 0, moisture: 0 };
      const result = checkChallengeCompletion(nectar6Challenge, metrics, 5, []);
      expect(result.success).toBe(false);
    });

    it("花蜜值达标但格子数超过maxCells则失败", () => {
      const metrics = { shade: 0, nectar: 10, shelter: 0, moisture: 0 };
      const result = checkChallengeCompletion(nectar6Challenge, metrics, 7, []);
      expect(result.success).toBe(false);
    });

    it("metric_limit maxCells边界：恰好等于限制数成功", () => {
      const metrics = { shade: 0, nectar: 8, shelter: 0, moisture: 0 };
      const result = checkChallengeCompletion(nectar6Challenge, metrics, 6, []);
      expect(result.success).toBe(true);
    });

    it("metric_limit maxCells边界：超出1格失败", () => {
      const metrics = { shade: 0, nectar: 12, shelter: 0, moisture: 0 };
      const result = checkChallengeCompletion(nectar6Challenge, metrics, 7, []);
      expect(result.success).toBe(false);
    });

    it("藏身值刚好10且格子5个成功", () => {
      const metrics = { shade: 0, nectar: 0, shelter: 10, moisture: 0 };
      const result = checkChallengeCompletion(shelter5Challenge, metrics, 5, []);
      expect(result.success).toBe(true);
    });

    it("遮阴刚好6且格子≤4成功", () => {
      const metrics = { shade: 6, nectar: 0, shelter: 0, moisture: 0 };
      const result = checkChallengeCompletion(shade4Challenge, metrics, 4, []);
      expect(result.success).toBe(true);
    });

    it("遮阴6但用了5格失败", () => {
      const metrics = { shade: 6, nectar: 0, shelter: 0, moisture: 0 };
      const result = checkChallengeCompletion(shade4Challenge, metrics, 5, []);
      expect(result.success).toBe(false);
    });
  });

  describe("dual_insect 类型挑战", () => {
    const dualBeeBeetle = challengePool.find(c => c.id === "dual_bee_beetle")!;
    const dualLadybirdFirefly = challengePool.find(c => c.id === "dual_ladybird_firefly")!;

    it("两种昆虫都在列表中则成功", () => {
      const metrics = { shade: 0, nectar: 0, shelter: 0, moisture: 0 };
      const result = checkChallengeCompletion(
        dualBeeBeetle,
        metrics,
        5,
        ["bee", "beetle", "ladybird"]
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe(dualBeeBeetle.feedback.success);
    });

    it("仅一种昆虫存在则失败", () => {
      const metrics = { shade: 0, nectar: 0, shelter: 0, moisture: 0 };
      const result = checkChallengeCompletion(
        dualBeeBeetle,
        metrics,
        5,
        ["bee", "ladybird"]
      );
      expect(result.success).toBe(false);
      expect(result.message).toBe(dualBeeBeetle.feedback.fail);
    });

    it("两种昆虫都不存在则失败", () => {
      const metrics = { shade: 0, nectar: 0, shelter: 0, moisture: 0 };
      const result = checkChallengeCompletion(
        dualLadybirdFirefly,
        metrics,
        5,
        ["bee", "beetle", "butterfly"]
      );
      expect(result.success).toBe(false);
    });

    it("昆虫列表顺序不影响结果", () => {
      const metrics = { shade: 0, nectar: 0, shelter: 0, moisture: 0 };
      const result1 = checkChallengeCompletion(
        dualBeeBeetle,
        metrics,
        5,
        ["beetle", "bee"]
      );
      const result2 = checkChallengeCompletion(
        dualBeeBeetle,
        metrics,
        5,
        ["bee", "beetle"]
      );
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  describe("未知挑战类型", () => {
    it("返回失败和提示", () => {
      const fakeChallenge = {
        id: "fake",
        type: "unknown" as any,
        title: "未知",
        description: "测试",
        target: {},
        feedback: { success: "成功", fail: "失败" }
      };
      const result = checkChallengeCompletion(fakeChallenge, { shade: 0, nectar: 0, shelter: 0, moisture: 0 }, 0, []);
      expect(result.success).toBe(false);
      expect(result.message).toBe("未知挑战类型。");
    });
  });
});

describe("cleanPlacedArray 布局清理", () => {
  it("空数组返回空数组", () => {
    expect(cleanPlacedArray([])).toEqual([]);
  });

  it("有效材料保留", () => {
    const result = cleanPlacedArray(["flower", "leaf"]);
    expect(result).toEqual(["flower", "leaf"]);
  });

  it("无效ID转为空字符串并清理尾部空", () => {
    const result = cleanPlacedArray(["flower", "invalid", "leaf"]);
    expect(result[0]).toBe("flower");
    expect(result[1]).toBe("");
    expect(result[2]).toBe("leaf");
  });

  it("尾部空字符串被截断", () => {
    const result = cleanPlacedArray(["flower", "", "", "", ""]);
    expect(result).toEqual(["flower"]);
  });

  it("全空返回空数组", () => {
    const result = cleanPlacedArray(["", "", "", ""]);
    expect(result).toEqual([]);
  });

  it("超过12格只保留前12格", () => {
    const input = Array(15).fill("flower");
    const result = cleanPlacedArray(input);
    expect(result.length).toBe(12);
  });
});

describe("昆虫满意度计算", () => {
  const spring = seasons[0];
  const summer = seasons[1];

  it("完全满足条件满意度高", () => {
    const bee = insects.find(i => i.id === "bee")!;
    const metrics = { shade: 0, nectar: 10, shelter: 10, moisture: 0 };
    const satisfaction = computeInsectSatisfaction(bee, metrics, summer);
    expect(satisfaction).toBeGreaterThan(0.8);
  });

  it("刚好满足条件满意度约0.85", () => {
    const bee = insects.find(i => i.id === "bee")!;
    const metrics = { shade: 0, nectar: 3, shelter: 2, moisture: 0 };
    const satisfaction = computeInsectSatisfaction(bee, metrics, null);
    expect(satisfaction).toBeGreaterThanOrEqual(0.85);
    expect(satisfaction).toBeLessThan(0.95);
  });

  it("严重不满足满意度接近0", () => {
    const beetle = insects.find(i => i.id === "beetle")!;
    const metrics = { shade: 0, nectar: 0, shelter: 0, moisture: 0 };
    const satisfaction = computeInsectSatisfaction(beetle, metrics, spring);
    expect(satisfaction).toBeLessThan(0.3);
  });

  it("返回值在0到1之间", () => {
    const firefly = insects.find(i => i.id === "firefly")!;
    for (let i = 0; i < 20; i++) {
      const metrics = {
        shade: i % 5,
        nectar: i % 3,
        shelter: i % 4,
        moisture: i % 6
      };
      const s = computeInsectSatisfaction(firefly, metrics, summer);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
    }
  });
});

describe("环境短板惩罚计算", () => {
  it("全部指标≥3无惩罚", () => {
    const result = computeWeakestPenalty({ shade: 3, nectar: 4, shelter: 5, moisture: 3 });
    expect(result.totalPenalty).toBe(0);
    expect(Object.keys(result.penalties).length).toBe(0);
  });

  it("指标低于3有惩罚", () => {
    const result = computeWeakestPenalty({ shade: 2, nectar: 1, shelter: 4, moisture: 5 });
    expect(result.totalPenalty).toBeGreaterThan(0);
    expect(result.penalties.shade).toBeCloseTo(0.12);
    expect(result.penalties.nectar).toBeCloseTo(0.24);
  });

  it("全为0总惩罚正确", () => {
    const result = computeWeakestPenalty({ shade: 0, nectar: 0, shelter: 0, moisture: 0 });
    expect(result.totalPenalty).toBeCloseTo(4 * 3 * 0.12);
  });

  it("最弱指标正确识别", () => {
    const result = computeWeakestPenalty({ shade: 5, nectar: 1, shelter: 3, moisture: 2 });
    expect(result.weakestMetric).toBe("nectar");
  });
});

describe("停留/到达概率", () => {
  const bee = insects.find(i => i.id === "bee")!;

  it("满意度高停留概率高", () => {
    const probHigh = calculateStayProbability(bee, 1, 0.95, 0, false);
    const probLow = calculateStayProbability(bee, 1, 0.2, 0, false);
    expect(probHigh).toBeGreaterThan(probLow);
  });

  it("季节匹配提高停留概率", () => {
    const spring = seasons[0];
    const withMatch = calculateStayProbability(bee, 2, 0.7, 0, true);
    const withoutMatch = calculateStayProbability(bee, 2, 0.7, 0, false);
    expect(withMatch).toBeGreaterThan(withoutMatch);
  });

  it("已入住昆虫到达概率为0", () => {
    const prob = calculateArrivalProbability(bee, 0.9, 0, true, ["bee"]);
    expect(prob).toBe(0);
  });

  it("满意度高到达概率高", () => {
    const probHigh = calculateArrivalProbability(bee, 0.9, 0, true, []);
    const probLow = calculateArrivalProbability(bee, 0.2, 0, true, []);
    expect(probHigh).toBeGreaterThan(probLow);
  });

  it("概率被限制在合理范围内", () => {
    const stay = calculateStayProbability(bee, 100, -1, 100, false);
    expect(stay).toBeGreaterThanOrEqual(0.05);
    expect(stay).toBeLessThanOrEqual(0.98);

    const arrive = calculateArrivalProbability(bee, 100, -100, true, []);
    expect(arrive).toBeGreaterThanOrEqual(0);
    expect(arrive).toBeLessThanOrEqual(0.95);
  });
});

describe("挑战辅助函数", () => {
  it("getKeyMetricsForChallenge attract类型返回目标昆虫需要的指标", () => {
    const attractBee = challengePool.find(c => c.id === "attract_bee")!;
    const metrics = getKeyMetricsForChallenge(attractBee);
    expect(metrics).toContain("nectar");
    expect(metrics).toContain("shelter");
  });

  it("getKeyMetricsForChallenge dual_insect类型合并两种昆虫的指标", () => {
    const dualChallenge = challengePool.find(c => c.id === "dual_bee_beetle")!;
    const metrics = getKeyMetricsForChallenge(dualChallenge);
    expect(metrics).toContain("nectar");
    expect(metrics).toContain("shelter");
  });

  it("getKeyMetricsForChallenge metric_limit类型返回目标指标", () => {
    const challenge = challengePool.find(c => c.id === "metric_nectar_6")!;
    const metrics = getKeyMetricsForChallenge(challenge);
    expect(metrics).toEqual(["nectar"]);
  });

  it("getBeneficialInsectsForChallenge attract类型返回目标昆虫", () => {
    const attractBee = challengePool.find(c => c.id === "attract_bee")!;
    const insects = getBeneficialInsectsForChallenge(attractBee);
    expect(insects.map(i => i.id)).toContain("bee");
  });

  it("getBeneficialInsectsForChallenge dual_insect返回两种昆虫", () => {
    const dual = challengePool.find(c => c.id === "dual_bee_beetle")!;
    const result = getBeneficialInsectsForChallenge(dual);
    expect(result.map(i => i.id)).toContain("bee");
    expect(result.map(i => i.id)).toContain("beetle");
  });
});

describe("布局评分", () => {
  it("空布局评分为0", () => {
    const metrics = { shade: 0, nectar: 0, shelter: 0, moisture: 0 };
    const score = calculateLayoutScore(metrics, [], null, null);
    expect(score.total).toBeGreaterThanOrEqual(0);
    expect(score.ecology).toBe(0);
    expect(score.attraction).toBe(0);
    expect(score.space).toBe(0);
  });

  it("平衡布局生态评分高", () => {
    const balanced = { shade: 3, nectar: 3, shelter: 3, moisture: 3 };
    const placed = ["leaf", "flower", "twig", "moss"];
    const score = calculateLayoutScore(balanced, placed, null, null);
    expect(score.ecology).toBeGreaterThan(70);
  });

  it("偏科布局生态评分低", () => {
    const skewed = { shade: 0, nectar: 12, shelter: 0, moisture: 0 };
    const placed = Array(3).fill("flower");
    const score = calculateLayoutScore(skewed, placed, null, null);
    expect(score.ecology).toBeLessThan(60);
  });

  it("目标昆虫入住有加分", () => {
    const goodForBee = { shade: 0, nectar: 5, shelter: 4, moisture: 0 };
    const placed = ["flower", "flower", "twig"];
    const withTarget = calculateLayoutScore(goodForBee, placed, null, "bee");
    const withoutTarget = calculateLayoutScore(goodForBee, placed, null, null);
    expect(withTarget.total).toBeGreaterThan(withoutTarget.total);
  });

  it("材料多样性影响空间利用分", () => {
    const metrics = { shade: 4, nectar: 4, shelter: 4, moisture: 4 };
    const diverse = ["twig", "leaf", "stone", "flower", "moss"];
    const duplicated = Array(5).fill("flower");
    
    const scoreDiverse = calculateLayoutScore(metrics, diverse, null, null);
    const scoreDup = calculateLayoutScore(metrics, duplicated, null, null);
    
    expect(scoreDiverse.space).toBeGreaterThan(scoreDup.space);
  });

  it("重复材料过多触发惩罚", () => {
    const metrics = { shade: 0, nectar: 20, shelter: 0, moisture: 5 };
    const fiveDup = Array(5).fill("flower");
    const threeDup = Array(3).fill("flower");
    
    const score5 = calculateLayoutScore(metrics, fiveDup, null, null);
    const score3 = calculateLayoutScore(metrics, threeDup, null, null);
    
    const placeSize5 = { shade: 0, nectar: 20, shelter: 0, moisture: 5 };
    const sizeOnly3 = { shade: 0, nectar: 12, shelter: 0, moisture: 3 };
    const normScore5 = calculateLayoutScore(placeSize5, fiveDup, null, null);
    const normScore3 = calculateLayoutScore(sizeOnly3, threeDup, null, null);
  });
});

describe("种子随机数生成", () => {
  it("相同种子产生相同序列", () => {
    const r1 = createSeededRandom(42);
    const r2 = createSeededRandom(42);
    for (let i = 0; i < 10; i++) {
      expect(r1()).toBe(r2());
    }
  });

  it("不同种子产生不同序列", () => {
    const r1 = createSeededRandom(1);
    const r2 = createSeededRandom(2);
    let hasDiff = false;
    for (let i = 0; i < 10; i++) {
      if (r1() !== r2()) {
        hasDiff = true;
        break;
      }
    }
    expect(hasDiff).toBe(true);
  });

  it("返回值在0到1之间", () => {
    const r = createSeededRandom(12345);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("日期与季节函数", () => {
  it("getSeasonForDate 春季月份正确", () => {
    const march = new Date(2024, 2, 15);
    const april = new Date(2024, 3, 15);
    const may = new Date(2024, 4, 30);
    expect(getSeasonForDate(march).id).toBe("spring");
    expect(getSeasonForDate(april).id).toBe("spring");
    expect(getSeasonForDate(may).id).toBe("spring");
  });

  it("getSeasonForDate 夏季月份正确", () => {
    const june = new Date(2024, 5, 1);
    const july = new Date(2024, 6, 15);
    const august = new Date(2024, 7, 31);
    expect(getSeasonForDate(june).id).toBe("summer");
    expect(getSeasonForDate(july).id).toBe("summer");
    expect(getSeasonForDate(august).id).toBe("summer");
  });

  it("getSeasonForDate 秋季月份正确", () => {
    const september = new Date(2024, 8, 1);
    const october = new Date(2024, 9, 15);
    const november = new Date(2024, 10, 30);
    expect(getSeasonForDate(september).id).toBe("autumn");
    expect(getSeasonForDate(october).id).toBe("autumn");
    expect(getSeasonForDate(november).id).toBe("autumn");
  });

  it("getSeasonForDate 冬季月份正确", () => {
    const december = new Date(2024, 11, 1);
    const january = new Date(2024, 0, 15);
    const february = new Date(2024, 1, 28);
    expect(getSeasonForDate(december).id).toBe("winter");
    expect(getSeasonForDate(january).id).toBe("winter");
    expect(getSeasonForDate(february).id).toBe("winter");
  });

  it("getDateString 格式正确", () => {
    const date = new Date(2024, 0, 5);
    expect(getDateString(date)).toBe("2024-01-05");
  });

  it("addDaysToDate 日期计算正确", () => {
    const date = addDaysToDate("2024-01-01", 5);
    expect(getDateString(date)).toBe("2024-01-06");

    const acrossMonth = addDaysToDate("2024-01-30", 3);
    expect(getDateString(acrossMonth)).toBe("2024-02-02");
  });
});

describe("材料常量完整性", () => {
  it("每种材料有唯一ID", () => {
    const ids = decorations.map(d => d.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("每种昆虫有唯一ID", () => {
    const ids = insects.map(i => i.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("每个季节有唯一ID", () => {
    const ids = seasons.map(s => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("每个挑战有唯一ID", () => {
    const ids = challengePool.map(c => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("每种材料至少有一项正指标", () => {
    decorations.forEach(deco => {
      const hasPositive = (Object.values(deco.metrics) as number[]).some(v => v > 0);
      expect(hasPositive).toBe(true);
    });
  });

  it("每种昆虫至少有一项喜好指标", () => {
    insects.forEach(insect => {
      const hasPreference = Object.keys(insect.likes).length > 0;
      expect(hasPreference).toBe(true);
    });
  });
});

describe("组合场景：材料+季节+昆虫+挑战联动", () => {
  const spring = seasons[0];
  const summer = seasons[1];
  const autumn = seasons[2];

  it("春季+小花盆×3吸引独居蜂并完成attract挑战", () => {
    const placed = ["flower", "flower", "twig"];
    const adjusted = calculateAdjustedMetrics(placed, spring);
    const attracted = getAttractedInsectIds(adjusted, spring);

    expect(attracted).toContain("bee");

    const attractBeeChallenge = challengePool.find(c => c.id === "attract_bee")!;
    const challengeResult = checkChallengeCompletion(
      attractBeeChallenge,
      adjusted,
      placed.length,
      attracted
    );
    expect(challengeResult.success).toBe(true);
  });

  it("夏季+阔叶伞+苔藓毯完成萤火虫吸引", () => {
    const placed = ["leaf", "moss", "moss"];
    const adjusted = calculateAdjustedMetrics(placed, summer);
    const attracted = getAttractedInsectIds(adjusted, summer);

    expect(attracted).toContain("firefly");
    expect(attracted).toContain("ladybird");
  });

  it("metric_nectar_6挑战：使用小花盆×3完成花蜜任务", () => {
    const placed = ["flower", "flower"];
    const adjusted = calculateAdjustedMetrics(placed, spring);
    const challenge = challengePool.find(c => c.id === "metric_nectar_6")!;

    const result = checkChallengeCompletion(challenge, adjusted, placed.length, []);
    expect(adjusted.nectar).toBeGreaterThanOrEqual(8);
    expect(placed.length).toBeLessThanOrEqual(6);
    expect(result.success).toBe(true);
  });

  it("metric_shelter_5挑战：用空心树枝×3 + 温石堆成功", () => {
    const placed = ["twig", "twig", "stone"];
    const adjusted = calculateAdjustedMetrics(placed, autumn);
    const challenge = challengePool.find(c => c.id === "metric_shelter_5")!;

    const result = checkChallengeCompletion(challenge, adjusted, placed.length, []);
    expect(result.success).toBe(true);
  });

  it("dual_bee_beetle挑战：同时满足独居蜂+蓝背甲虫", () => {
    const placed = ["flower", "flower", "twig", "twig", "stone"];
    const adjusted = calculateAdjustedMetrics(placed, autumn);
    const attracted = getAttractedInsectIds(adjusted, autumn);
    const challenge = challengePool.find(c => c.id === "dual_bee_beetle")!;

    const result = checkChallengeCompletion(challenge, adjusted, placed.length, attracted);
    expect(result.success).toBe(true);
  });

  it("空布局完成不了任何昆虫挑战", () => {
    const placed: string[] = [];
    const metrics = calculateAdjustedMetrics(placed, null);
    const attracted = getAttractedInsectIds(metrics, null);

    const attractBee = challengePool.find(c => c.id === "attract_bee")!;
    const r1 = checkChallengeCompletion(attractBee, metrics, 0, attracted);
    expect(r1.success).toBe(false);

    const dualChallenge = challengePool.find(c => c.id === "dual_bee_beetle")!;
    const r2 = checkChallengeCompletion(dualChallenge, metrics, 0, attracted);
    expect(r2.success).toBe(false);
  });

  it("metric_limit边界：花蜜值够但格子超了1个失败", () => {
    const placed = Array(7).fill("flower");
    const adjusted = calculateAdjustedMetrics(placed, spring);
    const challenge = challengePool.find(c => c.id === "metric_nectar_6")!;

    expect(adjusted.nectar).toBeGreaterThanOrEqual(8);
    expect(placed.length).toBe(7);

    const result = checkChallengeCompletion(challenge, adjusted, placed.length, []);
    expect(result.success).toBe(false);
  });
});
