import { expect, it } from 'vitest';
import { parseConfig } from '../../apps/api/src/config.js';

const settings = {
  APP_ORIGIN: 'http://localhost:5173/',
  MONGODB_URI: 'mongodb://127.0.0.1:27018/config_test',
  JWT_SECRET: 'config-test-secret-at-least-32-characters',
};

it('normalizes local origins and honors the runtime port', () => {
  expect(parseConfig(settings)).toMatchObject({ PORT: 3000, APP_ORIGIN: 'http://localhost:5173' });
  expect(parseConfig({ ...settings, PORT: '8080' }).PORT).toBe(8080);
});

it('requires HTTPS in production and rejects invalid origins', () => {
  expect(() => parseConfig({ ...settings, NODE_ENV: 'production' })).toThrow('HTTPS');
  expect(
    parseConfig({
      ...settings,
      NODE_ENV: 'production',
      APP_ORIGIN: 'https://demo.azurewebsites.net/',
    }).APP_ORIGIN,
  ).toBe('https://demo.azurewebsites.net');
  for (const APP_ORIGIN of [
    'ftp://example.com',
    'https://example.com/dashboard',
    'https://user:pass@example.com',
    'https://example.com?x=1',
  ]) {
    expect(() => parseConfig({ ...settings, APP_ORIGIN })).toThrow('APP_ORIGIN');
  }
});

it('rejects invalid settings without including secret values in errors', () => {
  expect(() => parseConfig({ ...settings, PORT: '70000', JWT_SECRET: 'private-value' })).toThrow(
    'PORT, JWT_SECRET',
  );
  expect(() => parseConfig({ ...settings, JWT_SECRET: 'private-value' })).not.toThrow(
    'private-value',
  );
});
