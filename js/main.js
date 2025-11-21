// main.js — Technician search, tech store
export const TechStore = {
  async getAll(){
    const raw = localStorage.getItem('ftr_techs');
    return raw ? JSON.parse(raw) : [];
  },
  async addTech(t){
    const all = await this.getAll();
    all.push(t);
    localStorage.setItem('ftr_techs', JSON.stringify(all));
    window.dispatchEvent(new Event('storage'));
    return t;
  },
  async seedDemo(){
    const demo = [
      {id:'TECH-1', name:'Ravi Kumar', pin:'560001', skills:['electric','battery'], experience:3, price:800, rating:4.5, lat:12.9716, lng:77.5946},
      {id:'TECH-2', name:'Neha Patel', pin:'560001', skills:['tyres','software'], experience:5, price:1200, rating:4.8, lat:12.975, lng:77.59},
      {id:'TECH-3', name:'Amit Singh', pin:'560002', skills:['electric'], experience:1, price:400, rating:4.2, lat:12.965, lng:77.6},
      {id:'TECH-4', name:'Pooja Rao', pin:'560001', skills:['battery','software'], experience:6, price:1500, rating:4.9, lat:12.973, lng:77.598}
    ];
    localStorage.setItem('ftr_techs', JSON.stringify(demo));
    window.dispatchEvent(new Event('storage'));
  }
};

import { JobStore } from './bid-system.js';

// UI wiring
document.addEventListener('DOMContentLoaded', async () => {
  const pinInput = document.getElementById('pinInput');
  const techList = document.getElementById('techList');
  const techTpl = document.getElementById('techCardTpl');
  const serviceFilter = document.getElementById('serviceFilter');
  const expFilter = document.getElementById('expFilter');
  const priceFilter = document.getElementById('priceFilter');
  const demoSeedBtn = document.getElementById('demoSeedBtn');

  // Populate service select from tech data
  async function refreshServices(){
    const techs = await TechStore.getAll();
    const services = new Set();
    techs.forEach(t=>t.skills.forEach(s=>services.add(s)));
    serviceFilter.innerHTML = '<option value="">All Services</option>' + [...services].map(s=>`<option value="${s}">${s.toUpperCase()}</option>`).join('');
  }

  function renderTechs(list){
    techList.innerHTML = '';
    list.forEach(t=>{
      const node = techTpl.content.cloneNode(true);
      node.querySelector('.name').textContent = t.name;
      node.querySelector('.rating').textContent = '★ ' + t.rating;
      node.querySelector('.skills').textContent = t.skills.join(', ');
      node.querySelector('.distance').textContent = (Math.random()*8+1).toFixed(1) + ' km';
      node.querySelector('.start-price').textContent = 'From ₹' + t.price;
      const mapThumb = node.querySelector('.map-thumb');
      mapThumb.dataset.lat = t.lat || 12.9716;
      mapThumb.dataset.lng = t.lng || 77.5946;
      mapThumb.querySelector('.map-inner').id = 'map_'+t.id;
      techList.appendChild(node);
      // init small map
      setTimeout(()=> {
        try {
          const map = L.map('map_'+t.id, {attributionControl:false,zoomControl:false}).setView([mapThumb.dataset.lat, mapThumb.dataset.lng], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{detectRetina:false}).addTo(map);
          L.marker([mapThumb.dataset.lat, mapThumb.dataset.lng]).addTo(map);
          map.dragging.disable(); map.touchZoom.disable(); map.doubleClickZoom.disable(); map.scrollWheelZoom.disable();
        } catch(e){}
      }, 100);
    });
  }

  async function queryByPin(pin){
    const techs = await TechStore.getAll();
    let filtered = techs.filter(t=>t.pin && t.pin.startsWith(pin));
    // apply filters
    const service = serviceFilter.value;
    if(service) filtered = filtered.filter(t=>t.skills.includes(service));
    const exp = expFilter.value;
    if(exp){
      if(exp==='0-1') filtered = filtered.filter(t=>t.experience<=1);
      if(exp==='2-4') filtered = filtered.filter(t=>t.experience>=2 && t.experience<=4);
      if(exp==='5+') filtered = filtered.filter(t=>t.experience>=5);
    }
    const price = priceFilter.value;
    if(price){
      if(price==='0-499') filtered = filtered.filter(t=>t.price<=499);
      if(price==='500-1499') filtered = filtered.filter(t=>t.price>=500 && t.price<=1499);
      if(price==='1500+') filtered = filtered.filter(t=>t.price>=1500);
    }
    renderTechs(filtered);
  }

  pinInput.addEventListener('input', (e)=> {
    const v = e.target.value.trim();
    if(v.length>=3) queryByPin(v);
    else techList.innerHTML = '<div class="card muted">Enter at least 3 digits of PIN to auto-load results</div>';
  });

  [serviceFilter, expFilter, priceFilter].forEach(el=>el.addEventListener('change', ()=> {
    const v = pinInput.value.trim();
    if(v.length>=3) queryByPin(v);
  }));

  demoSeedBtn.addEventListener('click', async ()=> {
    await TechStore.seedDemo();
    await refreshServices();
    if(pinInput.value.trim().length>=3) queryByPin(pinInput.value.trim());
  });

  // initial
  document.getElementById('jobFeed') && JobStore.renderFeed(); // render if present
  await refreshServices();
  techList.innerHTML = '<div class="card muted">Enter a PIN code to load technicians</div>';
});
