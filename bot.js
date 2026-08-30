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
    this.model = 'meta-llama/llama-3.3-70b-instruct:free';
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  }
  
  async ask(question) {
    if (!this.apiKey || this.apiKey.includes('YOUR_OPENROUTER')) return 'No API key';
    
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          messages: [
            { role: 'system', content: 'You are Rorke, a Minecraft bot. Answer briefly.' },
            { role: 'user', content: question }
          ],
          max_tokens: 80,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://cloudsmp.vercel.app',
            'X-Title': 'Rorke Bot'
          }
        }
      );
      
      const answer = response.data.choices?.[0]?.message?.content || 'No response';
      return answer.replace(/[^a-zA-Z0-9\s.,!?']/g, '').trim();
    } catch (error) {
      console.error('Error:', error.response?.data?.error?.message || error.message);
      return 'AI error';
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

// BOT LIFE - Player-like movement + DeadlyGhost focus
function startBotLife() {
  console.log('Rorke is ALIVE!');
  
  // Player-like random movement with facing direction
  setInterval(() => {
    const actions = ['forward', 'back', 'strafe_left', 'strafe_right', 'jump', 'sneak', 'sprint', 'look_around'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    switch(action) {
      case 'forward':
        bot.look(bot.entity.yaw, 0);
        bot.setControlState('forward', true);
        setTimeout(() => bot.setControlState('forward', false), 3000);
        break;
      case 'back':
        bot.look(bot.entity.yaw + Math.PI, 0);
        bot.setControlState('back', true);
        setTimeout(() => bot.setControlState('back', false), 2000);
        break;
      case 'strafe_left':
        bot.look(bot.entity.yaw - Math.PI/2, 0);
        bot.setControlState('left', true);
        setTimeout(() => bot.setControlState('left', false), 2000);
        break;
      case 'strafe_right':
        bot.look(bot.entity.yaw + Math.PI/2, 0);
        bot.setControlState('right', true);
        setTimeout(() => bot.setControlState('right', false), 2000);
        break;
      case 'jump':
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);
        break;
      case 'sneak':
        bot.setControlState('sneak', true);
        setTimeout(() => bot.setControlState('sneak', false), 3000);
        break;
      case 'sprint':
        bot.setControlState('sprint', true);
        bot.setControlState('forward', true);
        setTimeout(() => {
          bot.setControlState('sprint', false);
          bot.setControlState('forward', false);
        }, 3000);
        break;
      case 'look_around':
        bot.look(bot.entity.yaw + Math.random() * Math.PI * 2, (Math.random() - 0.5) * Math.PI / 2);
        break;
    }
  }, 3000);
  
  // Look at DeadlyGhost
  setInterval(() => {
    const deadlyGhost = bot.players['DeadlyGhost']?.entity;
    if (deadlyGhost && deadlyGhost !== bot.entity) {
      bot.lookAt(deadlyGhost.position.offset(0, 1.6, 0));
    } else {
      // Look at nearest player
      const players = Object.values(bot.players).map(p => p.entity).filter(e => e && e !== bot.entity);
      if (players.length > 0) {
        const nearest = players[0];
        bot.lookAt(nearest.position.offset(0, 1.6, 0));
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

// PLAYER CHAT - DeadlyGhost commands + AI
bot.on('chat', async (username, message) => {
  if (username === bot.username) return;
  
  const msg = message.toLowerCase();
  
  // DEADLYGHOST SPECIAL COMMANDS (Owner control)
  if (username === 'DeadlyGhost') {
    const ghost = bot.players['DeadlyGhost']?.entity;
    
    if (msg === 'aao' || msg === 'come' || msg === 'idhar aao') {
      if (ghost) {
        bot.lookAt(ghost.position.offset(0, 1.6, 0));
        bot.setControlState('sprint', true);
        bot.setControlState('forward', true);
        setTimeout(() => {
          bot.setControlState('sprint', false);
          bot.setControlState('forward', false);
        }, 5000);
        bot.chat('Aa raha hoon!');
      }
      return;
    }
    
    if (msg === 'ruk' || msg === 'stop' || msg === 'ruk jao') {
      bot.clearControlStates();
      bot.chat('Ruk gaya!');
      return;
    }
    
    if (msg === 'follow' || msg === 'peeche aao') {
      if (ghost) {
        const followInterval = setInterval(() => {
          if (!bot.players['DeadlyGhost']) {
            clearInterval(followInterval);
            return;
          }
          const g = bot.players['DeadlyGhost'].entity;
          if (bot.entity.position.distanceTo(g.position) > 3) {
            bot.lookAt(g.position.offset(0, 1.6, 0));
            bot.setControlState('forward', true);
          } else {
            bot.setControlState('forward', false);
          }
        }, 500);
        bot.chat('Follow kar raha hoon!');
      }
      return;
    }
    
    if (msg === 'jump' || msg === 'kudo') {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
      bot.chat('Jump kiya!');
      return;
    }
    
    if (msg === 'sneak' || msg === 'jhuko') {
      bot.setControlState('sneak', true);
      bot.chat('Jhuk gaya!');
      return;
    }
    
    if (msg === 'stand' || msg === 'khare ho jao') {
      bot.setControlState('sneak', false);
      bot.chat('Khara ho gaya!');
      return;
    }
    
    if (msg === 'run' || msg === 'bhaag') {
      bot.setControlState('sprint', true);
      bot.setControlState('forward', true);
      setTimeout(() => {
        bot.setControlState('sprint', false);
        bot.setControlState('forward', false);
      }, 5000);
      bot.chat('Bhaag raha hoon!');
      return;
    }
  }
  
  // GENERAL COMMANDS
  if (msg === '!help') {
    bot.chat('Commands: !ping, !ai question, come, follow, stop, jump, sneak, stand, run');
    return;
  }
  
  if (msg === '!ping') {
    bot.chat(`Pong ${bot.player.ping}ms`);
    return;
  }
  
  // AI CHAT
  if (msg.startsWith('!ai ') || msg.includes('rorke') || msg.includes('hello rorke')) {
    const question = msg.replace(/!ai |rorke|hello/gi, '').trim();
    const answer = await ai.ask(question || 'Hello');
    bot.chat(answer);
    return;
  }
});

bot.on('kicked', (reason) => console.log('Kicked:', reason));
bot.on('error', (err) => console.log('Error:', err));
bot.on('end', () => setTimeout(() => process.exit(1), 5000));
