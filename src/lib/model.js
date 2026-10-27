export function localDraft(chapter, project) {
  const related = (project.requirements ?? []).filter((item) => !item.chapterId || item.chapterId === chapter.id);
  const lines = related.length
    ? related.map((item) => `关于「${item.text}」：资料「${item.source || "未标注来源"}」还不足以写成确定承诺，此处记为【待人工补充】。`)
    : ["本章尚未关联招标要求，正文记为【待人工补充】。"];
  return [`${chapter.title}`, "", ...lines, "", "此稿由本地提纲整理，没有调用外部模型。"].join("\n");
}

export const PROFILES = [
  { id: "custom", label: "自定义", endpoint: "", model: "", local: false, note: "填写 Chat Completions 兼容地址" },
  { id: "deepseek", label: "DeepSeek", endpoint: "https://api.deepseek.com/v1", model: "deepseek-chat", local: false, note: "需要 API 密钥" },
  { id: "silicon", label: "硅基流动", endpoint: "https://api.siliconflow.cn/v1", model: "Qwen/Qwen2.5-32B-Instruct", local: false, note: "需要 API 密钥" },
  { id: "ollama", label: "本机 Ollama", endpoint: "http://127.0.0.1:11434/v1", model: "qwen2.5:7b", local: true, note: "本机服务通常不需要密钥" },
  { id: "openai", label: "OpenAI", endpoint: "https://api.openai.com/v1", model: "gpt-4.1-mini", local: false, note: "需要 API 密钥" },
];

export function profileById(id) {
  return PROFILES.find((item) => item.id === id) ?? PROFILES[0];
}

export function keyOptional(settings = {}) {
  if (settings.local) return true;
  return /localhost|127\.0\.0\.1|\[::1\]/i.test(String(settings.endpoint ?? ""));
}

function completionUrl(endpoint) {
  const normalized = String(endpoint ?? "").trim().replace(/\/+$/, "");
  if (!normalized) throw new Error("先填写模型地址");
  return normalized.endsWith("/chat/completions") ? normalized : `${normalized}/chat/completions`;
}

export function chapterMessages(chapter, project) {
  const related = (project.requirements ?? []).filter((item) => !item.chapterId || item.chapterId === chapter.id);
  const evidence = (project.documents ?? []).map((doc) => `【${doc.name}】\n${doc.text}`).join("\n\n").slice(0, 8000);
  return [
    {
      role: "system",
      content: "你是技术标起草助手。只使用用户给出的资料。没有依据的资质、案例、数字和承诺必须写成【待人工补充】。用简体中文分段输出，不要 Markdown。",
    },
    {
      role: "user",
      content: `章节：${chapter.title}\n\n要回应的要求：\n${related.map((item) => `- ${item.id} ${item.text}（${item.source}）`).join("\n") || "无"}\n\n资料摘录：\n${evidence || "无"}`,
    },
  ];
}

export async function streamChapter({ settings, apiKey, messages, onDelta }) {
  if (!settings.model?.trim()) throw new Error("先填写模型名称");
  if (!keyOptional(settings) && !apiKey?.trim()) throw new Error("这个接口需要 API 密钥");
  const headers = { "Content-Type": "application/json" };
  if (apiKey?.trim()) headers.Authorization = `Bearer ${apiKey.trim()}`;
  const response = await fetch(completionUrl(settings.endpoint), {
    method: "POST",
    headers,
    body: JSON.stringify({ model: settings.model.trim(), messages, temperature: 0.2, stream: true }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error?.message || `模型服务返回 HTTP ${response.status}`);
  }
  if (!response.body) throw new Error("模型服务没有返回可读取的流");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split(/\r?\n/);
    buffer = done ? "" : lines.pop();
    for (const line of lines) {
      const source = line.trim();
      if (!source.startsWith("data:")) continue;
      const data = source.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      let payload;
      try { payload = JSON.parse(data); } catch { continue; }
      const delta = payload?.choices?.[0]?.delta?.content ?? "";
      if (delta) {
        text += delta;
        onDelta?.(delta);
      }
    }
    if (done) break;
  }
  if (!text.trim()) throw new Error("模型没有返回正文");
  return text.trim();
}
