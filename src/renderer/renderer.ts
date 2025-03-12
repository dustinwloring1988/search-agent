/**
 * Search Agent Renderer Process
 * Handles the user interface and interaction with the main process
 */

import { RendererPromptManager } from './rendererUtils';

// Interface for Electron API exposed through preload script
interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  submitPrompt: (prompt: string) => Promise<{
    success: boolean;
    response?: string;
    error?: string;
    conversation?: Array<{ role: string; content: string }>;
  }>;
}

// Add ElectronAPI to the Window interface
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// Create a prompt manager instance
const promptManager = new RendererPromptManager();

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
async function handlePromptSubmission(): Promise<void> {
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

  try {
    // Submit the prompt to the main process
    const result = await window.electronAPI.submitPrompt(prompt);

    if (result.success && result.response) {
      // Display the AI's response
      resultsContent.innerHTML = '<p><strong>Response:</strong></p><p>' + result.response + '</p>';

      // Add the response to the local conversation history
      promptManager.addAssistantResponse(result.response);

      // Add action for response received
      addAction('Received response from AI');
    } else {
      // Display error message
      resultsContent.innerHTML =
        '<p class="error">Error: ' + (result.error || 'Unknown error') + '</p>';
      addAction('Error processing prompt');
    }
  } catch (error) {
    // Handle any errors
    console.error('Error submitting prompt:', error);
    resultsContent.innerHTML = '<p class="error">Error: Failed to process prompt</p>';
    addAction('Error processing prompt');
  }

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
