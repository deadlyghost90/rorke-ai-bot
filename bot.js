const mineflayer = require('mineflayer');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.get('/', (req, res) => res.send('Rorke Bot Online!'));
app.listen(3000);

// OPENROUTER API
const OPENROUTER_API_KEY = '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';

class OpenRouterAI {
  constructor() {
    this.apiKey = OPENROUTER_API_KEY;
    this.model = 'mistralai/mistral-7b-instruct:free';
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  }
  
  async ask(question) {
    if (!this.apiKey) return 'API key missing';
    
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          messages: [
            { 
              role: 'system', 
              content: 'You are Rorke, a Minecraft bot on CloudSMP. Reply in Roman Urdu. Be friendly, respectful to DeadlyGhost (owner), cute with Ayra_Slayz (girlfriend). Answer in 1 short sentence only.' 
            },
            { role: 'user', content: question }
          ],
          max_tokens: 60,
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
      
      const answer = response.data.choices?.[0]?.message?.content?.trim();
      return answer ? answer.substring(0, 100) : 'Haan bolo!';
    } catch (error) {
      console.error('AI Error:', error.message);
      return 'Samajh nahi aaya, phir bolo!';
    }
  }
}

const ai = new OpenRouterAI();

// Bot setup with proper settings
const bot = mineflayer.createBot({
  host: process.env.SERVER_IP || 'YOUR_SERVER_IP',
  port: parseInt(process.env.SERVER_PORT) || 21148,
  username: 'Rorke',
  version: '1.20.4',
  auth: 'offline',
  hideErrors: false
});

// AUTH
bot.on('login', () => {
  console.log('✅ Rorke joined!');
  setTimeout(() => {
    bot.chat('/register rorke4321 rorke4321');
    console.log('📝 Register sent');
  }, 2000);
});

bot.on('message', (message) => {
  const msg = message.toString();
  const lower = msg.toLowerCase();
  
  // Auth messages
  if (lower.includes('registered') || lower.includes('already registered')) {
    console.log('📝 Register done, logging in...');
    setTimeout(() => bot.chat('/login rorke4321'), 2000);
  }
  
  if (lower.includes('successfully logged') || lower.includes('login successful')) {
    console.log('✅ LOGIN SUCCESS!');
    bot.chat('Rorke online! Mujhe Rorke bol ke bulao!');
    startBotLife();
  }
  
  if (lower.includes('register required') || lower.includes('please register')) {
    setTimeout(() => bot.chat('/register rorke4321 rorke4321'), 2000);
  }
  
  if (lower.includes('login required') || lower.includes('please login')) {
    setTimeout(() => bot.chat('/login rorke4321'), 2000);
  }
  
  if (lower.includes('wrong password')) {
    setTimeout(() => bot.chat('/login rorke4321'), 3000);
  }
  
  // CHAT DETECTION (from message)
  const chatMatch = msg.match(/(?:<|\[)?(\w+)(?:\]|>)?(?: »|:|: )(.+)/);
  if (chatMatch && !lower.includes('rorke joined') && !lower.includes('logged in')) {
    const username = chatMatch[1].trim();
    const chatMessage = chatMatch[2].trim();
    
    if (username === bot.username) return;
    
    console.log(`💬 CHAT: ${username}: ${chatMessage}`);
    handleChat(username, chatMessage);
  }
});

// CHAT HANDLER FUNCTION
async function handleChat(username, message) {
  const msg = message.toLowerCase();
  
  // DEADLYGHOST COMMANDS
  if (username === 'DeadlyGhost') {
    if (msg.includes('aao') || msg.includes('come') || msg.includes('idhar')) {
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
    
    if (msg.includes('ruk') || msg.includes('stop')) {
      bot.clearControlStates();
      bot.chat('Ruk gaya boss!');
      return;
    }
    
    if (msg.includes('jump') || msg.includes('kudo')) {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
      bot.chat('Jump kiya!');
      return;
    }
  }
  
  // AYRA_SLAYZ
  if (username === 'Ayra_Slayz') {
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      bot.chat('Hii Ayra! Tum aayi!');
      return;
    }
    if (msg.includes('love') || msg.includes('pyaar') || msg.includes('cute')) {
      bot.chat('Ayra, tum sabse cute ho!');
      return;
    }
    if (msg.includes('help') || msg.includes('madad') || msg.includes('bachao')) {
      bot.chat('Ayra! Main aa raha hoon!');
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
  }
  
  // RORKE DETECTION
  if (msg.includes('rorke') || msg.includes('rork') || msg.includes('bot')) {
    console.log('🎯 RORKE CALLED!');
    bot.chat('Haan bolo!');
    
    const question = msg.replace(/rorke|rork|bot/gi, '').trim();
    setTimeout(async () => {
      const answer = await ai.ask(question || 'Hello');
      bot.chat(answer);
    }, 1000);
    return;
  }
  
  // SIMPLE COMMANDS
  if (msg === 'ping' || msg === '!ping') {
    bot.chat(`Pong! ${bot.player.ping}ms`);
    return;
  }
  
  if (msg === 'help' || msg === '!help') {
    bot.chat('Commands: ping, Rorke question, aao, ruk, jump');
    return;
  }
}

// BOT LIFE
function startBotLife() {
  console.log('🎮 Rorke is ALIVE!');
  
  setInterval(() => {
    if (!bot.entity) return;
    
    const actions = ['forward', 'back', 'jump', 'sneak', 'left', 'right'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    switch(action) {
      case 'forward':
        bot.setControlState('forward', true);
        setTimeout(() => bot.setControlState('forward', false), 2000);
        break;
      case 'back':
        bot.setControlState('back', true);
        setTimeout(() => bot.setControlState('back', false), 1500);
        break;
      case 'jump':
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);
        break;
      case 'sneak':
        bot.setControlState('sneak', true);
        setTimeout(() => bot.setControlState('sneak', false), 2000);
        break;
      case 'left':
        bot.setControlState('left', true);
        setTimeout(() => bot.setControlState('left', false), 1500);
        break;
      case 'right':
        bot.setControlState('right', true);
        setTimeout(() => bot.setControlState('right', false), 1500);
        break;
    }
  }, 4000);
  
  // Look at special players
  setInterval(() => {
    if (!bot.entity) return;
    
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

// ERROR HANDLING
bot.on('kicked', (reason) => {
  console.log('❌ Kicked:', reason);
});

bot.on('error', (err) => {
  console.log('❌ Error:', err.message);
});

bot.on('end', () => {
  console.log('❌ Disconnected!');
  setTimeout(() => process.exit(1), 5000);
});
