// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { spawn } = require('child_process');

let lastAuthor = '';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {


	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	 vscode.commands.registerCommand('blameit.gitblame', () => {
    // Placeholder function for the command
    // You can add any specific logic you want to execute when the command is triggered
    vscode.window.showInformationMessage('Git Blame command is triggered!');
  });
let disposable = vscode.window.onDidChangeTextEditorSelection((event) => {
    const { activeTextEditor } = vscode.window;

    if (activeTextEditor && activeTextEditor === event.textEditor) {
      const { document, selection } = activeTextEditor;
      const lineNumber = selection.active.line + 1;

      const gitCommand = 'git';
      const gitArgs = ['blame', `${document.fileName}`, `-L${lineNumber},${lineNumber}`];

      const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
      const workspacePath = workspaceFolder ? workspaceFolder.uri.fsPath : undefined;

      if (!workspacePath) {
        vscode.window.showErrorMessage('No workspace folder found.');
        return;
      }

      const gitProcess = spawn(gitCommand, gitArgs, { cwd: workspacePath });

      gitProcess.stdout.on('data', (data) => {
        const blameData = data.toString().trim();
        if (blameData) {
          const regex = /^\S+\s\((\S+)/;
          const match = regex.exec(blameData);
          if (match && match[1]) {
            lastAuthor = match[1].trim();
            vscode.window.showInformationMessage(`Last Update by: ${lastAuthor}`);
          } else {
            vscode.window.showWarningMessage('Unable to extract author name.');
          }
        } else {
          vscode.window.showWarningMessage('No blame data available for the current line.');
        }
      });

      gitProcess.stderr.on('data', (data) => {
        vscode.window.showErrorMessage(data.toString());
      });

      gitProcess.on('error', (error) => {
        vscode.window.showErrorMessage(`Failed to execute Git command: ${error.message}`);
      });

      gitProcess.on('exit', (code) => {
        if (code !== 0) {
          vscode.window.showErrorMessage(`Git command exited with code ${code}.`);
        }
      });
    }
  });

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
