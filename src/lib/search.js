function clip(value) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > 72 ? `${text.slice(0, 72)}…` : text;
}

export function findInProject(project, query) {
  const needle = String(query ?? "").trim().toLowerCase();
  if (!needle || !project) return [];
  const hits = [];
  for (const item of project.requirements ?? []) {
    if (`${item.id} ${item.text} ${item.source}`.toLowerCase().includes(needle)) {
      hits.push({ kind: "requirement", id: item.id, title: `${item.id} 招标要求`, snippet: clip(item.text), step: "requirements" });
    }
  }
  for (const chapter of project.chapters ?? []) {
    if (`${chapter.title} ${chapter.body ?? ""}`.toLowerCase().includes(needle)) {
      hits.push({ kind: "chapter", id: chapter.id, title: chapter.title, snippet: clip(chapter.body || chapter.title), step: "writing", chapterId: chapter.id });
    }
  }
  for (const document of project.documents ?? []) {
    if (`${document.name} ${document.text ?? ""}`.toLowerCase().includes(needle)) {
      hits.push({ kind: "document", id: document.id, title: document.name, snippet: clip(document.text || document.name), step: "files" });
    }
  }
  return hits.slice(0, 30);
}
