# Pint language server  
## Introduction
This repo is a language server for the pint programming language.

#### More about pint
[PINT book](https://docs.essential.builders/protocol-overview/pint?q=)

## Development using VSCode
1. `pnpm i`
2. `cargo build`
3. Open the project in VSCode: `code .`
4. In VSCode, press <kbd>F5</kbd> or change to the Debug panel and click <kbd>Launch Client</kbd>.
5. In the newly launched VSCode instance, open the file `examples/test.nrs` from this project.
6. If the LSP is working correctly you should see syntax highlighting and the features described below should work.
## Demo
TBA

### @ASSERT-KTH devcon team
- @javierron
- @Mokita-j
- @sofiabobadilla
- @Stamp9

> **Note**  
> 
> If encountered errors like `Cannot find module '/xxx/xxx/dist/extension.js'`
> please try run command `tsc -b` manually, you could refer https://github.com/IWANABETHATGUY/tower-lsp-boilerplate/issues/6 for more details







