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
            { role: 'system', content: 'You are Rorke, a Minecraft bot. Answer briefly in 1-2 sentences.' },
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

// BOT LIFE
function startBotLife() {
  console.log('Rorke is ALIVE!');
  
  setInterval(() => {
    const actions = ['forward', 'back', 'left', 'right', 'jump', 'sneak', 'sprint', 'spin'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    switch(action) {
      case 'forward':
        bot.setControlState('forward', true);
        setTimeout(() => bot.setControlState('forward', false), 3000);
        break;
      case 'back':
        bot.setControlState('back', true);
        setTimeout(() => bot.setControlState('back', false), 2000);
        break;
      case 'left':
        bot.setControlState('left', true);
        setTimeout(() => bot.setControlState('left', false), 2000);
        break;
      case 'right':
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
      case 'spin':
        bot.look(bot.entity.yaw + Math.PI, bot.entity.pitch);
        break;
    }
  }, 4000);
  
  // Look at players
  setInterval(() => {
    const players = Object.values(bot.players).map(p => p.entity).filter(e => e && e !== bot.entity);
    if (players.length > 0) {
      const nearest = players.sort((a, b) => 
        bot.entity.position.distanceTo(a.position) - bot.entity.position.distanceTo(b.position)
      )[0];
      if (bot.entity.position.distanceTo(nearest.position) < 20) {
        bot.lookAt(nearest.position.offset(0, 1.6, 0));
      }
    }
  }, 2000);
}

// AUTO PICKUP
bot.on('entitySpawn', (entity) => {
  if (entity.kind === 'Drops') {
    bot.collectBlock.collect(entity, (err) => {});
  }
});

// CHAT COMMANDS
bot.on('chat', async (username, message) => {
  if (username === bot.username) return;
  
  const msg = message.toLowerCase();
  
  if (msg === '!help') {
    bot.chat('Commands: !ping, !ai, !come, !follow, !stop, !sneak, !stand, !run, !jump');
    return;
  }
  
  if (msg === '!ping') {
    bot.chat(`Pong ${bot.player.ping}ms`);
    return;
  }
  
  if (msg.startsWith('!ai ')) {
    const question = message.replace('!ai ', '');
    const answer = await ai.ask(question);
    bot.chat(answer);
    return;
  }
  
  if (msg === '!come') {
    const player = bot.players[username]?.entity;
    if (player) {
      bot.lookAt(player.position.offset(0, 1.6, 0));
      bot.setControlState('sprint', true);
      bot.setControlState('forward', true);
      setTimeout(() => {
        bot.setControlState('sprint', false);
        bot.setControlState('forward', false);
      }, 5000);
      bot.chat('Coming!');
    }
    return;
  }
  
  if (msg === '!follow') {
    const player = bot.players[username]?.entity;
    if (player) {
      const followInterval = setInterval(() => {
        if (bot.entity.position.distanceTo(player.position) > 3) {
          bot.lookAt(player.position.offset(0, 1.6, 0));
          bot.setControlState('forward', true);
        } else {
          bot.setControlState('forward', false);
        }
      }, 500);
      bot.chat('Following!');
    }
    return;
  }
  
  if (msg === '!stop') {
    bot.clearControlStates();
    bot.chat('Stopped!');
    return;
  }
  
  if (msg === '!sneak') {
    bot.setControlState('sneak', true);
    bot.chat('Sneaking!');
    return;
  }
  
  if (msg === '!stand') {
    bot.setControlState('sneak', false);
    bot.chat('Standing!');
    return;
  }
  
  if (msg === '!run') {
    bot.setControlState('sprint', true);
    bot.setControlState('forward', true);
    setTimeout(() => {
      bot.setControlState('sprint', false);
      bot.setControlState('forward', false);
    }, 5000);
    bot.chat('Running!');
    return;
  }
  
  if (msg === '!jump') {
    bot.setControlState('jump', true);
    setTimeout(() => bot.setControlState('jump', false), 500);
    bot.chat('Jumping!');
    return;
  }
  
  if (msg.includes('rorke')) {
    const question = message.replace(/rorke/gi, '').trim();
    const answer = await ai.ask(question || 'Hello');
    bot.chat(answer);
  }
});

bot.on('kicked', (reason) => console.log('Kicked:', reason));
bot.on('error', (err) => console.log('Error:', err));
bot.on('end', () => setTimeout(() => process.exit(1), 5000));
