import * as vscode from 'vscode';
import { TokenManager } from '../utils/secretStorage';
import { NetworksProvider, NetworkItem, SubnetItem } from '../providers/networksProvider';
import { HNetwork } from '../api/hetzner';
import { HetznerClient } from '../api/hetzner';
import { isValidCidr } from '../utils/network';

const NETWORK_ZONES = ['eu-central', 'us-east', 'us-west', 'ap-southeast'];

export function registerNetworkCommands(
  context: vscode.ExtensionContext,
  tokenManager: TokenManager,
  networksProvider: NetworksProvider
) {
  context.subscriptions.push(
    vscode.commands.registerCommand('hcloud.refreshNetworks', () => networksProvider.refresh())
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('hcloud.createNetwork', async () => {
      const client = await tokenManager.getActiveClient();
      if (!client) {
        vscode.window.showErrorMessage('No active Hetzner project.');
        return;
      }

      const name = await vscode.window.showInputBox({
        title: 'Create Network — Name',
        prompt: 'Enter a name for the private network',
        placeHolder: 'e.g. my-network',
        validateInput: (v) => (!v?.trim() ? 'Name cannot be empty' : undefined),
      });
      if (!name) return;

      const ipRange = await vscode.window.showInputBox({
        title: 'Create Network — IP Range',
        prompt: 'Enter the IP range in CIDR notation',
        placeHolder: 'e.g. 10.0.0.0/8',
        value: '10.0.0.0/8',
        validateInput: (v) => {
          if (!v?.trim()) return 'IP range cannot be empty';
          if (!isValidCidr(v.trim())) return 'Must be a valid CIDR range';
          return undefined;
        },
      });
      if (!ipRange) return;

      try {
        await vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: `Creating network "${name}"...` },
          () => client.createNetwork(name.trim(), ipRange.trim())
        );
        networksProvider.refresh();
        vscode.window.showInformationMessage(`Network "${name}" created.`);
      } catch (err: unknown) {
        vscode.window.showErrorMessage(`Failed to create network: ${err instanceof Error ? err.message : String(err)}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('hcloud.deleteNetwork', async (item: NetworkItem) => {
      const confirm = await vscode.window.showWarningMessage(
        `Delete network "${item.network.name}"?`,
        { modal: true },
        'Delete'
      );
      if (confirm !== 'Delete') return;

      const client = await tokenManager.getActiveClient();
      if (!client) {
        vscode.window.showErrorMessage('No active Hetzner project.');
        return;
      }
      try {
        await vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: `Deleting network "${item.network.name}"...` },
          () => client.deleteNetwork(item.network.id)
        );
        networksProvider.refresh();
        vscode.window.showInformationMessage(`Network "${item.network.name}" deleted.`);
      } catch (err: unknown) {
        vscode.window.showErrorMessage(`Failed to delete network: ${err instanceof Error ? err.message : String(err)}`);
      }
    })
  );


  // Shared subnet-creation flow (used by both add-subnet commands)
  const runAddSubnetFlow = async (client: HetznerClient, network: HNetwork) => {
    const ipRange = await vscode.window.showInputBox({
      title: `Add Subnet to "${network.name}"`,
      prompt: 'Enter subnet CIDR range (must be within the network range)',
      placeHolder: 'e.g. 10.0.1.0/24',
      validateInput: (v) => {
        if (!v?.trim()) return 'IP range cannot be empty';
        if (!isValidCidr(v.trim())) return 'Must be a valid CIDR range';
        return undefined;
      },
    });
    if (!ipRange) return;
    const zone = await vscode.window.showQuickPick(NETWORK_ZONES, {
      title: 'Network Zone',
      placeHolder: 'Select the network zone for this subnet',
    });
    if (!zone) return;
    try {
      await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: `Adding subnet ${ipRange}...` },
        () => client.addSubnet(network.id, ipRange.trim(), zone)
      );
      networksProvider.refresh();
      vscode.window.showInformationMessage(`Subnet ${ipRange} added to "${network.name}".`);
    } catch (err: unknown) {
      vscode.window.showErrorMessage(`Failed to add subnet: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Add Subnet — invoked from the Networks tree context menu (NetworkItem) or the
  // network detail panel ({ network }). Was contributed but unregistered before 0.5.0.
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'hcloud.addSubnet',
      async (item: NetworkItem | { network: HNetwork } | undefined) => {
        const client = await tokenManager.getActiveClient();
        if (!client) {
          vscode.window.showErrorMessage('No active Hetzner project.');
          return;
        }
        const network = item instanceof NetworkItem ? item.network : item?.network;
        if (!network) {
          // Fall back to the picker-based flow
          await vscode.commands.executeCommand('hcloud.addSubnetToNetwork');
          return;
        }
        await runAddSubnetFlow(client, network);
      }
    )
  );

  // Add Subnet to Network (with network picker)
  context.subscriptions.push(
    vscode.commands.registerCommand('hcloud.addSubnetToNetwork', async () => {
      const client = await tokenManager.getActiveClient();
      if (!client) {
        vscode.window.showErrorMessage('No active Hetzner project.');
        return;
      }
      let networks;
      try {
        networks = await client.getNetworks();
      } catch (err: unknown) {
        vscode.window.showErrorMessage(`Failed to fetch networks: ${err instanceof Error ? err.message : String(err)}`);
        return;
      }
      if (!networks.length) {
        vscode.window.showErrorMessage('No networks found.');
        return;
      }
      const selected = await vscode.window.showQuickPick(
        networks.map(n => ({ label: n.name, description: n.ip_range, network: n })),
        { title: 'Select Network to Add Subnet', placeHolder: 'Choose a network' }
      );
      if (!selected) return;
      await runAddSubnetFlow(client, selected.network);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('hcloud.deleteSubnet', async (item: SubnetItem) => {
      const confirm = await vscode.window.showWarningMessage(
        `Remove subnet ${item.subnet.ip_range} from network "${item.networkName}"?`,
        { modal: true },
        'Remove'
      );
      if (confirm !== 'Remove') return;

      const client = await tokenManager.getActiveClient();
      if (!client) return;

      try {
        await vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: `Removing subnet ${item.subnet.ip_range}...` },
          () => client.deleteSubnet(item.networkId, item.subnet.ip_range)
        );
        networksProvider.refresh();
      } catch (err: unknown) {
        vscode.window.showErrorMessage(`Failed to remove subnet: ${err instanceof Error ? err.message : String(err)}`);
      }
    })
  );
}
