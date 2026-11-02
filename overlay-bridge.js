/* Same-game replication across the controller browser and OBS browser source. */
(() => {
 const isOverlay=new URLSearchParams(location.search).get('overlay')==='1';
 let source,last=0,busy=false;
 const dispatch=(name,data)=>window.dispatchEvent(new CustomEvent(name,{detail:data}));
 if(location.protocol==='http:'||location.protocol==='https:'){
  source=new EventSource('/bridge/events');
  source.addEventListener('state',e=>{if(isOverlay)dispatch('courier-state',JSON.parse(e.data));});
  source.addEventListener('input',e=>{if(!isOverlay)dispatch('courier-event',JSON.parse(e.data));});
  source.addEventListener('connection',e=>dispatch('courier-connection',JSON.parse(e.data)));
  source.onopen=()=>dispatch('courier-bridge',{connected:true});
  source.onerror=()=>dispatch('courier-bridge',{connected:false});
 }
 const post=async(kind,data)=>{const r=await fetch('/bridge/'+kind,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(!r.ok)throw Error('Local bridge unavailable');};
 window.CourierOverlay={isOverlay,
  publish(snapshot){if(isOverlay||busy||performance.now()-last<80||!source)return;last=performance.now();busy=true;post('state',snapshot).catch(()=>{}).finally(()=>busy=false);},
  send:event=>post('input',event),
  connection:status=>post('connection',status),
  close:()=>source?.close()
 };
})();
