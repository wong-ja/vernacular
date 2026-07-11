import postgres from 'postgres';

let _sql: ReturnType<typeof postgres> | null = null;

function _ensure() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is required');
    _sql = postgres(url, { max: 5, idle_timeout: 30, connect_timeout: 10 });
  }
  return _sql;
}

export const sql = new Proxy(
  {} as ReturnType<typeof postgres>,
  {
    apply(_target, _thisArg, argArray: unknown[]) {
      return _ensure()(argArray[0] as TemplateStringsArray, ...argArray.slice(1));
    },
    get(_target, prop: string | symbol) {
      if (prop === 'then') return undefined;
      const s = _ensure();
      const v = (s as any)[prop];
      return typeof v === 'function' ? v.bind(s) : v;
    },
  },
);
