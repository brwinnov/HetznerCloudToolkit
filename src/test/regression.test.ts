import * as assert from 'assert';
import type { SecretStorage } from 'vscode';
import { suite, test } from 'mocha';

import { TokenManager } from '../utils/secretStorage';
import { isValidIpAddress } from '../utils/network';
import { generateNonce } from '../utils/nonce';

class MockSecretStorage {
  private readonly storeMap = new Map<string, string>();

  async get(key: string): Promise<string | undefined> {
    return this.storeMap.get(key);
  }

  async store(key: string, value: string): Promise<void> {
    this.storeMap.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.storeMap.delete(key);
  }
}

function createTokenManager(mock?: MockSecretStorage): { manager: TokenManager; storage: MockSecretStorage } {
  const storage = mock ?? new MockSecretStorage();
  const manager = new TokenManager(storage as unknown as SecretStorage);
  return { manager, storage };
}

suite('Regression tests', () => {
  suite('TokenManager project index parsing', () => {
    test('addToIndex/listProjects round-trips a normal project name', async () => {
      const { manager } = createTokenManager();
      await manager.addToIndex('production');
      const projects = await manager.listProjects();

      assert.deepStrictEqual(projects, ['production']);
    });

    test('legacy CSV index is parsed via fallback path', async () => {
      const storage = new MockSecretStorage();
      await storage.store('hcloud.projectIndex', 'prod,staging');

      const { manager } = createTokenManager(storage);
      const projects = await manager.listProjects();

      assert.deepStrictEqual(projects, ['prod', 'staging']);
    });

    test('addToIndex with unusual characters does not corrupt project list', async () => {
      const { manager } = createTokenManager();
      const unusualName = "ops🚀 team/[blue]#1,edge";

      await manager.addToIndex(unusualName);
      const projects = await manager.listProjects();

      assert.strictEqual(projects.length, 1);
      assert.strictEqual(projects[0], unusualName);
    });
  });

  suite('IP address validation', () => {
    test('accepts valid IPv4 and IPv6 addresses', () => {
      assert.strictEqual(isValidIpAddress('5.9.23.1'), true);
      assert.strictEqual(isValidIpAddress('2a01:4f8::1'), true);
    });

    test('rejects invalid or dangerous strings', () => {
      assert.strictEqual(isValidIpAddress('999.1.1.1'), false);
      assert.strictEqual(isValidIpAddress(''), false);
      assert.strictEqual(isValidIpAddress("'; rm -rf ~ #"), false);
    });
  });

  suite('Nonce helper output', () => {
    test('returns non-empty base64 output and changes per call', () => {
      const nonceA = generateNonce();
      const nonceB = generateNonce();

      assert.ok(nonceA.length > 0);
      assert.ok(nonceB.length > 0);
      assert.notStrictEqual(nonceA, nonceB);
      assert.match(nonceA, /^[A-Za-z0-9+/]+=*$/);
      assert.match(nonceB, /^[A-Za-z0-9+/]+=*$/);
    });
  });
});
