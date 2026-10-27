import { blankQuoteLine, lineMoney, quoteTotal } from "../lib/money.js";
import { Button, moneyText } from "./widgets.jsx";

export function Quote({ project, onChange }) {
  const total = quoteTotal(project.quotes);
  const update = (id, changes) => onChange((current) => ({
    ...current,
    quotes: current.quotes.map((line) => line.id === id ? { ...line, ...changes } : line),
  }));

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="kicker">报价</p>
          <h1>{project.name}</h1>
          <p className="lede">这里只算数量、单价和税率，不代替盖章报价文件。</p>
        </div>
        <Button tone="solid" onClick={() => onChange((current) => ({ ...current, quotes: [...current.quotes, blankQuoteLine()] }))}>添加一行</Button>
      </header>
      <div className="meters">
        <article><span>不含税</span><strong>{moneyText(total.net)}</strong></article>
        <article><span>税额</span><strong>{moneyText(total.tax)}</strong></article>
        <article><span>含税合计</span><strong>{moneyText(total.gross)}</strong></article>
        <article><span>条目</span><strong>{total.count}</strong></article>
      </div>
      <div className="quote">
        <div className="quote-head"><span>名称</span><span>单位</span><span>数量</span><span>单价</span><span>税率 %</span><span>含税</span><span /></div>
        {project.quotes.map((line) => (
          <div className="quote-line" key={line.id}>
            <input aria-label="名称" value={line.name} onChange={(event) => update(line.id, { name: event.target.value })} />
            <input aria-label="单位" value={line.unit} onChange={(event) => update(line.id, { unit: event.target.value })} />
            <input aria-label="数量" type="number" min="0" step="1" value={line.quantity} onChange={(event) => update(line.id, { quantity: Number(event.target.value) })} />
            <input aria-label="单价" type="number" min="0" step="0.01" value={line.unitPrice} onChange={(event) => update(line.id, { unitPrice: Number(event.target.value) })} />
            <input aria-label="税率" type="number" min="0" step="0.1" value={line.taxRate} onChange={(event) => update(line.id, { taxRate: Number(event.target.value) })} />
            <strong>{moneyText(lineMoney(line).gross)}</strong>
            <Button onClick={() => onChange((current) => ({ ...current, quotes: current.quotes.filter((item) => item.id !== line.id) }))}>删除</Button>
          </div>
        ))}
        {!project.quotes.length && <div className="empty">还没有报价行。</div>}
      </div>
    </section>
  );
}
