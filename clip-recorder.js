/* Record only the game canvas: no desktop, microphone, login fields or tokens. */
(() => {
 if(new URLSearchParams(location.search).get('overlay')==='1')return;
 const panel=document.getElementById('panel'),canvas=document.getElementById('c');
 if(!panel||!canvas)return;
 const heading=document.createElement('h3');heading.textContent='Save a highlight';
 const button=document.createElement('button');button.textContent='Record game clip';
 const status=document.createElement('div');status.className='hint';status.setAttribute('role','status');status.textContent='Records the game only, up to 2m 45s. No microphone or desktop capture.';
 panel.append(heading,button,status);
 let recorder,stream,timer,tick,started;
 button.onclick=()=>{
  if(recorder?.state==='recording'){recorder.stop();return;}
  if(!canvas.captureStream||!window.MediaRecorder){status.textContent='Clip recording needs a recent Chrome or Edge browser.';return;}
  try{
   stream=canvas.captureStream(30);
   const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
   recorder=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:6000000}:{});const chunks=[];
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   recorder.onstop=()=>{
    clearTimeout(timer);clearInterval(tick);stream.getTracks().forEach(t=>t.stop());
    const blob=new Blob(chunks,{type:recorder.mimeType}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='Chat-Courier-clip-'+new Date().toISOString().replace(/[:.]/g,'-')+'.webm';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
    button.textContent='Record game clip';status.textContent='Clip saved. Rehearsal footage remains labelled as rehearsal.';
   };
   recorder.onerror=()=>{status.textContent='Recording failed. Try again in Chrome or Edge.';};
   recorder.start(1000);started=performance.now();button.textContent='Stop and save clip';
   tick=setInterval(()=>{status.textContent='Recording '+Math.floor((performance.now()-started)/1000)+'s / 165s — keep this game visible.';},500);
   timer=setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},165000);
  }catch(error){stream?.getTracks().forEach(t=>t.stop());status.textContent='Recording could not start: '+error.message;}
 };
})();
