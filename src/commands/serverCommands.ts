import * as vscode from 'vscode';
import { TokenManager } from '../utils/secretStorage';
import { ServersProvider, ServerItem } from '../providers/serversProvider';
import { ServerWizardPanel } from '../webviews/serverWizard';
import { ServerDetailPanel } from '../webviews/serverDetail';
import { isValidIpAddress, ipv6HostFromPrefix } from '../utils/network';

export function registerServerCommands(
  context: vscode.ExtensionContext,
  tokenManager: TokenManager,
  serversProvider: ServersProvider
) {  // Refresh
  context.subscriptions.push(
    vscode.commands.registerCommand('hcloud.refreshServers', () => serversProvider.refresh())
  );

  // Start
  context.subscriptions.push(
    vscode.commands.registerCommand('hcloud.startServer', async (item: ServerItem) => {
      const client = await tokenManager.getActiveClient();
      if (!client) return;
      try {
        await vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: `Starting ${item.server.name}...` },
          () => client.powerOnServer(item.server.id)
        );
      } catch (err: unknown) {
        vscode.window.showErrorMessage(`Failed: ${err instanceof Error ? err.message : String(err)}`);
      }
      serversProvider.refresh();
    })
  );

  // Stop
  context.subscriptions.push(
    vscode.commands.registerCommand('hcloud.stopServer', async (item: ServerItem) => {
      const confirm = await vscode.window.showWarningMessage(
        `Stop server "${item.server.name}"?`,
        { modal: true },
        'Stop'
      );
      if (confirm !== 'Stop') return;

      const client = await tokenManager.getActiveClient();
      if (!client) return;
      try {
        await vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: `Stopping ${item.server.name}...` },
          () => client.powerOffServer(item.server.id)
        );
      } catch (err: unknown) {
        vscode.window.showErrorMessage(`Failed: ${err instanceof Error ? err.message : String(err)}`);
      }
      serversProvider.refresh();
    })
  );

  // Reboot
  context.subscriptions.push(
    vscode.commands.registerCommand('hcloud.rebootServer', async (item: ServerItem) => {
      const confirm = await vscode.window.showWarningMessage(
        `Reboot server "${item.server.name}"?`,
        { modal: true },
        'Reboot'
      );
      if (confirm !== 'Reboot') return;

      const client = await tokenManager.getActiveClient();
      if (!client) return;
      try {
        await vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: `Rebooting ${item.server.name}...` },
          () => client.rebootServer(item.server.id)
        );
      } catch (err: unknown) {
        vscode.window.showErrorMessage(`Failed: ${err instanceof Error ? err.message : String(err)}`);
      }
      serversProvider.refresh();
    })
  );

  // Delete
  context.subscriptions.push(
    vscode.commands.registerCommand('hcloud.deleteServer', async (item: ServerItem) => {
      const confirm = await vscode.window.showWarningMessage(
        `Permanently delete server "${item.server.name}"? This cannot be undone.`,
        { modal: true },
        'Delete'
      );
      if (confirm !== 'Delete') return;

      // Require user to type server name for confirmation (Hetzner UX pattern)
      const serverName = await vscode.window.showInputBox({
        prompt: `Type the server name "${item.server.name}" to confirm deletion`,
        validateInput: (input: string) => {
          if (input === item.server.name) return undefined;
          return 'Server name does not match. Deletion cancelled.';
        },
      });

      if (!serverName) return;

      const client = await tokenManager.getActiveClient();
      if (!client) return;
      try {
        await vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: `Deleting ${item.server.name}...` },
          () => client.deleteServer(item.server.id)
        );
      } catch (err: unknown) {
        vscode.window.showErrorMessage(`Failed: ${err instanceof Error ? err.message : String(err)}`);
      }
      serversProvider.refresh();
    })
  );

  // SSH
  context.subscriptions.push(
    vscode.commands.registerCommand('hcloud.sshServer', (item: ServerItem) => {
      // Hetzner reports IPv6 as a /64 prefix, not a host address — derive the ::1 host.
      const rawV6 = item.server.public_net.ipv6?.ip;
      const ip = item.server.public_net.ipv4?.ip ?? (rawV6 ? ipv6HostFromPrefix(rawV6) : undefined);
      if (!ip || !isValidIpAddress(ip)) {
        vscode.window.showErrorMessage('Server has no valid public IP address.');
        return;
      }
      const terminal = vscode.window.createTerminal(`SSH: ${item.server.name}`);
      terminal.sendText(`ssh root@${ip}`);
      terminal.show();
    })
  );

  // Create Server — opens WebView wizard
  context.subscriptions.push(
    vscode.commands.registerCommand('hcloud.createServer', async () => {
      await ServerWizardPanel.create(context, tokenManager, serversProvider);
    })
  );

  // Show Server Detail panel
  context.subscriptions.push(
    vscode.commands.registerCommand('hcloud.showServerDetail', async (item: ServerItem) => {
      const client = await tokenManager.getActiveClient();
      if (!client) return;
      ServerDetailPanel.open(context, item.server, client, serversProvider);
    })
  );
}

