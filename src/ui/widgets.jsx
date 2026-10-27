export function Button({ tone = "ghost", children, ...props }) {
  return <button className={`btn ${tone}`} type="button" {...props}>{children}</button>;
}

export function moneyText(value) {
  return new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
}
