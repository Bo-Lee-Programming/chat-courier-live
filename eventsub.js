/* Twitch EventSub WebSocket adapter. No client secret; credentials stay in memory. */
(() => {
 const subscriptions=[
  ['channel.chat.message','user:read:chat','chat'],
  ['channel.channel_points_custom_reward_redemption.add','channel:read:redemptions','reward'],
  ['channel.subscribe','channel:read:subscriptions','subscribe'],
  ['channel.subscription.gift','channel:read:subscriptions','subscribe'],
  ['channel.subscription.message','channel:read:subscriptions','subscribe'],
  ['channel.cheer','bits:read','cheer'],
  ['channel.raid',null,'raid']
 ];
 class CourierEventSub {
  constructor({onEvent=()=>{},onStatus=()=>{}}={}){this.onEvent=onEvent;this.onStatus=onStatus;this.sockets=new Set();this.seen=new Set();this.generation=0;}
  status(message,extra={}){this.onStatus({message,...extra});}
  async connect({channel,accessToken,clientId}={}){
   this.disconnect(false);const generation=this.generation;
   const token=String(accessToken||'').replace(/^oauth:/,'').trim();
   if(!token||!/^[a-z0-9_]{1,25}$/i.test(channel||''))throw Error('Enter a channel login and an existing Twitch user access token.');
   const validation=await fetch('https://id.twitch.tv/oauth2/validate',{headers:{Authorization:'OAuth '+token}});
   if(!validation.ok)throw Error('Twitch rejected the access token. Authorize your app again.');
   const auth=await validation.json();if(generation!==this.generation)return;
   if(clientId&&clientId!==auth.client_id)throw Error('This token belongs to a different Client ID.');
   this.token=token;this.clientId=auth.client_id;this.userId=auth.user_id;this.scopes=auth.scopes||[];
   if(!this.scopes.includes('user:read:chat')){this.token='';throw Error('This token needs user:read:chat for EventSub chat. An old IRC chat:read token is not sufficient.');}
   const response=await this.api('/users?login='+encodeURIComponent(channel.toLowerCase()));
   const user=response.data?.[0];if(!user)throw Error('Channel not found. Use the login name, not the display name.');
   if(generation!==this.generation)return;
   this.channel=user.login;this.broadcasterId=user.id;this.accepted=[];this.failed=[];
   this.status('Joining Twitch EventSub…',{channel:this.channel});this.open('wss://eventsub.wss.twitch.tv/ws',false,generation);
  }
  async api(path,body){
   const response=await fetch('https://api.twitch.tv/helix'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+this.token,'Client-Id':this.clientId,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
   const data=await response.json();if(!response.ok)throw Error(data.message||`Twitch returned ${response.status}`);return data;
  }
  open(url,migrating,generation,previous){
   const ws=new WebSocket(url);this.sockets.add(ws);
   const arm=seconds=>{clearTimeout(ws.watchdog);ws.watchdog=setTimeout(()=>{ws.close();if(generation===this.generation)this.status('Twitch connection interrupted. Reconnect to continue.',{connected:false});},(seconds+5)*1000);};
   let keepalive=10;
   ws.onmessage=async message=>{
    if(generation!==this.generation)return;
    let packet;try{packet=JSON.parse(message.data);}catch{return;}
    const kind=packet.metadata?.message_type,payload=packet.payload||{};
    arm(keepalive);
    if(kind==='session_welcome'){
     keepalive=payload.session.keepalive_timeout_seconds||10;arm(keepalive);this.socket=ws;
     if(migrating){if(previous){clearTimeout(previous.watchdog);previous.onclose=null;previous.close();this.sockets.delete(previous);}this.status('Twitch connected',{connected:true,channel:this.channel,subscriptions:this.accepted});return;}
     for(const [type,scope] of subscriptions){
      if(generation!==this.generation)return;
      if(scope&&(!this.scopes.includes(scope)||(type!=='channel.chat.message'&&this.userId!==this.broadcasterId))){this.failed.push(type+' — needs channel-owner '+scope);continue;}
      const condition=type==='channel.raid'?{to_broadcaster_user_id:this.broadcasterId}:{broadcaster_user_id:this.broadcasterId,...(type==='channel.chat.message'?{user_id:this.userId}:{})};
      try{await this.api('/eventsub/subscriptions',{type,version:'1',condition,transport:{method:'websocket',session_id:payload.session.id}});this.accepted.push(type);}catch(error){this.failed.push(type+' — '+error.message);}
     }
     this.status(this.accepted.includes('channel.chat.message')?'Twitch connected':'Chat subscription failed',{connected:this.accepted.includes('channel.chat.message'),channel:this.channel,subscriptions:this.accepted,unavailable:this.failed});
    }else if(kind==='session_reconnect'){
     const next=new URL(payload.session.reconnect_url);
     if(next.protocol==='wss:'&&next.hostname==='eventsub.wss.twitch.tv')this.open(next.href,true,generation,ws);
    }else if(kind==='revocation'){
     this.status('Twitch revoked '+payload.subscription?.type+'. Reauthorize if needed.',{connected:false});
    }else if(kind==='notification'){
     const id=packet.metadata.message_id;if(this.seen.has(id))return;this.seen.add(id);if(this.seen.size>2000)this.seen.delete(this.seen.values().next().value);
     const e=payload.event||{},subscription=payload.subscription?.type;
     const type=subscriptions.find(s=>s[0]===subscription)?.[2];if(!type||(subscription==='channel.subscribe'&&e.is_gift))return;
     const event={type,id,source:'TWITCH',at:new Date().toISOString(),user:e.chatter_user_name||e.user_name||e.user_login||e.from_broadcaster_user_name||'Anonymous',userId:e.chatter_user_id||e.user_id||e.from_broadcaster_user_id||'',text:e.message?.text||e.user_input||(typeof e.message==='string'?e.message:'')||e.reward?.title||'',amount:Number(e.bits||e.total||e.viewers||1),rewardId:e.reward?.id||'',rewardTitle:e.reward?.title||'',subscription};
     this.onEvent(event);window.dispatchEvent(new CustomEvent('courier-event',{detail:event}));
    }
   };
   ws.onclose=()=>{clearTimeout(ws.watchdog);this.sockets.delete(ws);if(generation===this.generation&&this.socket===ws)this.status('Twitch disconnected. Reconnect to continue.',{connected:false});};
   ws.onerror=()=>this.status('Could not reach Twitch EventSub.',{connected:false});
  }
  disconnect(notify=true){this.generation++;for(const ws of this.sockets){clearTimeout(ws.watchdog);ws.onmessage=null;ws.onclose=null;ws.onerror=null;ws.close();}this.sockets.clear();this.socket=null;this.token='';this.seen.clear();if(notify)this.status('Disconnected',{connected:false});}
 }
 window.CourierEventSub=CourierEventSub;
})();
