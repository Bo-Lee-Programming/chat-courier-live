import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname,basename} from 'node:path';
const peers=new Set();let latest=null,connection={connected:false,message:'Not connected'};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'};
function broadcast(kind,data){const chunk=`event: ${kind}\ndata: ${JSON.stringify(data)}\n\n`;for(const peer of peers)peer.write(chunk);}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1:8787'),path=url.pathname;
  if(path==='/bridge/events'&&req.method==='GET'){
   res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.write(': connected\n\n');peers.add(res);
   res.write(`event: connection\ndata: ${JSON.stringify(connection)}\n\n`);
   if(latest)res.write(`event: state\ndata: ${JSON.stringify(latest)}\n\n`);
   req.on('close',()=>peers.delete(res));return;
  }
  if(req.method==='POST'&&['/bridge/state','/bridge/input','/bridge/connection'].includes(path)){
   if(req.headers.origin&&!['http://127.0.0.1:8787','http://localhost:8787'].includes(req.headers.origin)){res.writeHead(403);res.end();return;}
   let text='';for await(const part of req){text+=part;if(text.length>1000000){res.writeHead(413);res.end();return;}}
   const data=JSON.parse(text),kind=path.split('/').pop();
   if(kind==='state')latest=data;if(kind==='connection')connection=data;
   broadcast(kind,data);res.writeHead(204);res.end();return;
  }
  if(req.method!=='GET'){res.writeHead(405);res.end();return;}
  const name=path==='/'?'LIVE.html':decodeURIComponent(path.slice(1));
  if(basename(name)!==name||!mime[extname(name)]||name.startsWith('.')){res.writeHead(404);res.end();return;}
  const data=await readFile(new URL(name,import.meta.url));res.writeHead(200,{'Content-Type':mime[extname(name)],'Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
setInterval(()=>{for(const peer of peers)peer.write(': heartbeat\n\n');},15000).unref();
server.listen(8787,'127.0.0.1',()=>console.log('Chat Courier LIVE: http://127.0.0.1:8787/LIVE.html\nTwitch connection: http://127.0.0.1:8787/CONNECT.html\nOBS Browser Source: http://127.0.0.1:8787/LIVE.html?overlay=1 (1920 x 1080)'));
