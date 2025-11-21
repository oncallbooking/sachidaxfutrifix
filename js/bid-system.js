// bid-system.js — job storage, feed, bids and timers
export const JobStore = {
  async getAll(){
    const raw = localStorage.getItem('ftr_jobs');
    return raw ? JSON.parse(raw) : [];
  },
  async addJob(job){
    const all = await this.getAll();
    all.unshift(job);
    localStorage.setItem('ftr_jobs', JSON.stringify(all));
    // notify other tabs
    window.dispatchEvent(new Event('storage'));
    return job;
  },
  async addBid(jobId, techId, amount){
    const jobs = await this.getAll();
    const j = jobs.find(x=>x.id===jobId);
    if(!j) throw new Error('Job not found');
    j.bids.push({id:'BID-'+Date.now().toString(36), techId, amount, at:Date.now()});
    localStorage.setItem('ftr_jobs', JSON.stringify(jobs));
    window.dispatchEvent(new Event('storage'));
    return j;
  },
  async award(jobId, techId){
    const jobs = await this.getAll();
    const j = jobs.find(x=>x.id===jobId);
    if(!j) throw new Error('Job not found');
    j.status = 'awarded';
    j.awardedTo = techId;
    localStorage.setItem('ftr_jobs', JSON.stringify(jobs));
    window.dispatchEvent(new Event('storage'));
    return j;
  },
  // render feed into #jobFeed
  async renderFeed(){
    const feed = document.getElementById('jobFeed');
    if(!feed) return;
    const tpl = document.getElementById('jobCardTpl');
    const jobs = await this.getAll();
    feed.innerHTML = '';
    jobs.forEach(j=>{
      const node = tpl.content.cloneNode(true);
      node.querySelector('.job-service').textContent = j.category.toUpperCase();
      node.querySelector('.job-location').textContent = j.pin + ' — ' + (j.address.split('\n')[0] || '');
      node.querySelector('.job-budget').textContent = '₹' + j.budget;
      node.querySelector('.job-urgency').textContent = 'Expires in';
      node.querySelector('.job-desc').textContent = j.description.slice(0,180);
      node.querySelector('.bid-count').textContent = (j.bids?.length || 0) + ' bids';
      const timerEl = node.querySelector('.timer');
      const placeBtn = node.querySelector('.placeBid');
      const unlockBtn = node.querySelector('.unlockChat');

      // data attrs
      const article = node.querySelector('article');
      article.dataset.jobid = j.id;
      article.dataset.status = j.status || 'open';

      function updateTimer(){
        const left = j.expiresAt - Date.now();
        if(left<=0){
          timerEl.textContent = 'Closed';
          article.dataset.status = 'closed';
          placeBtn.disabled = true;
          unlockBtn.disabled = true;
        } else {
          const hrs = Math.floor(left/36e5);
          const mins = Math.floor((left%36e5)/6e4);
          const secs = Math.floor((left%6e4)/1000);
          timerEl.textContent = (hrs>0?hrs+'h ':'') + mins+'m '+secs+'s';
        }
      }
      updateTimer();
      // live countdown
      const iv = setInterval(()=>{
        updateTimer();
        if(Date.now() > j.expiresAt + 10000) clearInterval(iv);
      }, 1000);

      placeBtn.addEventListener('click', async ()=>{
        // open minimal bid modal (prompt)
        const techId = prompt('Enter your Technician ID to place a bid (demo):');
        if(!techId) return;
        const amount = prompt('Enter bid amount (₹):');
        if(!amount) return;
        await JobStore.addBid(j.id, techId, Number(amount));
        // re-render feed
        await JobStore.renderFeed();
      });

      unlockBtn.addEventListener('click', async ()=>{
        // check if tech has subscription (fake)
        const techId = prompt('Enter Technician ID to unlock chat (demo):');
        if(!techId) return;
        const subscribed = confirm('Simulate paying subscription to unlock chat? Click OK to simulate payment.');
        if(subscribed){
          // mark unlocked for this tech & job
          const key = 'unlock_'+j.id;
          const map = JSON.parse(localStorage.getItem(key)||'{}');
          map[techId] = true;
          localStorage.setItem(key, JSON.stringify(map));
          alert('Chat unlocked for ' + techId);
        }
      });

      // style when awarded
      if(j.status==='awarded') article.classList.add('awarded');
      feed.appendChild(node);
    });
  }
};

// auto render and listen to storage to update
document.addEventListener('DOMContentLoaded', ()=> {
  JobStore.renderFeed();
  window.addEventListener('storage', ()=> JobStore.renderFeed());
});
