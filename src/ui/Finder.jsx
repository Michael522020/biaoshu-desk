import { findInProject } from "../lib/search.js";

const KIND = { requirement: "要求", chapter: "章节", document: "资料" };

export function Finder({ project, query, onQuery, onOpen }) {
  const hits = findInProject(project, query);
  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="kicker">检索</p>
          <h1>{project ? project.name : "还没有打开项目"}</h1>
          <p className="lede">只在当前项目的要求、章节和资料正文里找，不会把关键词发给模型。</p>
        </div>
      </header>
      <input className="finder" aria-label="检索关键词" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="例如桥梁、R-02、离线" />
      <div className="list">
        {hits.map((hit) => (
          <button key={`${hit.kind}-${hit.id}`} type="button" className="hit" onClick={() => onOpen(hit)}>
            <span>{KIND[hit.kind]}</span>
            <strong>{hit.title}</strong>
            <small>{hit.snippet}</small>
          </button>
        ))}
        {project && query.trim() && !hits.length && <div className="empty">没有匹配「{query.trim()}」的内容。</div>}
        {!query.trim() && <div className="empty">输入关键词后会立刻列出结果。</div>}
      </div>
    </section>
  );
}
