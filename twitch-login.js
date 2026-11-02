/* Twitch's browser OAuth flow. Only non-secret setup and a random state persist. */
(() => {
 const form=document.getElementById('form'),client=document.getElementById('client'),channel=document.getElementById('channel'),error=document.getElementById('error');
 const redirect=new URL('CONNECT.html',location.href).origin+'/CONNECT.html';
 const authorize=document.createElement('button');authorize.type='button';authorize.textContent='Authorize with Twitch';
 const hint=document.createElement('small');hint.textContent='First time: register your Twitch app, paste its Client ID, then authorize. Registered redirect URL: '+redirect;
 const advanced=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Advanced: use an existing access token';advanced.append(summary);
 const token=document.getElementById('token'),tokenLabel=document.querySelector('label[for="token"]'),tokenHint=token.nextElementSibling;
 form.insertBefore(authorize,tokenLabel);form.insertBefore(hint,tokenLabel);form.insertBefore(advanced,tokenLabel);advanced.append(tokenLabel,token,tokenHint,document.getElementById('connect'));
 const setup=JSON.parse(sessionStorage.getItem('courier-setup')||'null');if(setup){client.value=setup.clientId||'';channel.value=setup.channel||'';}
 authorize.onclick=()=>{
  error.textContent='';if(!channel.checkValidity()||!channel.value.trim()){channel.reportValidity();return;}
  if(!client.value.trim()){error.textContent='Paste the Client ID from your Twitch application first.';client.focus();return;}
  const state=crypto.randomUUID();sessionStorage.setItem('courier-oauth-state',state);sessionStorage.setItem('courier-setup',JSON.stringify({channel:channel.value.trim(),clientId:client.value.trim()}));
  const params=new URLSearchParams({client_id:client.value.trim(),redirect_uri:redirect,response_type:'token',scope:'user:read:chat channel:read:redemptions channel:read:subscriptions bits:read',state});
  location.assign('https://id.twitch.tv/oauth2/authorize?'+params);
 };
 const result=new URLSearchParams(location.hash.slice(1)),query=new URLSearchParams(location.search);
 if(result.has('access_token')||query.has('error')){
  history.replaceState(null,'',location.pathname);const expected=sessionStorage.getItem('courier-oauth-state');sessionStorage.removeItem('courier-oauth-state');
  if(!expected||result.get('state')!==expected){error.textContent=query.get('error_description')||'Authorization state did not match. Please authorize again.';return;}
  token.value=result.get('access_token');form.requestSubmit();
 }
})();
