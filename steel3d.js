import * as THREE from './vendor/three.module.js';
import { startCanvasSteel } from './steel-fallback.js';
const stage=document.querySelector('.steel-stage');
if(stage){
 try{
 const host=stage.querySelector('.model-canvas');
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.5;host.appendChild(renderer.domElement);
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(34,1,.1,100);camera.position.set(0,.5,8.6);
 scene.add(new THREE.HemisphereLight(0xdcefff,0x263845,3));
 const light=new THREE.DirectionalLight(0xffffff,5);light.position.set(3,5,5);scene.add(light);
 const rim=new THREE.DirectionalLight(0xf08b57,4);rim.position.set(-4,1,-2);scene.add(rim);
 const fill=new THREE.DirectionalLight(0x8bb8df,4);fill.position.set(-3,2,4);scene.add(fill);
 const steel=new THREE.MeshStandardMaterial({color:0xaebfcd,metalness:.72,roughness:.28});
 const edge=new THREE.MeshStandardMaterial({color:0x71899a,metalness:.7,roughness:.4});
 const group=new THREE.Group();scene.add(group);let model,kind,angle=0,drag=false,lastX=0,lastY=0,rotX=-.3,rotY=-.4,visible=true,last=0,elapsed=0;
 const names={beam:'STRUCTURAL / I-BEAM',coil:'FLAT STEEL / COIL',bars:'LONG PRODUCTS / BARS',pipes:'HOLLOW SECTIONS / PIPES'};
 function mesh(geometry,material=steel,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);model.add(m);return m}
 function build(type){kind=type;if(model){group.remove(model);model.traverse(o=>o.geometry?.dispose())}model=new THREE.Group();group.add(model);
 if(type==='beam'){
 for(let i=0;i<3;i++){const x=(i-1)*1.02;const y=(i-1)*.28;mesh(new THREE.BoxGeometry(.78,.16,3.5),steel,x,y+.66,0);mesh(new THREE.BoxGeometry(.78,.16,3.5),steel,x,y-.66,0);mesh(new THREE.BoxGeometry(.15,1.2,3.5),edge,x,y,0)}
 model.rotation.set(.3,-.35,.35);model.scale.setScalar(.9);
 }else if(type==='coil'){
 const shape=new THREE.Shape();shape.absarc(0,0,1.4,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,.66,0,Math.PI*2,true);shape.holes.push(hole);const g=new THREE.ExtrudeGeometry(shape,{depth:1.7,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.015,bevelThickness:.015,curveSegments:80});g.translate(0,0,-.85);mesh(g);for(let r=.7;r<1.4;r+=.035){for(const z of [-.867,.867]){const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.004,3,80),edge);ring.position.z=z;model.add(ring)}}model.rotation.set(.15,-.6,.2);
 }else if(type==='bars'){
 for(let i=0;i<7;i++){const x=(i%3-1)*.55,y=(Math.floor(i/3)-1)*.49;const bar=mesh(new THREE.CylinderGeometry(.2,.2,3.7,20),steel,x,y,0);bar.rotation.x=Math.PI/2;for(let z=-1.65;z<1.75;z+=.2){const rib=mesh(new THREE.TorusGeometry(.205,.025,5,16),edge,x,y,z);rib.rotation.z=.25}}model.rotation.set(.5,-.4,.45);
 }else{
 for(let i=0;i<5;i++){const x=(i%3-1)*.9,y=(Math.floor(i/3)-.5)*.8;const s=new THREE.Shape();s.absarc(0,0,.38,0,Math.PI*2,false);const h=new THREE.Path();h.absarc(0,0,.29,0,Math.PI*2,true);s.holes.push(h);const g=new THREE.ExtrudeGeometry(s,{depth:3.4,bevelEnabled:false,curveSegments:40});g.translate(0,0,-1.7);mesh(g,steel,x,y,0)}model.rotation.set(.3,-.45,.35);
 }
 stage.querySelector('.model-name').textContent=names[type];host.setAttribute('aria-label',`Interactive 3D ${names[type].toLowerCase()}. Drag or use arrow keys to rotate.`);model.scale.multiplyScalar(.92);stage.dataset.rendered=type;
 }
 build(stage.dataset.model||'beam');
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();camera.position.z=w<400?10:8.6};new ResizeObserver(resize).observe(host);resize();
 new IntersectionObserver(e=>{visible=e[0].isIntersecting},{threshold:0}).observe(stage);
 host.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;drag=true;lastX=e.clientX;lastY=e.clientY;host.setPointerCapture(e.pointerId)});
 host.addEventListener('pointermove',e=>{if(drag){rotY+=(e.clientX-lastX)*.008;rotX+=(e.clientY-lastY)*.008;lastX=e.clientX;lastY=e.clientY}});host.addEventListener('pointerup',()=>drag=false);host.addEventListener('pointercancel',()=>drag=false);
 host.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')rotY-=.15;if(e.key==='ArrowRight')rotY+=.15;if(e.key==='ArrowUp')rotX-=.15;if(e.key==='ArrowDown')rotX+=.15}});
 // Touch rotates horizontally; vertical gestures remain available for page scrolling.
 let touchX=0;host.addEventListener('touchstart',e=>{touchX=e.touches[0].clientX},{passive:true});host.addEventListener('touchmove',e=>{rotY+=(e.touches[0].clientX-touchX)*.007;touchX=e.touches[0].clientX},{passive:true});
 window.addEventListener('steelmodel',e=>build(e.detail));
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();stage.classList.add('failed')});
 function draw(now){requestAnimationFrame(draw);if(now-last<33)return;const dt=Math.min((now-last)/1000,.05);last=now;if(!visible||document.hidden)return;if(!window.steelMotion?.paused&&!drag){elapsed+=dt;angle+=dt*.14}group.rotation.set(rotX+Math.sin(elapsed*.45)*.055,rotY+angle,0);group.position.y=Math.sin(elapsed*.7)*.085;renderer.render(scene,camera)}requestAnimationFrame(draw);
 }catch(error){try{startCanvasSteel(stage)}catch{stage.classList.add('failed')}}
}
