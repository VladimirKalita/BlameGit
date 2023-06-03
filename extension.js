const vscode = require('vscode');
const { spawn } = require('child_process');

let lastAuthor = '';

function activate(context) {
	
	//This command will be triggered when the user invokes it from the command palette or any other defined keybinding.
	// Currently, it only shows an information message when triggered.
	vscode.commands.registerCommand('blameit.gitblame', () => {
		vscode.window.showInformationMessage('Git Blame command is triggered!');
	  });

	//This decoration type is used to add a visual indicator to the editor, specifically after each line of code that is blamed.
	const decorationType = vscode.window.createTextEditorDecorationType({
		after: {
		  contentText: ' ',
		  margin: '0 0 0 2em',
		  width: 'fit-content',
		  textDecoration: 'none; font-size: 0.8em; opacity: 0.6'
		}
	  });
	//This is set up to track changes in the text editor's selection. Whenever the selection changes, the event handler is executed.
	let disposable = vscode.window.onDidChangeTextEditorSelection((event) => {
		const { activeTextEditor } = vscode.window;
		//it checks if there is an active text editor and if the active text editor is the one where the selection change occurred.
		if (activeTextEditor && activeTextEditor === event.textEditor) {
		  
		  const { document, selection } = activeTextEditor;
		  const lineNumber = selection.active.line + 1;
		  //Defining how the git blame command will be executed
		  const gitCommand = 'git';
		  const gitArgs = ['blame', `${document.fileName}`, `-L${lineNumber},${lineNumber}`];
		  //It retrieves the workspace folder associated with the document and its path.
		  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
		  const workspacePath = workspaceFolder ? workspaceFolder.uri.fsPath : undefined;
		  //If the workspace path is not available, it displays an error message and returns.
		  if (!workspacePath) {
			vscode.window.showErrorMessage('No workspace folder found.');
			return;
		  }
		  //The gitProcess is spawned with the Git command and arguments, setting the current working directory to the workspace path.
		  const gitProcess = spawn(gitCommand, gitArgs, { cwd: workspacePath });
		  //This captures the output from the Git command's stdout.
		  gitProcess.stdout.on('data', (data) => {
			const blameData = data.toString().trim();//
			// console.log(blameData);
			if (blameData) {
			  const regex = /^\S+\s\((\S+)/;//The regular expression which will parse the stdout.
			  const match = regex.exec(blameData);//The output is parsed to extract the author's name using a regular expression. 
			//   console.log(match);
			  if (match && match[1]) {
				lastAuthor = match[1].trim();
				const range = document.lineAt(lineNumber - 1).range;
				//creates a decoration object using the retrieved author's name and the line range where the blame was performed.
				const decoration = {
				  range,
				  renderOptions: {
					after: { contentText: `by ${lastAuthor}` }
				  }
				};
				activeTextEditor.setDecorations(decorationType, [decoration]);//The decoration is applied to the active text editor.
			  } else {
				vscode.window.showWarningMessage('Unable to extract author name.');
			  }
			} else {
			  vscode.window.showWarningMessage('No blame data available for the current line.');
			}
		  });
		  // captures any errors from the Git command's stderr and displays them as error messages.
		  gitProcess.stderr.on('data', (data) => {
			vscode.window.showErrorMessage(data.toString());
		  });
		  // handles any errors that occur while executing the Git command and displays an error message.
		  gitProcess.on('error', (error) => {
			vscode.window.showErrorMessage(`Failed to execute Git command: ${error.message}`);
		  });
		  //is triggered when the Git command process exits. If the process exits with a non-zero code, it displays an error message.
		  gitProcess.on('exit', (code) => {
			if (code !== 0) {
			  vscode.window.showErrorMessage(`Git command exited with code ${code}.`);
			}
		  });
		}
	  });
	
	  context.subscriptions.push(disposable);//This is used to add the event listener disposable to the list of subscriptions in the extension's context.
	  context.subscriptions.push(decorationType);// is used to add the event listener decorationType to the list of subscriptions in the extension's context.
  
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
