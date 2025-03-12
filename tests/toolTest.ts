/**
 * Tool System Test Script
 * A simple REPL test to verify tool invocation
 */

import readline from 'readline';
import toolManager from '../src/tools';
import { createSystemPrompt, createUserPrompt } from '../src/config/prompts';
import { streamQueryAI, ToolExecutionCallback } from '../src/ai';
import echoTool from '../src/tools/echoTool';

/**
 * Initialize the tool system and run the test REPL
 */
async function main() {
  console.log('Tool System Test');
  console.log('----------------');

  try {
    // Register the echo tool
    toolManager.registerTool(echoTool);
    console.log(`Registered ${toolManager.getAllTools().length} tools`);
    console.log(
      'Available tools:',
      toolManager
        .getAllTools()
        .map(tool => tool.name)
        .join(', ')
    );

    // Create readline interface for REPL
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Start the REPL
    runRepl(rl);
  } catch (error) {
    console.error('Error initializing tool system:', error);
    process.exit(1);
  }
}

/**
 * Run the REPL for interactive testing
 * @param rl - Readline interface
 */
function runRepl(rl: readline.Interface) {
  console.log('\nEnter a prompt to test tool invocation, or type "exit" to quit');
  console.log('Try a prompt like: "Use the echo tool to say hello world"\n');

  rl.question('> ', async input => {
    if (input.toLowerCase() === 'exit') {
      rl.close();
      return;
    }

    try {
      // Create messages with system prompt and user input
      const messages = [createSystemPrompt(), createUserPrompt(input)];

      // Tool execution callback
      const toolCallback: ToolExecutionCallback = result => {
        console.log('\n[Tool Execution]');
        console.log('Success:', result.success);
        if (result.success) {
          console.log('Result:', result.data);
        } else {
          console.log('Error:', result.error);
        }
        console.log();
      };

      // Stream callback to print response
      console.log('\n[AI Response]');
      await streamQueryAI(
        messages,
        (text, done) => {
          process.stdout.write(text);
          if (done) {
            console.log('\n');
          }
        },
        toolCallback
      );
    } catch (error) {
      console.error('\nError querying AI:', error);
    }

    // Continue the REPL
    runRepl(rl);
  });
}

// Run the test
main().catch(console.error);
