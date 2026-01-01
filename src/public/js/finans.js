async function fetchJSON(url){const r=await fetch(url);return r.json();}

let chartFinans=null;

async function loadFinans(yil){
  const {ok,data}=await fetchJSON(`/api/finans/aylik?yil=${encodeURIComponent(yil)}`);
  if(!ok) return;
  const labels=data.map(x=>x.ay);
  const gelir=data.map(x=>Number(x.gelir||0));
  const gider=data.map(x=>Number(x.gider||0));
  const kar=data.map(x=>Number(x.kar||0));

  const ctx=document.getElementById('chartFinans').getContext('2d');
  const c1='#4aa0ff';
  const c2='#ff5c5c';
  const c3='#3ddc97';
  if(chartFinans){chartFinans.destroy();}
  chartFinans=new Chart(ctx,{
    type:'line',
    data:{
      labels,
      datasets:[
        {label:'Gelir',data:gelir,borderColor:c1,backgroundColor:c1,fill:false,tension:.35},
        {label:'Gider',data:gider,borderColor:c2,backgroundColor:c2,fill:false,tension:.35},
        {label:'Kâr',data:kar,borderColor:c3,backgroundColor:c3,fill:false,tension:.35}
      ]
    },
    options:{
      plugins:{legend:{labels:{color:'#e6eef7'}}},
      scales:{x:{ticks:{color:'#a6b5c8'}},y:{ticks:{color:'#a6b5c8'},grid:{color:'#17314d'}}}
    }
  });

  const toplamGelir=gelir.reduce((a,b)=>a+b,0);
  const toplamGider=gider.reduce((a,b)=>a+b,0);
  const toplamKar=kar.reduce((a,b)=>a+b,0);
  const elGelir=document.getElementById('kpiGelir');
  const elGider=document.getElementById('kpiGider');
  const elKar=document.getElementById('kpiKar');
  if(elGelir) elGelir.textContent = toplamGelir.toLocaleString('tr-TR');
  if(elGider) elGider.textContent = toplamGider.toLocaleString('tr-TR');
  if(elKar) elKar.textContent = toplamKar.toLocaleString('tr-TR');
}

const select=document.getElementById('selectYil');
const defaultYil=select.value||'2025';
loadFinans(defaultYil);
select.addEventListener('change',()=>loadFinans(select.value));
