import { PROFILES, profileById, keyOptional } from "../lib/model.js";
import { Button } from "./widgets.jsx";

export function Models({ settings, apiKey, onSettings, onKey, onSave }) {
  const apply = (id) => {
    const profile = profileById(id);
    onSettings({
      profileId: profile.id,
      endpoint: profile.id === "custom" ? settings.endpoint : profile.endpoint,
      model: profile.id === "custom" ? settings.model : profile.model,
      local: profile.local,
    });
  };
  const local = keyOptional({ ...settings, local: settings.local });

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="kicker">模型</p>
          <h1>接到兼容接口</h1>
          <p className="lede">地址和模型名保存在本机。密钥只留在这次浏览器会话里，不写进项目。</p>
        </div>
      </header>
      <section className="panel form-card">
        <div className="chips">
          {PROFILES.map((profile) => (
            <button key={profile.id} type="button" className={settings.profileId === profile.id ? "chip on" : "chip"} onClick={() => apply(profile.id)}>{profile.label}</button>
          ))}
        </div>
        <p className="hint">{profileById(settings.profileId).note}</p>
        <label>服务地址<input value={settings.endpoint} onChange={(event) => onSettings({ ...settings, endpoint: event.target.value, profileId: "custom", local: false })} placeholder="https://example.com/v1" /></label>
        <div className="split">
          <label>模型名称<input value={settings.model} onChange={(event) => onSettings({ ...settings, model: event.target.value })} placeholder="模型名" /></label>
          <label>{local ? "API 密钥（本机可留空）" : "API 密钥"}<input type="password" value={apiKey} autoComplete="off" onChange={(event) => onKey(event.target.value)} placeholder={local ? "Ollama 通常不需要" : "只保存在本次会话"} /></label>
        </div>
        <div className="row"><Button tone="solid" onClick={onSave}>保存地址和模型名</Button></div>
      </section>
    </section>
  );
}
