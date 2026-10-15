import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const root = document.querySelector('.product-studio');
const host = root.querySelector('.studio-canvas');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const products = [
  { name: 'Taça', category: 'Mesa & encontros', title: 'Um brinde aos <br>bons momentos.', description: 'Pequenos detalhes que transformam a arte de receber.', cta: 'Consultar taças', bg: '#efc5b9', ink: '#4e2927', interest: 'Taças' },
  { name: 'Chaleira', category: 'Cozinha & rituais', title: 'Uma pausa. <br>Um novo ritual.', description: 'O prazer de preparar algo especial, todos os dias.', cta: 'Consultar chaleiras', bg: '#ced5b5', ink: '#343e2b', interest: 'Chaleiras' },
  { name: 'Air Fryer', category: 'Praticidade & sabor', title: 'Mais sabor. <br>Mais tempo para você.', description: 'Inspiração para uma cozinha que acompanha o seu ritmo.', cta: 'Consultar air fryers', bg: '#c8bde3', ink: '#3d3055', interest: 'Air fryers' },
  { name: 'Almofada', category: 'Texturas & aconchego', title: 'Seu cantinho. <br>Seu abraço.', description: 'Um toque de aconchego para os seus momentos de descanso.', cta: 'Consultar almofadas', bg: '#edcc99', ink: '#51402a', interest: 'Almofadas' },
];
let selected = 0;
let paused = reducedMotion.matches;
let visible = false;
let dragging = false;
let lastX = 0;
let dragRotation = 0;
let renderer, scene, camera, models, ornaments, observer;
let previousTime = 0, time = 0, frame = 0;
let switchTime = 0;
const motionButton = root.querySelector('[data-studio-motion]');
const buttons = [...root.querySelectorAll('[data-product]')];
function syncMotion() {
  motionButton.textContent = paused ? 'Ativar animação' : 'Pausar animação';
  motionButton.setAttribute('aria-pressed', String(paused));
}
function selectProduct(index) {
  selected = (index + products.length) % products.length;
  const product = products[selected];
  root.style.setProperty('--studio-bg', product.bg);
  root.style.setProperty('--studio-ink', product.ink);
  root.querySelector('.studio-word').textContent = product.name;
  root.querySelector('[data-studio-category]').textContent = product.category;
  root.querySelector('#studio-title').innerHTML = product.title;
  root.querySelector('[data-studio-description]').textContent = product.description;
  const cta = root.querySelector('[data-studio-cta]');
  cta.firstChild.textContent = product.cta + ' ';
  cta.href = 'https://wa.me/5537988424250?text=' + encodeURIComponent(`Olá! Gostaria de conhecer os modelos disponíveis de ${product.interest.toLowerCase()} da CMC Enxovais.`);
  host.setAttribute('aria-label', `Representação 3D ilustrativa de ${product.name}. Arraste ou use as setas esquerda e direita para girar.`);
  buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === selected)));
  const copy = root.querySelector('.studio-copy');
  copy.classList.remove('is-entering');
  void copy.offsetWidth;
  copy.classList.add('is-entering');
  dragRotation = 0;
  switchTime = time;
  if (models) {
    models.forEach((model, i) => { model.visible = i === selected; });
    ornaments.forEach((group, i) => { group.visible = i === selected; });
  }
  if (renderer) draw();
}
buttons.forEach(button => button.addEventListener('click', () => selectProduct(Number(button.dataset.product))));
root.querySelector('[data-studio-prev]').addEventListener('click', () => selectProduct(selected - 1));
root.querySelector('[data-studio-next]').addEventListener('click', () => selectProduct(selected + 1));
motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); schedule(); });
reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; syncMotion(); schedule(); });
syncMotion();
selectProduct(0);

