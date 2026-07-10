import { buildApp } from '../src/app.js';

let app: Awaited<ReturnType<typeof buildApp>>;
let appReady: Promise<void> | null = null;

export default async function handler(req: any, res: any) {
  if (!app) {
    app = buildApp();
    appReady = app.ready();
    await appReady;
  } else if (appReady) {
    await appReady;
    appReady = null;
  }
  app.server.emit('request', req, res);
}
