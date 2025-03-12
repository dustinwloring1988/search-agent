/**
 * Tests for the Ollama API wrapper
 */

import { OllamaAPI } from '../../src/ai/ollama';
import { Message } from '../../src/config/prompts';

// Mock the fetch function
global.fetch = jest.fn();

describe('OllamaAPI', () => {
  let api: OllamaAPI;

  beforeEach(() => {
    api = new OllamaAPI({
      apiHost: 'http://test-host:11434',
      model: 'test-model',
      temperature: 0.5,
      maxTokens: 100,
    });

    // Reset the fetch mock
    jest.clearAllMocks();
  });

  test('should initialize with default values when no config is provided', () => {
    const defaultApi = new OllamaAPI();
    expect((defaultApi as any).apiHost).toBe('http://localhost:11434');
    expect((defaultApi as any).model).toBe('llama3.1');
    expect((defaultApi as any).temperature).toBe(0.7);
    expect((defaultApi as any).maxTokens).toBe(4096);
  });

  test('should check if API is available', async () => {
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    const result = await api.isAvailable();
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('http://test-host:11434/api/tags', { method: 'GET' });
  });

  test('should handle API unavailability', async () => {
    // Mock failed API response
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'));

    const result = await api.isAvailable();
    expect(result).toBe(false);
  });

  test('should format messages correctly', () => {
    const messages: Message[] = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello!' },
      { role: 'assistant', content: 'How can I help you?' },
    ];

    const formatMethod = (api as any).formatMessages.bind(api);
    const formatted = formatMethod(messages);

    expect(formatted).toBe(
      'System: You are a helpful assistant.\n\nUser: Hello!\n\nAssistant: How can I help you?'
    );
  });

  test('should query the API successfully', async () => {
    const messages: Message[] = [{ role: 'user', content: 'Hello!' }];

    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        model: 'test-model',
        created_at: '2023-01-01T00:00:00Z',
        response: 'Hello, how can I help you?',
        done: true,
      }),
    });

    const response = await api.query(messages);

    expect(response).toBe('Hello, how can I help you?');
    expect(global.fetch).toHaveBeenCalledWith('http://test-host:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'test-model',
        prompt: 'User: Hello!',
        temperature: 0.5,
        max_tokens: 100,
        stream: false,
      }),
    });
  });

  test('should handle API errors in query', async () => {
    const messages: Message[] = [{ role: 'user', content: 'Hello!' }];

    // Mock API error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: jest.fn().mockResolvedValue('Model not found'),
    });

    await expect(api.query(messages)).rejects.toThrow('Ollama API error: 404 Model not found');
  });
});