function material(color, options = {}) { return new THREE.MeshStandardMaterial({ color, roughness: .3, metalness: .05, ...options }); }
function mesh(group, geometry, mat, x=0, y=0, z=0) {
  const object = new THREE.Mesh(geometry, mat);
  object.position.set(x,y,z);
  group.add(object);
  return object;
}
function lathe(group, points, mat) { return mesh(group, new THREE.LatheGeometry(points.map(([r,y]) => new THREE.Vector2(r,y)), 96), mat); }
function tube(group, points, radius, mat) { return mesh(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 64, radius, 12, false), mat); }
function rounded(group, width, height, depth, radius, mat, x=0,y=0,z=0) { return mesh(group, new RoundedBoxGeometry(width,height,depth,5,radius),mat,x,y,z); }
const gold = material('#bc8c4b', { metalness:.85, roughness:.22 });
const dark = material('#22262b', { roughness:.25, metalness:.3 });
function glass() {
  const group = new THREE.Group();
  const crystal = new THREE.MeshPhysicalMaterial({ color:'#f7ddd1', metalness:0, roughness:.08, transmission:0, thickness:.17, ior:1.48, transparent:true, opacity:.26, depthWrite:false, side:THREE.DoubleSide });
  lathe(group, [[0,-1.42],[.45,-1.42],[.53,-1.38],[.51,-1.34],[.12,-1.31],[.055,-1.18],[.045,-.28],[.12,-.18],[.31,-.1],[.5,.12],[.63,.45],[.67,.79],[.63,1.15],[.60,1.32],[.575,1.32],[.60,1.14],[.64,.79],[.60,.45],[.47,.14],[.29,-.06],[.1,-.14]], crystal);
  const rim = mesh(group, new THREE.TorusGeometry(.587,.012,12,96),gold,0,1.32); rim.rotation.x = Math.PI/2;
  lathe(group, [[0,-.06],[.28,-.02],[.46,.16],[.57,.42],[.6,.64],[0,.64]], new THREE.MeshPhysicalMaterial({color:'#a63a46',roughness:.15,transmission:.3,thickness:.6,transparent:true,opacity:.88}));
  return group;
}
function kettle() {
  const group = new THREE.Group();
  const enamel = material('#eee7ce', {roughness:.23,metalness:.18});
  lathe(group, [[0,-1],[.55,-1],[.75,-.92],[.89,-.65],[.9,-.22],[.79,.2],[.53,.55],[.48,.62],[0,.62]],enamel);
  lathe(group, [[0,.64],[.49,.64],[.51,.69],[.43,.77],[.25,.82],[0,.82]],enamel);
  mesh(group,new THREE.SphereGeometry(.12,24,16),gold,0,.93);
  tube(group, [[-.67,-.35,0],[-1,-.12,0],[-1.14,.35,0],[-1.42,.65,0]],.14,enamel);
  const spout=mesh(group,new THREE.TorusGeometry(.14,.025,12,32),gold,-1.42,.65); spout.rotation.y=Math.PI/2;spout.rotation.x=-.5;
  tube(group, [[.64,.4,0],[1.12,.63,0],[1.38,.25,0],[1.34,-.38,0],[.82,-.68,0]],.095,dark);
  lathe(group, [[.55,-1.02],[.73,-1.02],[.77,-.97],[.73,-.91]],gold);
  group.rotation.z=-.08;
  return group;
}
function fryer() {
  const group = new THREE.Group();
  const body=material('#e5dcd4',{roughness:.28,metalness:.18});
  rounded(group,1.75,2.3,1.55,.33,body,0,0,0);
  rounded(group,1.48,.63,.12,.15,dark,0,.63,.745);
  const screen=material('#a7e4d4',{emissive:'#6cbaa9',emissiveIntensity:.4});
  // Seven-segment display: 180°.
  const digits=[[1,1,1,1,1,1,0],[0,1,1,0,0,0,0],[1,1,1,1,1,1,1]];
  [digits[1],digits[2],digits[0]].forEach((segments,i)=>{
    const x=-.35+i*.27;
    const coords=[[0,.15,0],[.08,.08,1],[.08,-.08,1],[0,-.15,0],[-.08,-.08,1],[-.08,.08,1],[0,0,0]];
    segments.forEach((on,j)=>{if(on){const [dx,dy,vertical]=coords[j];rounded(group,vertical?.016:.12,vertical?.105:.016,.01,.005,screen,x+dx,.64+dy,.818);}});
  });
  mesh(group,new THREE.TorusGeometry(.035,.009,8,20),screen,.49,.78,.818);
  rounded(group,1.5,1.1,.15,.22,body,0,-.36,.77);
  tube(group,[[-.65,.20,.825],[0,.18,.84],[.65,.20,.825]],.009,dark);
  rounded(group,.23,.76,.27,.065,gold,0,-.3,.94);
  rounded(group,.14,.61,.12,.04,dark,0,-.29,1.08);
  for(let i=0;i<7;i++)rounded(group,.08,.025,.014,.005,dark,-.36+i*.12,-.83,.852);
  group.rotation.y=-.27;
  return group;
}
function cushion() {
  const group = new THREE.Group();
  const geometry = new THREE.SphereGeometry(1,80,64);
  const positions = geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i), y=positions.getY(i), z=positions.getZ(i);
    positions.setXYZ(i,Math.sign(x)*Math.pow(Math.abs(x),.55)*1.12,Math.sign(y)*Math.pow(Math.abs(y),.55)*1.12,z*.44);
  }
  geometry.computeVertexNormals();
  const textureCanvas=document.createElement('canvas');textureCanvas.width=textureCanvas.height=128;
  const ctx=textureCanvas.getContext('2d');
  ctx.fillStyle='#b87746';ctx.fillRect(0,0,128,128);
  for(let i=0;i<128;i+=4){ctx.fillStyle='#d79a67';ctx.fillRect(i,0,1,128);ctx.fillStyle='#a86b3c';ctx.fillRect(0,i,128,1);}
  const texture=new THREE.CanvasTexture(textureCanvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(8,8);texture.colorSpace=THREE.SRGBColorSpace;
  mesh(group,geometry,material('#fff2e0',{map:texture,roughness:.95,bumpMap:texture,bumpScale:.018}));
  const seam=[];
  for(let i=0;i<=128;i++){const a=i/128*Math.PI*2;seam.push(new THREE.Vector3(Math.sign(Math.cos(a))*Math.pow(Math.abs(Math.cos(a)),.55)*1.125,Math.sign(Math.sin(a))*Math.pow(Math.abs(Math.sin(a)),.55)*1.125,0));}
  mesh(group,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seam),160,.018,6,false),material('#e3b88c',{roughness:1}));
  group.rotation.set(.05,-.35,-.16);
  return group;
}
function makeOrnaments(index) {
  const group=new THREE.Group();
  const colors=['#be6671','#a7b482','#9b85bd','#c99558'];
  const mat=material(colors[index],{roughness:.4,metalness:.18});
  const positions=[[-1.75,1.35,-.8],[1.8,-.5,-.6],[1.6,1.55,-1],[-1.7,-1.05,-.8]];
  positions.forEach(([x,y,z],i)=>{
    let geometry;
    if(index===0)geometry=new THREE.TorusGeometry(.25+i*.03,.028,12,48);
    if(index===1)geometry=new THREE.SphereGeometry(.27,24,16);
    if(index===2)geometry=new RoundedBoxGeometry(.38,.38,.38,3,.08);
    if(index===3)geometry=new THREE.TorusKnotGeometry(.16,.047,48,8);
    const object=mesh(group,geometry,mat,x,y,z);
    if(index===1)object.scale.set(1,.23,1.5);
    object.rotation.set(i*.8,.5,i);
    object.userData.baseY=y;
  });
  return group;
}
function draw() {
  if(!renderer)return;
  const model=models[selected];
  const delta = time-switchTime;
  const enter = reducedMotion.matches || paused ? 1 : Math.min(1,delta*2.5);
  model.scale.setScalar(.88+.12*enter);
  model.position.y=paused?0:Math.sin(time*.9)*.075;
  model.rotation.y=model.userData.baseY + dragRotation + (paused?0:Math.sin(time*.45)*.22);
  ornaments[selected].children.forEach((object,i)=>{
    object.position.y=object.userData.baseY+(paused?0:Math.sin(time*.7+i)*.13);
    object.rotation.z=i+(paused?0:time*.12);
  });
  renderer.render(scene,camera);
}
function tick(now) {
  frame=0;
  if(!visible || document.hidden)return;
  if(previousTime) time+=(now-previousTime)/1000;
  previousTime=now;
  if(!paused && !dragging && time-switchTime>7 && !root.matches(':hover') && !root.contains(document.activeElement))selectProduct(selected+1);
  draw();
  if(!paused) frame=requestAnimationFrame(tick);
}
function schedule(){
  if(!renderer)return;
  if(frame)cancelAnimationFrame(frame);
  frame=0;previousTime=0;
  if(visible && !document.hidden)frame=requestAnimationFrame(tick);
}
function fallback() {
  if(frame)cancelAnimationFrame(frame);
  renderer=null;
  host.replaceChildren();
  const note=document.createElement('span');note.className='studio-loading';note.textContent='A visualização 3D não está disponível neste navegador. Explore os produtos abaixo ou consulte nossa equipe.';host.append(note);
  root.querySelector('[data-studio-hint]').textContent='Conheça os produtos usando os botões abaixo';
  motionButton.hidden=true;
}
function initialize() {
  try {
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
    renderer.setClearColor(0x000000,0);
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.2;
    host.replaceChildren(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden','true');
    renderer.domElement.addEventListener('webglcontextlost',(event)=>{event.preventDefault();fallback();});
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(34,1,.1,100);camera.position.set(0,.3,8.1);camera.lookAt(0,0,0);
    const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();
    const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;pmrem.dispose();room.dispose();
    scene.add(new THREE.HemisphereLight('#fff9ed','#a08070',2.2));
    const key=new THREE.DirectionalLight('#ffffff',3);key.position.set(3,5,4);scene.add(key);
    models=[glass(),kettle(),fryer(),cushion()];
    ornaments=products.map((_,index)=>makeOrnaments(index));
    models.forEach((model,index)=>{model.visible=index===selected;model.userData.baseY=model.rotation.y;scene.add(model);ornaments[index].visible=index===selected;scene.add(ornaments[index]);});
    // Soft contact shadow, generated locally without external assets.
    const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;
    const ctx=shadowCanvas.getContext('2d');const gradient=ctx.createRadialGradient(64,64,2,64,64,64);gradient.addColorStop(0,'rgba(47,26,20,.25)');gradient.addColorStop(1,'rgba(47,26,20,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
    const shadow=mesh(scene,new THREE.PlaneGeometry(3.1,1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}),0,-1.65,-.5);shadow.rotation.x=-.75;
    const resize=()=>{const {width,height}=host.getBoundingClientRect();if(!width||!height||!renderer)return;renderer.setSize(width,height);camera.aspect=width/height;camera.position.z=camera.aspect<.9?10:8.1;camera.updateProjectionMatrix();draw();};
    new ResizeObserver(resize).observe(host);resize();schedule();
  } catch(error) { console.warn('Visualização 3D indisponível:',error.message);fallback(); }
}
host.addEventListener('pointerdown',event=>{if(event.button!==0 || !renderer)return;dragging=true;lastX=event.clientX;});
host.addEventListener('pointermove',event=>{if(!dragging)return;const delta=event.clientX-lastX;if(Math.abs(delta)>2 && !host.hasPointerCapture(event.pointerId))host.setPointerCapture(event.pointerId);dragRotation+=delta*.012;lastX=event.clientX;draw();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])host.addEventListener(event,()=>{dragging=false;});
host.addEventListener('pointerleave',()=>{dragging=false;});
host.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();dragRotation+=(event.key==='ArrowLeft'?-.2:.2);draw();}});
document.addEventListener('visibilitychange',schedule);
observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&!renderer&&!host.dataset.initialized){host.dataset.initialized='true';initialize();}schedule();},{rootMargin:'150px'});
observer.observe(root);
