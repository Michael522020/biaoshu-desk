export function deliveryScore(project) {
  const requirements = project?.requirements ?? [];
  const chapters = project?.chapters ?? [];
  const total = requirements.length;
  const covered = requirements.filter((item) => item.state === "covered").length;
  const gaps = requirements.filter((item) => item.state === "risk").length;
  const written = chapters.filter((item) => String(item.body ?? "").trim()).length;
  const started = total > 0 || chapters.length > 0;
  const parts = {
    response: total ? Math.round((covered / total) * 100) : 0,
    evidence: total ? Math.round(((total - gaps) / total) * 100) : 0,
    chapters: chapters.length ? Math.round((written / chapters.length) * 100) : 0,
    review: project?.approved ? 100 : 0,
  };
  const score = started
    ? Math.round(parts.response * 0.4 + parts.evidence * 0.25 + parts.chapters * 0.25 + parts.review * 0.1)
    : 0;
  let grade = "—";
  if (started) grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : "D";
  return {
    score,
    grade,
    started,
    parts,
    counts: { total, covered, gaps, chapters: chapters.length, written, approved: Boolean(project?.approved) },
  };
}

export function releaseBlockers(project) {
  const requirements = project?.requirements ?? [];
  const chapters = project?.chapters ?? [];
  const blockers = [];
  const core = requirements.filter((item) => item.level === "核心" && item.state !== "covered");
  const gaps = requirements.filter((item) => item.state === "risk");
  const blank = chapters.filter((item) => !String(item.body ?? "").trim());
  if (core.length) blockers.push({ id: "core", title: "核心要求未响应", detail: `${core.length} 条核心要求还没有标成已响应` });
  if (gaps.length) blockers.push({ id: "evidence", title: "证据还没补上", detail: `${gaps.length} 条要求仍待补证据` });
  if (!chapters.length || blank.length) {
    blockers.push({ id: "chapters", title: "正文还没写完", detail: chapters.length ? `${blank.length} 个章节没有正文` : "还没有章节" });
  }
  if (!project?.approved) blockers.push({ id: "review", title: "尚未人工放行", detail: "负责人需要在审核页确认后才能导出正式稿" });
  return blockers;
}
