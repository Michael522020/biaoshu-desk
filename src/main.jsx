import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { stamp } from "./lib/ids.js";
import { emptyProject, sampleProject } from "./lib/sample.js";
import { loadProjects, loadSettings, removeProject, saveProject, saveSettings } from "./lib/vault.js";
import { Finder } from "./ui/Finder.jsx";
import { Home } from "./ui/Home.jsx";
import { Models } from "./ui/Models.jsx";
import { Quote } from "./ui/Quote.jsx";
import { Studio } from "./ui/Studio.jsx";
import { Button } from "./ui/widgets.jsx";
import "./styles.css";

const KEY = "biaoshu-session-key";
const NAV = [
  ["home", "工作台"],
  ["studio", "项目"],
  ["quote", "报价"],
  ["finder", "检索"],
  ["models", "模型"],
];

function App() {
  const [projects, setProjects] = useState([]);
  const [currentId, setCurrentId] = useState("");
  const [view, setView] = useState("home");
  const [step, setStep] = useState("files");
  const [chapterId, setChapterId] = useState("");
  const [query, setQuery] = useState("");
  const [settings, setSettings] = useState({ profileId: "custom", endpoint: "", model: "", local: false });
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem(KEY) ?? "");
  const [toast, setToast] = useState("");
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const timers = useRef(new Map());
  const project = projects.find((item) => item.id === currentId) ?? null;

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  useEffect(() => {
    let cancel = false;
    Promise.all([loadProjects(), loadSettings()]).then(([rows, stored]) => {
      if (cancel) return;
      setProjects(rows);
      setSettings(stored);
      if (rows[0]) setCurrentId(rows[0].id);
    }).catch((error) => notify(error.message));
    return () => { cancel = true; };
  }, []);

  const remember = (next) => {
    const saved = stamp(next);
    window.clearTimeout(timers.current.get(saved.id));
    timers.current.set(saved.id, window.setTimeout(() => saveProject(saved).catch((error) => notify(error.message)), 250));
    setProjects((list) => {
      const exists = list.some((item) => item.id === saved.id);
      const nextList = exists ? list.map((item) => item.id === saved.id ? saved : item) : [saved, ...list];
      return nextList.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    });
    setCurrentId(saved.id);
    return saved;
  };

  const changeProject = (recipe) => {
    if (!project) return;
    remember(recipe(project));
  };

  const openProject = (id, nextStep = "files", nextChapter = "") => {
    setCurrentId(id);
    setStep(nextStep);
    if (nextChapter) setChapterId(nextChapter);
    setView(nextStep === "files" && !nextChapter ? "studio" : "studio");
  };

  const create = (event) => {
    event.preventDefault();
    const created = emptyProject(draftName);
    remember(created);
    setCreating(false);
    setDraftName("");
    setStep("files");
    setView("studio");
    notify(`已建立「${created.name}」`);
  };

  const openSample = () => {
    remember(sampleProject());
    setChapterId("c-scope");
    setStep("files");
    setView("home");
    notify("已放入桥梁巡检示例");
  };

  const deleteCurrent = async (id) => {
    if (!window.confirm("删除后不能从本机项目库恢复。继续吗？")) return;
    await removeProject(id);
    setProjects((list) => list.filter((item) => item.id !== id));
    if (currentId === id) {
      setCurrentId("");
      setView("home");
    }
  };

  return (
    <div className="desk">
      <aside className="rail">
        <button type="button" className="brand" onClick={() => setView("home")}>
          <span className="mark">枢</span>
          <span><strong>标枢</strong><small>技术标工作台</small></span>
        </button>
        <nav>
          {NAV.map(([id, label]) => (
            <button key={id} type="button" className={view === id ? "nav on" : "nav"} onClick={() => setView(id)}><i />{label}</button>
          ))}
        </nav>
        <p className="rail-note">{project ? project.name : "还没有打开的项目"}<br />资料只留在这台浏览器里。</p>
      </aside>
      <main>
        {view === "home" && <Home projects={projects} currentId={currentId} onOpen={(id) => openProject(id)} onCreate={() => setCreating(true)} onSample={openSample} onDelete={deleteCurrent} />}
        {view === "studio" && (project ? <Studio project={project} settings={settings} apiKey={apiKey} step={step} chapterId={chapterId} onStep={setStep} onChapter={setChapterId} onChange={changeProject} notify={notify} /> : <NeedProject onCreate={() => setCreating(true)} />)}
        {view === "quote" && (project ? <Quote project={project} onChange={changeProject} /> : <NeedProject onCreate={() => setCreating(true)} />)}
        {view === "finder" && <Finder project={project} query={query} onQuery={setQuery} onOpen={(hit) => openProject(project.id, hit.step, hit.chapterId || "")} />}
        {view === "models" && (
          <Models
            settings={settings}
            apiKey={apiKey}
            onSettings={setSettings}
            onKey={(value) => { setApiKey(value); sessionStorage.setItem(KEY, value); }}
            onSave={() => saveSettings(settings).then(() => notify("模型地址已保存")).catch((error) => notify(error.message))}
          />
        )}
      </main>
      {creating && (
        <div className="mask">
          <form className="dialog" onSubmit={create}>
            <h2>新建技术标</h2>
            <label>项目名称<input value={draftName} onChange={(event) => setDraftName(event.target.value)} autoFocus placeholder="例如园区能耗监测" /></label>
            <div className="row">
              <Button onClick={() => setCreating(false)}>取消</Button>
              <Button tone="solid" type="submit">创建</Button>
            </div>
          </form>
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function NeedProject({ onCreate }) {
  return <section className="page"><div className="empty"><strong>先建立一个项目</strong><Button tone="solid" onClick={onCreate}>新建项目</Button></div></section>;
}

createRoot(document.getElementById("root")).render(<App />);
