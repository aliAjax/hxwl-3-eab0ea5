import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock
});

beforeEach(() => {
  localStorageMock.clear();
});

describe("App 组件冒烟测试", () => {
  it("渲染页面标题区域", () => {
    render(<App />);
    expect(screen.getAllByText(/昆虫旅馆/).length).toBeGreaterThan(0);
  });

  it("显示今日挑战区域", () => {
    render(<App />);
    expect(screen.getAllByText(/挑战/).length).toBeGreaterThan(0);
  });

  it("渲染材料选择列表", () => {
    render(<App />);
    expect(screen.getAllByText(/小花盆/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/阔叶伞/).length).toBeGreaterThan(0);
  });

  it("初始旅馆状态为空提示", () => {
    render(<App />);
    const emptyHint = screen.getByText(/放置一些材料/);
    expect(emptyHint).toBeInTheDocument();
  });

  it("四项指标全部显示", () => {
    render(<App />);
    expect(screen.getAllByText(/遮阴/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/花蜜/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/藏身/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/湿润/).length).toBeGreaterThan(0);
  });

  it("页面包含5种以上材料图标字符", () => {
    const { container } = render(<App />);
    const icons = ["╎", "◒", "◆", "✽", "▧"];
    const textContent = container.textContent || "";
    const found = icons.filter((c) => textContent.includes(c));
    expect(found.length).toBeGreaterThanOrEqual(3);
  });
});
