import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export function activate(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('opentrustbench');
    const binPath = config.get<string>('executablePath', 'opentrustbench');

    async function runCommand(command: string, args: string[]) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        const target = await vscode.window.showInputBox({
            prompt: 'Enter path to scan',
            value: workspaceFolders[0].uri.fsPath,
        });
        if (!target) return;

        const terminal = vscode.window.createTerminal('OpenTrustBench');
        terminal.sendText(`${binPath} ${command} "${target}" ${args.join(' ')}`);
        terminal.show();
    }

    context.subscriptions.push(
        vscode.commands.registerCommand('opentrustbench.scan', () => runCommand('scan', [])),
        vscode.commands.registerCommand('opentrustbench.trust', () => runCommand('trust', [])),
        vscode.commands.registerCommand('opentrustbench.attack', () => runCommand('attack', [])),
    );
}

export function deactivate() {}
