// chat-lock.js — chat UI, unlock and validation
// Simple validation to detect phone numbers or emails in messages
export function containsContact(text){
  if(!text) return false;
  const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRe = /(?:\+?\d{2,3}[\s-]?)?(?:\d[\s-]?){6,12}\d/;
  return emailRe.test(text) || phoneRe.test(text);
}

// Expose a small chat launcher for awarded jobs
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('.unlockChat');
  if(!btn) return;
  const article = btn.closest('article');
  const jobId = article.dataset.jobid;
  const techId = prompt('Enter Technician ID to open chat (demo):');
  if(!techId) return;
  // check unlock map
  const map = JSON.parse(localStorage.getItem('unlock_'+jobId) || '{}');
  const ok = map[techId] || false;
  if(!ok){
    alert('Chat is locked for this technician. Unlock via subscription first.');
    return;
  }
  openChatWindow(jobId, techId);
});

function openChatWindow(jobId, techId){
  const chatWin = window.open('', '_blank', 'width=420,height=700');
  chatWin.document.write(`<html><head><title>Chat ${jobId}</title><link rel="stylesheet" href="/css/styles.css"></head><body><div style="padding:12px"><h3>Chat — ${jobId}</h3><div id="msgs" style="height:400px;overflow:auto;border:1px solid #eee;padding:8px;background:#fff;border-radius:8px"></div><div style="margin-top:8px"><input id="msgInput" style="width:70%;padding:8px"/><button id="sendBtn">Send</button></div></div></body></html>`);
  chatWin.document.close();

  const win = chatWin;
  win.onload = () => {
    const sendBtn = win.document.getElementById('sendBtn');
    const input = win.document.getElementById('msgInput');
    const msgs = win.document.getElementById('msgs');
    sendBtn.addEventListener('click', ()=>{
      const txt = input.value.trim();
      if(!txt) return;
      if(containsContact(txt)){
        alert('Sharing phone numbers or emails is not allowed in chat.');
        return;
      }
      const el = win.document.createElement('div');
      el.textContent = 'You: ' + txt;
      msgs.appendChild(el);
      input.value = '';
      // add auto close timer indicator
      const closeAt = Date.now() + 1000*60*30; // 30 min demo
      const timer = win.setInterval(()=> {
        const left = closeAt - Date.now();
        if(left<=0){
          const note = win.document.createElement('div');
          note.className='muted';
          note.textContent = 'Chat closed by customer.';
          msgs.appendChild(note);
          win.clearInterval(timer);
        }
      }, 1000);
    });
  };
}
