import 'dotenv/config';
import { generateAudioForStep } from './voiceover.js';
import fs from 'fs';

async function main() {
  console.log('Testing Volc TTS v3 SSE...');
  try {
    const result = await generateAudioForStep('Hello, this is a test.', 'English (US)');
    fs.writeFileSync('test-output.mp3', result.buffer);
    console.log('✅ Success! Size:', result.buffer.length, 'bytes');
  } catch (err: any) {
    console.error('❌', err.message);
  }
}
main();
