import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { quoteTotal, lineMoney } from "./money.js";
import { deliveryScore } from "./score.js";

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function safeName(name) {
  return String(name || "技术标").replace(/[\\/:*?"<>|]/g, "-");
}

export async function downloadBid(project, { draft = true } = {}) {
  const children = [
    new Paragraph({ text: project.name, heading: HeadingLevel.TITLE }),
    new Paragraph({
      children: [new TextRun(draft ? "审核稿。正式交付前仍需人工放行。" : "正式稿。由负责人确认后导出。")],
    }),
  ];
  for (const chapter of project.chapters ?? []) {
    children.push(new Paragraph({ text: chapter.title, heading: HeadingLevel.HEADING_1 }));
    const body = String(chapter.body ?? "").trim() || "（本章还没有正文）";
    for (const line of body.split(/\n/)) {
      children.push(new Paragraph({ children: [new TextRun(line || " ")] }));
    }
  }
  const blob = await Packer.toBlob(new Document({ sections: [{ children }] }));
  saveBlob(blob, `${safeName(project.name)}-${draft ? "审核稿" : "正式稿"}.docx`);
}

export async function downloadWorkbook(project) {
  const XLSX = await import("xlsx");
  const score = deliveryScore(project);
  const book = XLSX.utils.book_new();
  const requirements = (project.requirements ?? []).map((item) => ({
    编号: item.id,
    要求: item.text,
    级别: item.level,
    状态: item.state === "covered" ? "已响应" : item.state === "risk" ? "待补证据" : "未响应",
    章节: (project.chapters ?? []).find((chapter) => chapter.id === item.chapterId)?.title || "未分配",
    来源: item.source || "",
  }));
  const quotes = (project.quotes ?? []).map((line) => {
    const money = lineMoney(line);
    return { 名称: line.name, 单位: line.unit, 数量: line.quantity, 单价: line.unitPrice, 税率: line.taxRate, 不含税: money.net, 税额: money.tax, 含税: money.gross };
  });
  const totals = quoteTotal(project.quotes ?? []);
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(requirements.length ? requirements : [{ 说明: "还没有要求" }]), "要求矩阵");
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet([
    { 项目: "要求响应", 得分: score.parts.response, 权重: "40%" },
    { 项目: "证据完备", 得分: score.parts.evidence, 权重: "25%" },
    { 项目: "章节完成", 得分: score.parts.chapters, 权重: "25%" },
    { 项目: "人工放行", 得分: score.parts.review, 权重: "10%" },
    { 项目: "综合", 得分: score.score, 权重: score.grade },
  ]), "交付评分");
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(quotes.length ? [...quotes, { 名称: "合计", 含税: totals.gross }] : [{ 说明: "还没有报价" }]), "报价");
  XLSX.writeFile(book, `${safeName(project.name)}-工作簿.xlsx`);
}
