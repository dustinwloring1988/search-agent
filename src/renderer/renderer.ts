/**
 * Search Agent Renderer Process
 * Handles the user interface and interaction with the main process
 */

import { PromptManager } from '../utils/promptManager';

// Interface for Electron API exposed through preload script
interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  // Add more API methods as needed
}

// Add ElectronAPI to the Window interface
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// Create a prompt manager instance
const promptManager = new PromptManager();

// DOM Elements
const promptInput = document.getElementById('prompt-input') as HTMLTextAreaElement;
const submitButton = document.getElementById('submit-prompt') as HTMLButtonElement;
const resultsContent = document.getElementById('results-content') as HTMLDivElement;
const actionList = document.getElementById('action-list') as HTMLUListElement;
// Keeping browserView for future use
// @ts-expect-error - Will be used when we integrate with Playwright
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const browserViewContainer = document.getElementById('browser-view') as HTMLDivElement;
const appVersion = document.getElementById('app-version') as HTMLDivElement;

// Initialize application
async function initApp(): Promise<void> {
  try {
    // Display app version
    const version = await window.electronAPI.getAppVersion();
    appVersion.textContent = `Version: ${version}`;

    // Initialize prompt manager
    promptManager.initialize();

    // Set up event listeners
    setupEventListeners();

    console.log('Renderer initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
}

// Set up event listeners for UI interactions
function setupEventListeners(): void {
  // Handle prompt submission
  submitButton.addEventListener('click', handlePromptSubmission);
  promptInput.addEventListener('keydown', (event: KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      handlePromptSubmission();
    }
  });
}

// Handle user prompt submission
function handlePromptSubmission(): void {
  const prompt = promptInput.value.trim();

  if (!prompt) {
    // Don't submit empty prompts
    return;
  }

  // Add user prompt to conversation
  promptManager.addUserPrompt(prompt);

  // Display placeholder for now
  resultsContent.innerHTML = '<p>Processing prompt: "' + prompt + '"</p>';

  // Clear action list
  actionList.innerHTML = '';

  // Add example action (placeholder)
  addAction('Received prompt: ' + prompt);

  // Clear input after submission
  promptInput.value = '';
}

// Add an action item to the action list
function addAction(text: string): void {
  const li = document.createElement('li');
  li.textContent = text;
  actionList.appendChild(li);

  // Scroll to bottom of list
  actionList.scrollTop = actionList.scrollHeight;
}

// Start the application
document.addEventListener('DOMContentLoaded', initApp);

// Add this to make the file a module
export {};
