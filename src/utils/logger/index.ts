/**
 * Logger utility for the AI agent
 * Handles logging of conversations, actions, and errors
 */

import * as fs from 'fs';
import * as path from 'path';
import { Message } from '../../config/prompts';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file paths
const conversationLogPath = path.join(logsDir, 'conversation.log');
const errorLogPath = path.join(logsDir, 'error.log');
const actionsLogPath = path.join(logsDir, 'actions.log');

/**
 * Formats a timestamp for logging
 * @returns Formatted timestamp string
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Logs a message to the specified log file
 * @param logPath - Path to the log file
 * @param message - Message to log
 */
function appendToLog(logPath: string, message: string): void {
  const timestamp = getTimestamp();
  const logEntry = `[${timestamp}] ${message}\n`;

  fs.appendFileSync(logPath, logEntry);
}

/**
 * Logs a conversation message
 * @param message - The message to log
 */
export function logConversation(message: Message): void {
  const formattedMessage = `[${message.role.toUpperCase()}] ${message.content}`;
  appendToLog(conversationLogPath, formattedMessage);
}

/**
 * Logs an error message with stack trace
 * @param error - The error to log
 * @param context - Additional context about where the error occurred
 */
export function logError(error: Error, context?: string): void {
  const errorMessage = context
    ? `ERROR in ${context}: ${error.message}\n${error.stack}`
    : `ERROR: ${error.message}\n${error.stack}`;

  appendToLog(errorLogPath, errorMessage);
}

/**
 * Logs an action performed by the AI
 * @param action - The name of the action
 * @param details - Details about the action
 */
export function logAction(action: string, details?: Record<string, unknown>): void {
  const detailsStr = details ? `\n${JSON.stringify(details, null, 2)}` : '';
  const actionMessage = `ACTION: ${action}${detailsStr}`;

  appendToLog(actionsLogPath, actionMessage);
}

/**
 * Retrieves the conversation history
 * @returns Array of conversation log entries
 */
export function getConversationHistory(): string[] {
  if (!fs.existsSync(conversationLogPath)) {
    return [];
  }

  const content = fs.readFileSync(conversationLogPath, 'utf-8');
  return content.split('\n').filter(line => line.trim() !== '');
}
