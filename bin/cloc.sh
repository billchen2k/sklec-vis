# Count line of code in the project.

cloc --fullpath --not-match-d="(client/node_modules|client/dist|client/public|client/src/dataset|server/static|server/venv|.idea|.vscode)" \
 --not-match-f="(client/yarn\.lock|package\-lock\.json)" --by-file-by-lang .