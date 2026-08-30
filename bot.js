const mineflayer = require('mineflayer');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

// Keep alive server
const app = express();
app.get('/', (req, res) => res.send('Rorke Bot Online!'));
app.listen(3000);

// AI Model Switcher
class AIModelSwitcher {
  constructor() {
    this.currentModel = process.env.DEFAULT_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
    this.models = {
      mistral: 'mistralai/Mistral-7B-Instruct-v0.2',
      llama: 'meta-llama/Llama-2-7b-chat-hf',
      gemma: 'google/gemma-2b-it',
      phi: 'microsoft/phi-2',
      zephyr: 'HuggingFaceH4/zephyr-7b-beta',
      falcon: 'tiiuae/falcon-7b-instruct',
      tinyllama: 'TinyLlama/TinyLlama-1.1B-Chat-v1.0',
      qwen: 'Qwen/Qwen2.5-7B-Instruct'
    };
  }
  
  getCurrentModel() {
    return this.currentModel;
  }
  
  getModelName() {
    for (const [name, id] of Object.entries(this.models)) {
      if (id === this.currentModel) return name;
    }
    return 'custom';
  }
  
  switchModel(modelName) {
    if (this.models[modelName]) {
      this.currentModel = this.models[modelName];
      return `✅ Switched to ${modelName}!`;
    }
    return `❌ Unknown model! Available: ${Object.keys(this.models).join(', ')}`;
  }
  
  listModels() {
    return Object.keys(this.models).join(', ');
  }
  
  async ask(question) {
    const HF_TOKEN = process.env.HF_TOKEN;
    
    if (!HF_TOKEN) {
      return '❌ HF_TOKEN not set!';
    }
    
    const prompt = `You are Rorke, a friendly Minecraft bot on CloudSMP server. Answer briefly and helpfully.\n\nPlayer: ${question}\nRorke:`;
    
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${this.currentModel}`,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 100,
            temperature: 0.7,
            top_p: 0.9,
            return_full_text: false
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = response.data;
      if (Array.isArray(data)) {
        return data[0]?.generated_text?.trim() || 'No response';
      }
      return data.generated_text?.trim() || 'No response';
    } catch (error) {
      console.error('AI Error:', error.message);
      return '❌ AI service error!';
    }
  }
}

const ai = new AIModelSwitcher();

// Bot setup
const bot = mineflayer.createBot({
  host: process.env.SERVER_IP || 'YOUR_SERVER_IP',
  port: parseInt(process.env.SERVER_PORT) || 21148,
  username: 'Rorke',
  version: '1.20.4'
});

// AUTO LOGIN - Console mein command bhejo
bot.on('login', () => {
  console.log('Rorke joined! Attempting auto-login...');
  
  // 2 second wait karke login command bhejo
  setTimeout(() => {
    bot.chat('/login rorke4321a@');
    console.log('Login command sent!');
  }, 2000);
});

// Login successful check
bot.on('message', (message) => {
  const msg = message.toString();
  
  // Agar login successful message aaye
  if (msg.includes('successfully logged in') || msg.includes('Login successful')) {
    console.log('✅ Login successful!');
    bot.chat('§8[§bRORKE§8] §fOnline! Type §b!help §ffor commands!');
  }
  
  // Agar login required message aaye
  if (msg.includes('/login') || msg.includes('login required')) {
    bot.chat('/login rorke4321a@');
    console.log('⚠️ Login required - sending password...');
  }
});

bot.on('chat', async (username, message) => {
  if (username === bot.username) return;
  
  if (message === '!help') {
    bot.chat('§8[§bRORKE§8] §fCommands: §b!ping §f| §b!info §f| §b!model §f| §b!models §f| §b!ai <question>');
    return;
  }
  
  if (message === '!ping') {
    bot.chat(`§8[§bRORKE§8] §fPong! Latency: §b${bot.player.ping}ms`);
    return;
  }
  
  if (message === '!info') {
    bot.chat(`§8[§bRORKE§8] §fModel: §b${ai.getModelName()} §f| Server: §bCloudSMP`);
    return;
  }
  
  if (message === '!models') {
    bot.chat(`§8[§bRORKE§8] §fAvailable: §b${ai.listModels()}`);
    return;
  }
  
  if (message.startsWith('!model ')) {
    const modelName = message.replace('!model ', '').toLowerCase();
    const result = ai.switchModel(modelName);
    bot.chat(`§8[§bRORKE§8] §f${result}`);
    return;
  }
  
  if (message.startsWith('!ai ')) {
    const question = message.replace('!ai ', '');
    bot.chat('§8[§bRORKE§8] §fThinking...');
    try {
      const answer = await ai.ask(question);
      bot.chat(`§8[§bRORKE§8] §f${answer}`);
    } catch (error) {
      bot.chat('§8[§bRORKE§8] §f❌ AI error!');
    }
    return;
  }
  
  if (message.includes('Rorke') || message.includes('rorke') || message.includes('RORKE')) {
    const question = message.replace(/Rorke|rorke|RORKE/gi, '').trim();
    bot.chat('§8[§bRORKE§8] §fThinking...');
    try {
      const answer = await ai.ask(question || 'Hello!');
      bot.chat(`§8[§bRORKE§8] §f${answer}`);
    } catch (error) {
      bot.chat('§8[§bRORKE§8] §f❌ AI error!');
    }
  }
});

bot.on('playerJoin', (player) => {
  bot.chat(`§8[§bRORKE§8] §fWelcome §b${player.username} §fto CloudSMP!`);
});

bot.on('playerLeave', (player) => {
  bot.chat(`§8[§bRORKE§8] §fGoodbye §b${player.username}§f!`);
});

bot.on('kicked', (reason) => {
  console.log('Kicked:', reason);
});

bot.on('error', (err) => {
  console.log('Error:', err);
});

bot.on('end', () => {
  console.log('Bot disconnected!');
  setTimeout(() => process.exit(1), 5000);
});
