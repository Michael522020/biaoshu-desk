const SIGNAL = /(必须|不得|应当|应该|需要|应|提供|支持|具备|不少于|负责)/;

export function extractRequirements(documents = []) {
  const found = [];
  for (const document of documents) {
    for (const raw of String(document.text ?? "").split(/\n+/)) {
      const text = raw.replace(/^[\s\d.、()（）\-—]+/, "").trim();
      if (text.length < 8 || text.length > 160) continue;
      if (!SIGNAL.test(text)) continue;
      found.push({
        text,
        level: /必须|不得/.test(text) ? "核心" : "一般",
        state: "open",
        chapterId: "",
        source: document.name,
        manual: false,
      });
    }
  }
  return found.slice(0, 60).map((item, index) => ({
    ...item,
    id: `R-${String(index + 1).padStart(2, "0")}`,
  }));
}

export function renumber(requirements) {
  return requirements.map((item, index) => ({
    ...item,
    id: `R-${String(index + 1).padStart(2, "0")}`,
  }));
}
