import { deliveryScore } from "../lib/score.js";
import { Button } from "./widgets.jsx";

export function Home({ projects, currentId, onOpen, onCreate, onSample, onDelete }) {
  const current = projects.find((item) => item.id === currentId) ?? projects[0] ?? null;
  const score = deliveryScore(current);

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="kicker">工作台</p>
          <h1>从一份标继续往下写</h1>
          <p className="lede">资料、要求和正文都留在这台浏览器里。模型只在你点“调用模型”时才会收到当前章节需要的摘录。</p>
        </div>
        <div className="row">
          <Button onClick={onSample}>打开示例</Button>
          <Button tone="solid" onClick={onCreate}>新建项目</Button>
        </div>
      </header>

      {!current ? (
        <div className="empty">
          <strong>还没有项目</strong>
          <span>新建一个空项目，或打开桥梁巡检示例，先看评分、报价和检索怎么串起来。</span>
        </div>
      ) : (
        <>
          <section className="hero">
            <div className={`ring grade-${score.grade}`} style={{ "--p": score.started ? score.score : 0 }} aria-hidden="true">
              <strong>{score.started ? score.score : "—"}</strong>
              <small>{score.started ? score.grade : "未开始"}</small>
            </div>
            <div>
              <p className="kicker">当前项目</p>
              <h2>{current.name}</h2>
              <p className="lede">{score.started ? `交付分 ${score.score}，等级 ${score.grade}。核心要求和证据补齐后，分数会跟着上升。` : "导入资料并整理要求后，这里开始计分。"}</p>
            </div>
          </section>
          <div className="meters">
            <article>
              <span>要求响应</span>
              <strong>{score.parts.response}%</strong>
              <small>{score.counts.covered}/{score.counts.total || 0} 条已响应</small>
              <i style={{ width: `${score.parts.response}%` }} />
            </article>
            <article>
              <span>证据完备</span>
              <strong>{score.parts.evidence}%</strong>
              <small>{score.counts.gaps} 条待补证据</small>
              <i style={{ width: `${score.parts.evidence}%` }} />
            </article>
            <article>
              <span>章节完成</span>
              <strong>{score.parts.chapters}%</strong>
              <small>{score.counts.written}/{score.counts.chapters} 节已有正文</small>
              <i style={{ width: `${score.parts.chapters}%` }} />
            </article>
            <article>
              <span>人工放行</span>
              <strong>{score.parts.review ? "已确认" : "待确认"}</strong>
              <small>{score.counts.approved ? "可以导出正式稿" : "审核页确认后计入"}</small>
              <i style={{ width: `${score.parts.review}%` }} />
            </article>
          </div>
          <section className="panel">
            <div className="panel-head"><h2>项目库</h2><span>{projects.length} 个</span></div>
            <div className="list">
              {projects.map((project) => (
                <article key={project.id} className="list-row">
                  <button type="button" className="grow" onClick={() => onOpen(project.id)}>
                    <b aria-hidden="true">{project.name.slice(0, 1)}</b>
                    <span>
                      <strong>{project.name}</strong>
                      <small>{project.requirements.length} 条要求 · {project.chapters.length} 个章节</small>
                    </span>
                  </button>
                  <Button onClick={() => onDelete(project.id)}>删除</Button>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </section>
  );
}
