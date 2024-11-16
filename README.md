# pinting
This project introduces two key components to enhance the development workflow within the Essential ecosystem:

    A Hardhat Integration for the Pint Language: This contribution bridges the Pint Language with Hardhat, a widely-used development framework for building, testing, and deploying blockchain applications. By integrating Pint into Hardhat, developers can leverage a familiar and powerful environment while working with Pint, ensuring a seamless transition and enabling productive development without the need to learn a completely new setup.

    A Language Server and Visual Studio Extension: To support a user-friendly and efficient development process, this project also includes a Language Server tailored for Pint, along with an extension for Visual Studio Code. Together, these tools provide essential features like code completion, syntax highlighting, etc. This ensures a smoother, more intuitive development experience, reducing friction and enabling developers to focus on building robust solutions.



## Hardhat Integration for Pint

The Hardhat integration, built with TypeScript, adds support for the Pint Language to the Hardhat ecosystem. Leveraging Essential’s essential-rest-client and pint-cli tools, it allows developers to test and develop Pint contracts as effortlessly as any other smart contracts. This ensures a consistent, familiar workflow while minimizing the learning curve and enabling smooth adoption into existing pipelines.

Further instructions at https://github.com/Mokita-J/pinting/tree/main/hardhat-pint#readme

## Language Server and VSCode Extension

To enhance productivity, we prototype a Pint Language Server in Rust, using tower-lsp and the Pint compiler [(pintc)](https://github.com/essential-contributions/pint) as a library. It provides essential features like syntax checking and auto-completion.

The VSCode extension, built with Node.js, integrates directly with the Language Server to deliver these features within the VSCode interface. Together, these tools offer a developer-friendly environment for writing, debugging, and managing Pint contracts, streamlining the adoption of Pint in the Essential ecosystem.

Further instructions at https://github.com/Mokita-J/pinting/tree/main/vscode-extension#README.md






@ETHGlobal Bangkok Hackathon

