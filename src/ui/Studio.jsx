import { useState } from "react";
import { uid } from "../lib/ids.js";
import { readDocumentFile } from "../lib/files.js";
import { localDraft, streamChapter, chapterMessages, keyOptional } from "../lib/model.js";
import { extractRequirements, renumber } from "../lib/requirements.js";
import { releaseBlockers } from "../lib/score.js";
import { downloadBid, downloadWorkbook } from "../lib/exporters.js";
import { Button } from "./widgets.jsx";

const STEPS = [
  ["files", "资料"],
  ["requirements", "要求"],
  ["writing", "正文"],
  ["review", "审核"],
];

export function Studio({ project, settings, apiKey, step, chapterId, onStep, onChapter, onChange, notify }) {
  const [busy, setBusy] = useState("");
  const chapters = project.chapters ?? [];
  const active = chapters.find((item) => item.id === chapterId) ?? chapters[0] ?? null;

  const patch = (recipe) => onChange(recipe);

  const importFiles = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setBusy("正在读取文件");
    try {
      const documents = [];
      for (const file of files) documents.push({ id: uid("doc"), ...(await readDocumentFile(file)) });
      patch((current) => ({ ...current, documents: [...current.documents, ...documents] }));
      notify(`已读入 ${documents.length} 份资料`);
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy("");
    }
  };

  const pullRequirements = () => {
    patch((current) => {
      const extracted = extractRequirements(current.documents);
      const manual = current.requirements.filter((item) => item.manual);
      return { ...current, requirements: renumber([...extracted, ...manual]) };
    });
    onStep("requirements");
    notify("已按语句重新整理要求，手工添加的条目还在");
  };

  const addRequirement = () => {
    patch((current) => ({
      ...current,
      requirements: renumber([...current.requirements, { text: "请补充这条招标要求", level: "一般", state: "open", chapterId: "", source: "手工添加", manual: true }]),
    }));
  };

  const updateRequirement = (id, changes) => {
    patch((current) => ({
      ...current,
      requirements: current.requirements.map((item) => item.id === id ? { ...item, ...changes } : item),
    }));
  };

  const addChapter = () => {
    const chapter = { id: uid("ch"), title: "新章节", body: "", status: "draft" };
    patch((current) => ({ ...current, chapters: [...current.chapters, chapter] }));
    onChapter(chapter.id);
  };

  const updateChapter = (id, changes) => {
    patch((current) => ({
      ...current,
      chapters: current.chapters.map((item) => item.id === id ? { ...item, ...changes } : item),
    }));
  };

  const writeLocal = () => {
    if (!active) return;
    updateChapter(active.id, { body: localDraft(active, project), status: "draft" });
    notify("已写入本地提纲，事实缺口标了【待人工补充】");
  };

  const writeModel = async () => {
    if (!active) return;
    setBusy("模型正在写");
    let body = "";
    try {
      await streamChapter({
        settings,
        apiKey,
        messages: chapterMessages(active, project),
        onDelta: (delta) => {
          body += delta;
          updateChapter(active.id, { body, status: "draft" });
        },
      });
      notify("模型草稿已写入，请人工核对");
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy("");
    }
  };

  const blockers = releaseBlockers(project);

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="kicker">当前项目</p>
          <h1>{project.name}</h1>
        </div>
      </header>
      <div className="steps" role="tablist">
        {STEPS.map(([id, label], index) => (
          <button key={id} type="button" className={step === id ? "step on" : "step"} onClick={() => onStep(id)}><em>{index + 1}</em>{label}</button>
        ))}
      </div>

      {step === "files" && (
        <div className="stack">
          <div className="row">
            <label className="btn solid file">导入资料<input type="file" accept=".txt,.md,.docx,.xlsx,.xls,.pdf" multiple onChange={importFiles} /></label>
            <Button onClick={pullRequirements} disabled={!project.documents.length || Boolean(busy)}>整理成要求</Button>
          </div>
          {busy && <p className="hint">{busy}</p>}
          <div className="list">
            {project.documents.map((doc) => (
              <article key={doc.id} className="list-row">
                <div className="grow"><strong>{doc.name}</strong><small>{doc.text.length} 字</small></div>
                <Button onClick={() => patch((current) => ({ ...current, documents: current.documents.filter((item) => item.id !== doc.id) }))}>移除</Button>
              </article>
            ))}
            {!project.documents.length && <div className="empty">先放入招标文件或企业资料。支持 txt、md、docx、xlsx、pdf。</div>}
          </div>
        </div>
      )}

      {step === "requirements" && (
        <div className="stack">
          <div className="row"><Button tone="solid" onClick={addRequirement}>手工加一条</Button></div>
          <div className="matrix">
            {project.requirements.map((item) => (
              <article key={item.id} className="matrix-item">
                <strong>{item.id}</strong>
                <textarea aria-label={`${item.id} 正文`} value={item.text} onChange={(event) => updateRequirement(item.id, { text: event.target.value })} />
                <select aria-label={`${item.id} 级别`} value={item.level} onChange={(event) => updateRequirement(item.id, { level: event.target.value })}>
                  <option value="核心">核心</option>
                  <option value="一般">一般</option>
                </select>
                <select aria-label={`${item.id} 状态`} value={item.state} onChange={(event) => updateRequirement(item.id, { state: event.target.value })}>
                  <option value="open">未响应</option>
                  <option value="risk">待补证据</option>
                  <option value="covered">已响应</option>
                </select>
                <select aria-label={`${item.id} 章节`} value={item.chapterId} onChange={(event) => updateRequirement(item.id, { chapterId: event.target.value })}>
                  <option value="">未分配</option>
                  {chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.title}</option>)}
                </select>
                <Button onClick={() => patch((current) => ({ ...current, requirements: renumber(current.requirements.filter((row) => row.id !== item.id)) }))}>删除</Button>
              </article>
            ))}
            {!project.requirements.length && <div className="empty">还没有要求。回到资料页整理，或在这里手工添加。</div>}
          </div>
        </div>
      )}

      {step === "writing" && (
        <div className="writer">
          <aside>
            {chapters.map((chapter) => (
              <button key={chapter.id} type="button" className={active?.id === chapter.id ? "chapter on" : "chapter"} onClick={() => onChapter(chapter.id)}>
                <strong>{chapter.title}</strong>
                <small>{chapter.body?.trim() ? `${chapter.body.trim().length} 字` : "空"}</small>
              </button>
            ))}
            <Button onClick={addChapter}>添加章节</Button>
          </aside>
          {active ? (
            <div className="stack">
              <input aria-label="章节标题" value={active.title} onChange={(event) => updateChapter(active.id, { title: event.target.value })} />
              <textarea className="draft" aria-label="章节正文" value={active.body} onChange={(event) => updateChapter(active.id, { body: event.target.value })} />
              <div className="row">
                <Button onClick={writeLocal}>生成本地提纲</Button>
                <Button tone="solid" disabled={Boolean(busy) || !settings.endpoint || !settings.model || (!keyOptional(settings) && !apiKey)} onClick={writeModel}>{busy || "调用模型"}</Button>
                <Button onClick={() => updateChapter(active.id, { status: active.status === "done" ? "draft" : "done" })}>{active.status === "done" ? "标为草稿" : "标为完成"}</Button>
              </div>
            </div>
          ) : <div className="empty">先添加一个章节。</div>}
        </div>
      )}

      {step === "review" && (
        <div className="stack">
          <div className={blockers.length ? "banner warn" : "banner ok"}>{blockers.length ? `正式稿还有 ${blockers.length} 项没收口` : "可以导出正式稿"}</div>
          <ul className="blockers">
            {blockers.map((item) => <li key={item.id}><strong>{item.title}</strong><span>{item.detail}</span></li>)}
          </ul>
          <label className="check"><input type="checkbox" checked={project.approved} onChange={(event) => patch((current) => ({ ...current, approved: event.target.checked }))} />我已核对要求、证据和正文，允许导出正式稿</label>
          <div className="row">
            <Button onClick={() => downloadBid(project, { draft: true })}>导出审核稿</Button>
            <Button tone="solid" disabled={blockers.length > 0} onClick={() => downloadBid(project, { draft: false })}>导出正式 Word</Button>
            <Button onClick={() => downloadWorkbook(project)}>导出矩阵和报价</Button>
          </div>
        </div>
      )}
    </section>
  );
}
