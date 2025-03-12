/**
 * Tests for the AI module
 */

import { queryAI, streamQueryAI, isAIAvailable } from '../../src/ai';
import { OllamaAPI } from '../../src/ai/ollama';
import { Message } from '../../src/config/prompts';
import { logConversation, logError } from '../../src/utils/logger';

// Mock the dependencies
jest.mock('../../src/ai/ollama');
jest.mock('../../src/utils/logger');

describe('AI Module', () => {
  let mockQuery: jest.Mock;
  let mockStreamQuery: jest.Mock;
  let mockIsAvailable: jest.Mock;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock implementations
    mockQuery = jest.fn().mockResolvedValue('AI response');
    mockStreamQuery = jest.fn().mockImplementation((_messages, callback) => {
      callback('First chunk', false);
      callback('Second chunk', false);
      callback('', true);
      return Promise.resolve();
    });
    mockIsAvailable = jest.fn().mockResolvedValue(true);
    
    // Mock the OllamaAPI constructor
    (OllamaAPI as jest.Mock).mockImplementation(() => ({
      query: mockQuery,
      streamQuery: mockStreamQuery,
      isAvailable: mockIsAvailable,
    }));
  });
  
  test('queryAI should call Ollama API and log conversation', async () => {
    const messages: Message[] = [
      { role: 'user', content: 'Hello!' },
    ];
    
    const response = await queryAI(messages);
    
    // Verify Ollama API was called
    expect(mockQuery).toHaveBeenCalledWith(messages);
    
    // Verify response
    expect(response).toBe('AI response');
    
    // Verify logging
    expect(logConversation).toHaveBeenCalledTimes(2); // Once for user message, once for AI response
    expect(logConversation).toHaveBeenCalledWith(messages[0]);
    expect(logConversation).toHaveBeenCalledWith({
      role: 'assistant',
      content: 'AI response',
    });
  });
  
  test('streamQueryAI should call Ollama API with streaming and log conversation', async () => {
    const messages: Message[] = [
      { role: 'user', content: 'Tell me a story.' },
    ];
    
    const mockCallback = jest.fn();
    await streamQueryAI(messages, mockCallback);
    
    // Verify Ollama API was called
    expect(mockStreamQuery).toHaveBeenCalledTimes(1);
    expect(mockStreamQuery.mock.calls[0][0]).toEqual(messages);
    
    // Verify callback was called for each chunk
    expect(mockCallback).toHaveBeenCalledTimes(3);
    expect(mockCallback).toHaveBeenCalledWith('First chunk', false);
    expect(mockCallback).toHaveBeenCalledWith('Second chunk', false);
    expect(mockCallback).toHaveBeenCalledWith('', true);
    
    // Verify logging
    expect(logConversation).toHaveBeenCalledTimes(2); // Once for user message, once for complete AI response
    expect(logConversation).toHaveBeenCalledWith(messages[0]);
    expect(logConversation).toHaveBeenCalledWith({
      role: 'assistant',
      content: 'First chunkSecond chunk',
    });
  });
  
  test('isAIAvailable should check if the Ollama API is available', async () => {
    const available = await isAIAvailable();
    
    // Verify Ollama API was called
    expect(mockIsAvailable).toHaveBeenCalledTimes(1);
    
    // Verify response
    expect(available).toBe(true);
  });
  
  test('should handle errors in queryAI', async () => {
    // Setup mock to throw an error
    mockQuery.mockRejectedValueOnce(new Error('API Error'));
    
    const messages: Message[] = [
      { role: 'user', content: 'Hello!' },
    ];
    
    await expect(queryAI(messages)).rejects.toThrow('Failed to query AI: API Error');
    
    // Verify error was logged
    expect(logError).toHaveBeenCalledTimes(1);
  });
  
  test('should handle errors in streamQueryAI', async () => {
    // Setup mock to throw an error
    mockStreamQuery.mockRejectedValueOnce(new Error('Streaming Error'));
    
    const messages: Message[] = [
      { role: 'user', content: 'Hello!' },
    ];
    
    const mockCallback = jest.fn();
    await expect(streamQueryAI(messages, mockCallback)).rejects.toThrow(
      'Failed to stream query AI: Streaming Error'
    );
    
    // Verify error was logged
    expect(logError).toHaveBeenCalledTimes(1);
  });
}); 