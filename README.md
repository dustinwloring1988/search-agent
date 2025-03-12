# Search Agent

An AI-powered search agent built with Electron and Playwright. This application provides a user interface for entering prompts and displays step-by-step actions performed by an AI agent.

## Features

- Electron-based desktop application with a modern UI
- Split interface with prompt input and results on the left, action list and browser preview on the right
- Integration with Playwright for web automation
- Secure communication between main and renderer processes

## Prerequisites

- Node.js (v16 or newer)
- npm (v7 or newer)

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/search-agent.git
   cd search-agent
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Development

To start the application in development mode:

```
npm run dev
```

This will:
- Transpile TypeScript files
- Start Electron in development mode with hot reloading

## Building

To build the application for production:

```
npm run build
```

This will create distribution packages in the `build` directory for your platform.

## Project Structure

```
search-agent/
├── src/                # Source code
│   ├── main.ts         # Main Electron process
│   ├── preload.ts      # Preload script for secure IPC
│   └── renderer/       # Renderer process files
│       ├── index.html  # Main HTML file
│       ├── styles.css  # CSS styles
│       └── renderer.ts # Renderer TypeScript
├── dist/               # Compiled JavaScript files
├── build/              # Build output
├── node_modules/       # Dependencies
├── package.json        # Project configuration
└── tsconfig.json       # TypeScript configuration
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.