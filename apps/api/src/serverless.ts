import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';

// Reused across warm invocations of the same Lambda instance so we only
// pay the Nest bootstrap cost on a cold start. Vercel's Node runtime calls
// the default export with the same (req, res) shape Node's http server
// uses, which is exactly what an Express app instance already accepts as
// a request handler - no Lambda-event adapter needed.
let cachedApp: express.Express | undefined;

async function bootstrapServerless(): Promise<express.Express> {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  configureApp(app);
  await app.init();
  return expressApp;
}

export default async function handler(req: unknown, res: unknown) {
  if (!cachedApp) {
    cachedApp = await bootstrapServerless();
  }
  return (cachedApp as unknown as (req: unknown, res: unknown) => unknown)(req, res);
}
