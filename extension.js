const vscode = require('vscode');
const { spawn } = require('child_process');

let lastAuthor = '';

function activate(context) {
	vscode.commands.registerCommand('blameit.gitblame', () => {
		// Placeholder function for the command
		// You can add any specific logic you want to execute when the command is triggered
		vscode.window.showInformationMessage('Git Blame command is triggered!');
	  });


	const decorationType = vscode.window.createTextEditorDecorationType({
		after: {
		  contentText: ' ',
		  margin: '0 0 0 2em',
		  width: 'fit-content',
		  textDecoration: 'none; font-size: 0.8em; opacity: 0.6'
		}
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
			console.log(blameData);
			if (blameData) {
			  const regex = /^\S+\s\((\S+)/;
			  const match = regex.exec(blameData);
			  console.log(match);
			  if (match && match[1]) {
				lastAuthor = match[1].trim();
				const range = document.lineAt(lineNumber - 1).range;
				const decoration = {
				  range,
				  renderOptions: {
					after: { contentText: `by ${lastAuthor}` }
				  }
				};
				activeTextEditor.setDecorations(decorationType, [decoration]);
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
	  context.subscriptions.push(decorationType);
  
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
