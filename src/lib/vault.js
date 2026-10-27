const DB_NAME = "biaoshu-desk";
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("projects")) db.createObjectStore("projects", { keyPath: "id" });
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadProjects() {
  const db = await openDb();
  const rows = await requestToPromise(db.transaction("projects").objectStore("projects").getAll());
  db.close();
  return rows.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export async function saveProject(project) {
  const db = await openDb();
  await requestToPromise(db.transaction("projects", "readwrite").objectStore("projects").put(project));
  db.close();
}

export async function removeProject(id) {
  const db = await openDb();
  await requestToPromise(db.transaction("projects", "readwrite").objectStore("projects").delete(id));
  db.close();
}

export async function loadSettings() {
  const db = await openDb();
  const value = await requestToPromise(db.transaction("meta").objectStore("meta").get("model"));
  db.close();
  return value ?? { profileId: "custom", endpoint: "", model: "", local: false };
}

export async function saveSettings(settings) {
  const db = await openDb();
  await requestToPromise(db.transaction("meta", "readwrite").objectStore("meta").put(settings, "model"));
  db.close();
}
