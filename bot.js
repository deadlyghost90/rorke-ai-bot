const mineflayer = require('mineflayer');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.get('/', (req, res) => res.send('Rorke Bot Online!'));
app.listen(3000);

// OPENROUTER API (same key)
const OPENROUTER_API_KEY = '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';

class OpenRouterAI {
  constructor() {
    this.apiKey = OPENROUTER_API_KEY;
    this.model = 'mistralai/mistral-7b-instruct:free'; // Fast + free
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  }
  
  async ask(question) {
    if (!this.apiKey) return 'No API key';
    
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          messages: [
            { role: 'system', content: 'You are Rorke, a Minecraft bot on CloudSMP. You are friendly, cute with Ayra_Slayz, protective, and helpful. Answer in 1-2 sentences.' },
            { role: 'user', content: question }
          ],
          max_tokens: 100,
          temperature: 0.8
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://cloudsmp.vercel.app',
            'X-Title': 'Rorke Bot'
          }
        }
      );
      
      return response.data.choices?.[0]?.message?.content?.trim() || 'No response';
    } catch (error) {
      console.error('AI Error:', error.response?.data?.error?.message || error.message);
      return 'Hmm, soch raha hoon...';
    }
  }
}

const ai = new OpenRouterAI();

const bot = mineflayer.createBot({
  host: process.env.SERVER_IP || 'YOUR_SERVER_IP',
  port: parseInt(process.env.SERVER_PORT) || 21148,
  username: 'Rorke',
  version: '1.20.4'
});

// AUTH
bot.on('login', () => {
  console.log('Rorke joined!');
  setTimeout(() => bot.chat('/register rorke4321 rorke4321'), 2000);
});

bot.on('message', (message) => {
  const msg = message.toString().toLowerCase();
  
  if (msg.includes('registered') || msg.includes('successfully registered') || msg.includes('already registered')) {
    setTimeout(() => bot.chat('/login rorke4321'), 2000);
  }
  
  if (msg.includes('successfully logged in') || msg.includes('login successful')) {
    console.log('Login successful!');
    startBotLife();
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

// BOT LIFE
function startBotLife() {
  console.log('Rorke is ALIVE!');
  bot.chat('Rorke is online! Type help for commands!');
  
  setInterval(() => {
    const actions = ['forward', 'back', 'left', 'right', 'jump', 'sneak', 'look'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    switch(action) {
      case 'forward':
        bot.setControlState('forward', true);
        setTimeout(() => bot.setControlState('forward', false), 2500);
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
      case 'look':
        bot.look(bot.entity.yaw + Math.random() * Math.PI, (Math.random() - 0.5));
        break;
    }
  }, 4000);
  
  // Look at important players
  setInterval(() => {
    const special = ['DeadlyGhost', 'Ayra_Slayz', 'tuff_hedgehog'];
    for (const name of special) {
      const player = bot.players[name]?.entity;
      if (player && player !== bot.entity) {
        bot.lookAt(player.position.offset(0, 1.6, 0));
        return;
      }
    }
  }, 1000);
}

// AUTO PICKUP
bot.on('entitySpawn', (entity) => {
  if (entity.kind === 'Drops') {
    bot.collectBlock.collect(entity, (err) => {});
  }
});

// CHAT HANDLER
bot.on('chat', async (username, message) => {
  if (username === bot.username) return;
  
  const msg = message.toLowerCase();
  console.log(`CHAT: ${username}: ${message}`);
  
  // ========== DEADLYGHOST (Owner) ==========
  if (username === 'DeadlyGhost') {
    if (msg === 'aao' || msg === 'come' || msg === 'idhar aao') {
      const p = bot.players['DeadlyGhost']?.entity;
      if (p) {
        bot.lookAt(p.position.offset(0, 1.6, 0));
        bot.setControlState('sprint', true);
        bot.setControlState('forward', true);
        setTimeout(() => {
          bot.setControlState('sprint', false);
          bot.setControlState('forward', false);
        }, 5000);
        bot.chat('Aa raha hoon boss!');
      }
      return;
    }
    
    if (msg === 'ruk' || msg === 'stop') {
      bot.clearControlStates();
      bot.chat('Ruk gaya!');
      return;
    }
    
    if (msg === 'jump' || msg === 'kudo') {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
      bot.chat('Jump kiya!');
      return;
    }
  }
  
  // ========== AYRA_SLAYZ (Girlfriend - Cute Mode) ==========
  if (username === 'Ayra_Slayz') {
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      bot.chat('Hii Ayra! Tum aayi! Tumse milke khushi hui!');
      return;
    }
    
    if (msg.includes('love') || msg.includes('pyaar') || msg.includes('cute')) {
      bot.chat('Ayra, tum sabse cute ho! Main tumhe protect karunga hamesha!');
      return;
    }
    
    if (msg.includes('help') || msg.includes('madad') || msg.includes('bachao')) {
      bot.chat('Ayra, main aa raha hoon! Tumhe koi touch nahi kar sakta!');
      const p = bot.players['Ayra_Slayz']?.entity;
      if (p) {
        bot.lookAt(p.position.offset(0, 1.6, 0));
        bot.setControlState('sprint', true);
        bot.setControlState('forward', true);
        setTimeout(() => {
          bot.setControlState('sprint', false);
          bot.setControlState('forward', false);
        }, 5000);
      }
      return;
    }
    
    // Ayra ko protect karo - uske paas raho
    const p = bot.players['Ayra_Slayz']?.entity;
    if (p && bot.entity.position.distanceTo(p.position) > 5) {
      bot.lookAt(p.position.offset(0, 1.6, 0));
      bot.setControlState('forward', true);
      setTimeout(() => bot.setControlState('forward', false), 3000);
      bot.chat('Ayra, tumhare paas aa raha hoon!');
      return;
    }
  }
  
  // ========== GENERAL ==========
  if (msg === 'help' || msg === '!help') {
    bot.chat('Commands: ping, ai <question>, come, stop, jump');
    return;
  }
  
  if (msg === 'ping' || msg === '!ping') {
    bot.chat(`Pong! ${bot.player.ping}ms`);
    return;
  }
  
  // AI CHAT - Smart Response
  if (msg.startsWith('ai ') || msg.startsWith('!ai ') || msg.includes('rorke')) {
    const question = msg.replace(/!?ai |rorke/gi, '').trim();
    const answer = await ai.ask(question || 'Hello');
    bot.chat(answer);
    return;
  }
});

bot.on('kicked', (reason) => console.log('Kicked:', reason));
bot.on('error', (err) => console.log('Error:', err));
bot.on('end', () => setTimeout(() => process.exit(1), 5000));
