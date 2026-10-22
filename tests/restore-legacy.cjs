const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const a=html.indexOf('async function tryRestore() {'),b=html.indexOf('// ============================================================',a);
async function check(broken){
 const strokes=[{path:[{x:1,y:1}],scale:1},{brushId:'ok',path:[],scale:1}];
 const brushes=[{id:'ok',srcData:'ok'}];
 if(broken){brushes.push({id:'bad',srcData:'bad'});strokes.push({brushId:'bad',path:[]});}
 const state={brushes:[]},status=[];const canvas={width:10,height:10};let writes=0;
 const ctx=vm.createContext({state,setStatus:(...x)=>status.push(x),mainCanvas:canvas,committedCanvas:canvas,offscreenCanvas:canvas,$:()=>null,drawSourcePreview(){},rebuildCommitted(){},paint(){},restoring:false,STORAGE_KEY:'fixture',localStorage:{getItem:()=>JSON.stringify({brushes,strokes}),setItem(){writes++}},loadImageFromDataURL:async u=>{if(u==='bad')throw Error('bad image');return{};},renderBrushList(){}});
 vm.runInContext(html.slice(a,b),ctx);await vm.runInContext('tryRestore()',ctx);
 assert.equal(state.strokes.length,2);assert.equal(state.brushes.length,1);assert.equal(writes,0);assert.equal(status[0][0],broken?'warn':'ok');
}
(async()=>{await check(false);await check(true);console.log('PASS legacy strokes survive; only strokes referencing failed brushes are skipped; no rewrite');})().catch(e=>{console.error(e);process.exitCode=1});
