import * as assert from 'assert';
import type { SecretStorage } from 'vscode';
import { suite, test } from 'mocha';

import { TokenManager } from '../utils/secretStorage';
import { isValidIpAddress, isValidCidr, ipv6HostFromPrefix } from '../utils/network';
import { generateNonce } from '../utils/nonce';
import { ServerItem } from '../providers/serversProvider';
import type { HServer } from '../api/hetzner';

function makeServer(overrides: Partial<HServer> = {}): HServer {
  return {
    id: 1,
    name: 'test-server',
    status: 'running',
    public_net: { ipv4: { ip: '1.2.3.4' }, ipv6: null },
    server_type: { name: 'cx22', cores: 2, memory: 4, disk: 40 },
    datacenter: { name: 'fsn1-dc14', location: { name: 'fsn1', city: 'Falkenstein' } },
    image: null,
    created: '2026-01-01T00:00:00Z',
    labels: {},
    ...overrides,
  };
}

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

  suite('CIDR validation', () => {
    test('accepts valid IPv4 and IPv6 CIDR ranges', () => {
      assert.strictEqual(isValidCidr('0.0.0.0/0'), true);
      assert.strictEqual(isValidCidr('10.0.0.0/8'), true);
      assert.strictEqual(isValidCidr('192.168.1.0/24'), true);
      assert.strictEqual(isValidCidr('::/0'), true);
      assert.strictEqual(isValidCidr('2a01:4f8::/32'), true);
    });

    test('rejects invalid CIDR strings that passed the old regex', () => {
      assert.strictEqual(isValidCidr('abc'), false);
      assert.strictEqual(isValidCidr('face'), false);
      assert.strictEqual(isValidCidr('1.2.3.4/999'), false);
      assert.strictEqual(isValidCidr('999.999.999.999/0'), false);
      assert.strictEqual(isValidCidr('1.2.3.4/33'), false);
      assert.strictEqual(isValidCidr('::/129'), false);
      assert.strictEqual(isValidCidr('1.2.3.4'), false);
      assert.strictEqual(isValidCidr(''), false);
    });
  });

  suite('IPv6 host derivation from Hetzner /64 prefix', () => {
    test('derives ::1 host from a /64 prefix', () => {
      assert.strictEqual(ipv6HostFromPrefix('2a01:4f8:1:2::/64'), '2a01:4f8:1:2::1');
    });

    test('passes through an existing host address', () => {
      assert.strictEqual(ipv6HostFromPrefix('2a01:4f8::1'), '2a01:4f8::1');
    });

    test('returns undefined for garbage', () => {
      assert.strictEqual(ipv6HostFromPrefix('not-an-ip/64'), undefined);
      assert.strictEqual(ipv6HostFromPrefix(''), undefined);
      assert.strictEqual(ipv6HostFromPrefix('1.2.3.4/24'), undefined);
    });
  });

  suite('IP validation (net.isIP-backed)', () => {
    test('fixes old IPv6 edge cases', () => {
      assert.strictEqual(isValidIpAddress('1::2::3'), false);      // old validator accepted this
      assert.strictEqual(isValidIpAddress('::ffff:192.0.2.1'), true); // old validator rejected this
      assert.strictEqual(isValidIpAddress('::1'), true);
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

  suite('ServerItem resilience to missing datacenter/server_type (#6)', () => {
    test('renders normally when both fields are present', () => {
      const item = new ServerItem(makeServer());
      assert.match(item.description as string, /fsn1/);
    });

    test('falls back instead of throwing when datacenter is absent', () => {
      assert.doesNotThrow(() => new ServerItem(makeServer({ datacenter: undefined })));
      const item = new ServerItem(makeServer({ datacenter: undefined }));
      assert.match(item.description as string, /unknown location/);
    });

    test('falls back instead of throwing when server_type is absent', () => {
      assert.doesNotThrow(() => new ServerItem(makeServer({ server_type: undefined })));
      const item = new ServerItem(makeServer({ server_type: undefined }));
      assert.match(item.description as string, /unknown type/);
    });
  });
});
