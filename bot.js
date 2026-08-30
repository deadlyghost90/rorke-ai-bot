const mineflayer = require('mineflayer');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.get('/', (req, res) => res.send('Rorke Bot Online!'));
app.listen(3000);

// GEMINI API - NAYA FORMAT KEY
const GEMINI_API_KEY = 'AQ.Ab8RN6Ks36d53xLFNMzUcre1_JauWeh43jFcWUId6yrehz7KRg';

class GeminiAI {
  constructor() {
    this.apiKey = GEMINI_API_KEY;
    this.model = 'gemini-1.5-flash';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }
  
  async ask(question) {
    if (!this.apiKey) return 'No API key';
    
    const prompt = `You are Rorke, a Minecraft bot on CloudSMP server. Answer briefly in 1-2 sentences.\n\nPlayer: ${question}\nRorke:`;
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 80, temperature: 0.7 }
        }
      );
      
      const answer = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
      return answer.replace(/[^a-zA-Z0-9\s.,!?']/g, '').trim();
    } catch (error) {
      console.error('Error:', error.response?.data?.error?.message || error.message);
      return 'AI error: ' + (error.response?.data?.error?.message || 'unknown').substring(0, 50);
    }
  }
}

const ai = new GeminiAI();

const bot = mineflayer.createBot({
  host: process.env.SERVER_IP || 'YOUR_SERVER_IP',
  port: parseInt(process.env.SERVER_PORT) || 21148,
  username: 'Rorke',
  version: '1.20.4'
});

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

function startNPCMovement() {
  console.log('NPC movement started!');
  
  setInterval(() => {
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

bot.on('chat', async (username, message) => {
  if (username === bot.username) return;
  
  if (message === '!help') {
    bot.chat('Commands: !ping, !ai question, !come, !follow, !stop, !sneak, !stand, !run');
    return;
  }
  
  if (message === '!ping') {
    bot.chat(`Pong ${bot.player.ping}ms`);
    return;
  }
  
  if (message.startsWith('!ai ')) {
    const question = message.replace('!ai ', '');
    bot.chat('Thinking...');
    const answer = await ai.ask(question);
    bot.chat(answer);
    return;
  }
  
  if (message === '!come') {
    const player = bot.players[username]?.entity;
    if (player) {
      bot.lookAt(player.position);
      bot.setControlState('forward', true);
      setTimeout(() => bot.setControlState('forward', false), 3000);
      bot.chat('Coming');
    }
    return;
  }
  
  if (message === '!follow') {
    const player = bot.players[username]?.entity;
    if (player) {
      bot.pathfinder.setGoal(new mineflayer.goals.GoalFollow(player, 2), true);
      bot.chat('Following');
    }
    return;
  }
  
  if (message === '!stop') {
    bot.pathfinder.setGoal(null);
    bot.clearControlStates();
    bot.chat('Stopped');
    return;
  }
  
  if (message === '!sneak') {
    bot.setControlState('sneak', true);
    bot.chat('Sneaking');
    return;
  }
  
  if (message === '!stand') {
    bot.setControlState('sneak', false);
    bot.chat('Standing');
    return;
  }
  
  if (message === '!run') {
    bot.setControlState('sprint', true);
    bot.setControlState('forward', true);
    setTimeout(() => {
      bot.setControlState('sprint', false);
      bot.setControlState('forward', false);
    }, 3000);
    bot.chat('Running');
    return;
  }
  
  if (message.toLowerCase().includes('rorke')) {
    const question = message.replace(/rorke/gi, '').trim();
    const answer = await ai.ask(question || 'Hello');
    bot.chat(answer);
  }
});

bot.on('entitySpawn', (entity) => {
  if (entity.kind === 'Drops') {
    bot.collectBlock.collect(entity, (err) => {
      if (err) console.log('Collect error');
    });
  }
});

bot.on('kicked', (reason) => console.log('Kicked:', reason));
bot.on('error', (err) => console.log('Error:', err));
bot.on('end', () => setTimeout(() => process.exit(1), 5000));
