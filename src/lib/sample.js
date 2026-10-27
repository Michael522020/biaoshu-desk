export function sampleProject() {
  const now = "2026-10-27T02:00:00.000Z";
  return {
    id: "sample-bridge-desk",
    name: "市政桥梁巡检信息化",
    createdAt: now,
    updatedAt: now,
    approved: false,
    documents: [
      {
        id: "doc-brief",
        name: "巡检需求摘录.txt",
        text: "投标人必须覆盖主城区在役桥梁的日常巡检。\n系统应支持离线记录，并在恢复网络后上传。\n应提供巡检人员资质证明。",
      },
    ],
    requirements: [
      { id: "R-01", text: "投标人必须覆盖主城区在役桥梁的日常巡检。", level: "核心", state: "covered", chapterId: "c-scope", source: "巡检需求摘录.txt", manual: false },
      { id: "R-02", text: "应提供巡检人员资质证明。", level: "一般", state: "risk", chapterId: "c-people", source: "巡检需求摘录.txt", manual: false },
      { id: "R-03", text: "系统应支持离线记录，并在恢复网络后上传。", level: "核心", state: "open", chapterId: "c-sync", source: "巡检需求摘录.txt", manual: false },
    ],
    chapters: [
      { id: "c-scope", title: "巡检范围", body: "本方案覆盖主城区在役桥梁的日常巡检路线、频次和记录字段。具体桥梁清单【待人工补充】。", status: "done" },
      { id: "c-sync", title: "离线与回传", body: "", status: "draft" },
      { id: "c-people", title: "人员与应急", body: "巡检班组配置和应急联络将在资质证明齐套后写入。当前【待人工补充】。", status: "draft" },
    ],
    quotes: [
      { id: "q-survey", name: "桥检终端部署", unit: "套", quantity: 2, unitPrice: 1000, taxRate: 6 },
    ],
  };
}

export function emptyProject(name) {
  const now = new Date().toISOString();
  return {
    id: `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim() || "未命名技术标",
    createdAt: now,
    updatedAt: now,
    approved: false,
    documents: [],
    requirements: [],
    chapters: [],
    quotes: [],
  };
}
