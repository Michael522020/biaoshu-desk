export function uid(prefix) {
  const tail = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${tail}`;
}

export function stamp(project) {
  return { ...project, updatedAt: new Date().toISOString() };
}
