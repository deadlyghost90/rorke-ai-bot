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
  
  getModelName() {
    for (const [name, id] of Object.entries(this.models)) {
      if (id === this.currentModel) return name;
    }
    return 'custom';
  }
  
  switchModel(modelName) {
    if (this.models[modelName]) {
      this.currentModel = this.models[modelName];
      return `Switched to ${modelName}`;
    }
    return `Unknown model. Available: ${Object.keys(this.models).join(', ')}`;
  }
  
  listModels() {
    return Object.keys(this.models).join(', ');
  }
  
  async ask(question) {
    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN) return 'HF_TOKEN not set';
    
    const prompt = `You are Rorke, a Minecraft bot on CloudSMP. Answer briefly.\n\nPlayer: ${question}\nRorke:`;
    
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${this.currentModel}`,
        { inputs: prompt, parameters: { max_new_tokens: 80, temperature: 0.7, return_full_text: false } },
        { headers: { 'Authorization': `Bearer ${HF_TOKEN}` } }
      );
      const data = response.data;
      if (Array.isArray(data)) return data[0]?.generated_text?.trim() || 'No response';
      return data.generated_text?.trim() || 'No response';
    } catch (error) {
      return 'AI error, try later';
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

// AUTO REGISTER + LOGIN
bot.on('login', () => {
  console.log('Rorke joined!');
  setTimeout(() => bot.chat('/register rorke4321 rorke4321'), 2000);
});

bot.on('message', (message) => {
  const msg = message.toString().toLowerCase();
  
  if (msg.includes('registered') || msg.includes('successfully registered')) {
    setTimeout(() => bot.chat('/login rorke4321'), 2000);
  }
  
  if (msg.includes('already registered')) {
    setTimeout(() => bot.chat('/login rorke4321'), 2000);
  }
  
  if (msg.includes('successfully logged in') || msg.includes('login successful')) {
    console.log('Login successful!');
    startNPCMovement();
  }
  
  if (msg.includes('register required') || msg.includes('please register')) {
    setTimeout(() => bot.chat('/register rorke4321 rorke4321'), 2000);
  }
  
  if (msg.includes('login required') || msg.includes('please login')) {
    setTimeout(() => bot.chat('/login rorke4321'), 2000);
  }
  
  if (msg.includes('wrong password')) {
    setTimeout(() => bot.chat('/login rorke4321'), 3000);
  }
});

// NPC MOVEMENT SYSTEM
function startNPCMovement() {
  let moving = true;
  
  // Random movement loop
  setInterval(() => {
    if (!moving) return;
    
    const actions = ['forward', 'back', 'left', 'right', 'jump', 'sneak'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    switch(action) {
      case 'forward':
        bot.setControlState('forward', true);
        setTimeout(() => bot.setControlState('forward', false), 2000);
        break;
      case 'back':
        bot.setControlState('back', true);
        setTimeout(() => bot.setControlState('back', false), 2000);
        break;
      case 'left':
        bot.setControlState('left', true);
        setTimeout(() => bot.setControlState('left', false), 1500);
        break;
      case 'right':
        bot.setControlState('right', true);
        setTimeout(() => bot.setControlState('right', false), 1500);
        break;
      case 'jump':
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);
        break;
      case 'sneak':
        bot.setControlState('sneak', true);
        setTimeout(() => bot.setControlState('sneak', false), 2000);
        break;
    }
  }, 5000);
}

// COMMANDS (Chat based)
bot.on('chat', async (username, message) => {
  if (username === bot.username) return;
  
  // HELP
  if (message === '!help') {
    bot.chat('Commands: !ping, !model, !models, !ai <question>, !come, !follow, !stop, !sneak, !stand, !run');
    return;
  }
  
  // PING
  if (message === '!ping') {
    bot.chat(`Pong! ${bot.player.ping}ms`);
    return;
  }
  
  // MODELS
  if (message === '!models') {
    bot.chat(`Models: ${ai.listModels()}`);
    return;
  }
  
  // SWITCH MODEL
  if (message.startsWith('!model ')) {
    const modelName = message.replace('!model ', '').toLowerCase();
    bot.chat(ai.switchModel(modelName));
    return;
  }
  
  // AI CHAT
  if (message.startsWith('!ai ')) {
    const question = message.replace('!ai ', '');
    bot.chat('Thinking...');
    const answer = await ai.ask(question);
    bot.chat(answer);
    return;
  }
  
  // COME TO PLAYER
  if (message === '!come') {
    const player = bot.players[username]?.entity;
    if (player) {
      bot.pathfinder.setGoal(null);
      bot.lookAt(player.position);
      bot.setControlState('forward', true);
      setTimeout(() => bot.setControlState('forward', false), 3000);
      bot.chat('Coming to you!');
    }
    return;
  }
  
  // FOLLOW PLAYER
  if (message === '!follow') {
    const player = bot.players[username]?.entity;
    if (player) {
      bot.pathfinder.setGoal(new mineflayer.goals.GoalFollow(player, 2), true);
      bot.chat('Following you!');
    }
    return;
  }
  
  // STOP MOVEMENT
  if (message === '!stop') {
    bot.pathfinder.setGoal(null);
    bot.clearControlStates();
    bot.chat('Stopped!');
    return;
  }
  
  // SNEAK
  if (message === '!sneak') {
    bot.setControlState('sneak', true);
    bot.chat('Sneaking!');
    return;
  }
  
  // STAND
  if (message === '!stand') {
    bot.setControlState('sneak', false);
    bot.chat('Standing!');
    return;
  }
  
  // RUN
  if (message === '!run') {
    bot.setControlState('sprint', true);
    bot.setControlState('forward', true);
    setTimeout(() => {
      bot.setControlState('sprint', false);
      bot.setControlState('forward', false);
    }, 3000);
    bot.chat('Running!');
    return;
  }
  
  // GIVE ITEM TO BOT
  if (message.startsWith('!give ')) {
    bot.chat('Give me item by dropping near me!');
    return;
  }
  
  // AUTO AI RESPONSE (when name called)
  if (message.includes('Rorke') || message.includes('rorke') || message.includes('RORKE')) {
    const question = message.replace(/Rorke|rorke|RORKE/gi, '').trim();
    const answer = await ai.ask(question || 'Hello');
    bot.chat(answer);
    return;
  }
});

// ITEM PICKUP (Auto collect nearby items)
bot.on('entitySpawn', (entity) => {
  if (entity.kind === 'Drops') {
    const item = entity.metadata[entity.metadata.length - 1];
    bot.collectBlock.collect(entity, (err) => {
      if (err) console.log('Collect error:', err);
    });
  }
});

// PLAYER JOIN (Simple)
bot.on('playerJoin', (player) => {
  console.log(`${player.username} joined`);
});

// PLAYER LEAVE (Simple)
bot.on('playerLeave', (player) => {
  console.log(`${player.username} left`);
});

bot.on('kicked', (reason) => console.log('Kicked:', reason));
bot.on('error', (err) => console.log('Error:', err));
bot.on('end', () => setTimeout(() => process.exit(1), 5000));
