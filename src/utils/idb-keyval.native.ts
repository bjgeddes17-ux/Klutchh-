// idb-keyval Native Stub
// This file replaces idb-keyval in Native builds to prevent crashes.

const store: Record<string, any> = {};

export async function get(key: string) {
  return store[key];
}

export async function set(key: string, value: any) {
  store[key] = value;
}

export async function del(key: string) {
  delete store[key];
}

export async function clear() {
  for (const key in store) {
    delete store[key];
  }
}

export async function keys() {
  return Object.keys(store);
}

export default { get, set, del, clear, keys };
