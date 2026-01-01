async function fetchJSON(url){const r=await fetch(url);return r.json();}

async function loadDepolar(){
  const {ok,data}=await fetchJSON('/api/depolar');
  if(!ok) return;
  const tbody=document.getElementById('tblDepolar');
  tbody.innerHTML=data.map(d=>`<tr><td>${d.depo_id}</td><td>${d.depo_ad}</td><td>${d.sehir_ad}</td><td>${d.bolge_ad||'-'}</td></tr>`).join('');
}

async function loadUygunKonumlar(){
  const {ok,data}=await fetchJSON('/api/analiz/uygun-konumlar');
  if(!ok) return;
  const labels=data.map(x=>x.sehir_ad);
  const values=data.map(x=>Number(x.toplam_benzin||0));
  const ctx=document.getElementById('chartUygun').getContext('2d');
  new Chart(ctx,{type:'bar',data:{labels,datasets:[{label:'Toplam Benzin (L)',data:values,backgroundColor:'#1f7adb'}]}, options:{plugins:{legend:{labels:{color:'#e6eef7'}}}, scales:{x:{ticks:{color:'#a6b5c8'}}, y:{ticks:{color:'#a6b5c8'}, grid:{color:'#17314d'}}}}});
}

async function loadRotalar(){
  const {ok,data}=await fetchJSON('/api/analiz/en-maliyetli-rotalar');
  if(!ok) return;
  const tbody=document.getElementById('tblRotalar');
  tbody.innerHTML=data.map(r=>`<tr><td>${r.sehir_ad}</td><td>${r.depo_ad}</td><td>${Number(r.mesafe_km).toFixed(1)}</td><td>${Number(r.benzin_litre||0).toFixed(2)}</td></tr>`).join('');
}

async function loadBolgeMaliyet(){
  const {ok,data}=await fetchJSON('/api/analiz/bolge-maliyet');
  if(!ok) return;
  const labels=data.map(x=>x.bolge_ad);
  const values=data.map(x=>Number(x.toplam_benzin||0));
  const ctx=document.getElementById('chartBolge').getContext('2d');
  

  const baseColors=[
    '#4aa0ff', '#3ddc97', '#00cec9', '#6c5ce7', '#ff7675', 
    '#fab1a0', '#74b9ff', '#81ecec', '#a29bfe', '#dfe6e9'
  ];
  const sliceColors=labels.map((_,i)=>baseColors[i % baseColors.length]);
  const total=values.reduce((a,b)=>a+b,0);
  
  new Chart(ctx,{
    type:'doughnut',
    data:{
      labels,
      datasets:[{
        label:'Toplam Benzin (L)',
        data:values,
        backgroundColor:sliceColors,
        borderColor:'#0f233a',
        borderWidth:4,
        hoverOffset:6
      }]
    },
    options:{
      maintainAspectRatio:false,
      cutout: '70%',
      layout:{padding:12},
      plugins:{
        legend:{
          position:'right',
          labels:{
            color:'#e6eef7',
            font: { size: 11, family: 'Inter' },
            boxWidth:10,
            boxHeight:10,
            usePointStyle:true,
            padding: 15
          }
        },
        tooltip:{
          backgroundColor: '#0f2a49',
          titleColor: '#e6eef7',
          bodyColor: '#a6b5c8',
          borderColor: '#1a3858',
          borderWidth: 1,
          callbacks:{
            label:(ctx)=>{
              const v=Number(ctx.raw||0);
              const p=total?((v/total)*100).toFixed(1):'0.0';
              return `${ctx.label}: ${v.toLocaleString('tr-TR')} L (%${p})`;
            }
          }
        }
      },
      animation:{duration:1000, easing:'easeOutQuart'}
    }
  });
}

async function loadSehirDagilimi(){
  const {ok,data}=await fetchJSON('/api/dashboard/aktif-sehirler');
  if(!ok) return;
  const labels=data.map(x=>x.sehir_ad);
  const values=data.map(x=>Number(x.kac_defa||0));
  const el=document.getElementById('chartSehirDagilimi');
  if(!el) return;
  const ctx=el.getContext('2d');
  new Chart(ctx,{type:'bar',data:{labels,datasets:[{label:'En Çok İş Yapılan Şehirler',data:values,backgroundColor:'#1f7adb'}]}, options:{maintainAspectRatio:false, plugins:{legend:{labels:{color:'#e6eef7'}}}, scales:{x:{ticks:{color:'#a6b5c8'}}, y:{ticks:{color:'#a6b5c8'}, grid:{color:'#17314d'}}}}});


  const btn = document.getElementById('btnToggleHeatmap');
  const mapContainer = document.getElementById('mapHeatmapDepo');
  let isMapInitialized = false;

  btn.addEventListener('click', () => {
    if (el.style.display !== 'none') {
      
      el.style.display = 'none';
      mapContainer.style.display = 'block';
      btn.textContent = 'Grafiğe Geri Dön';
      
      if (!isMapInitialized) {
        initHeatmapDepo(data);
        isMapInitialized = true;
      }
    } else {
      el.style.display = 'block';
      mapContainer.style.display = 'none';
      btn.textContent = 'Isı Haritasını Görüntüle';
    }
  });
}

async function initHeatmapDepo(cityData) {
  const map2 = L.map('mapHeatmapDepo', {
    center: [39.0, 35.0],
    zoom: 6,
    zoomControl: true,
    attributionControl: false,
    dragging: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    boxZoom: true,
    touchZoom: true
  });
  map2.setMinZoom(5);
  map2.setMaxZoom(10);
  
  try {
    const geoRes = await fetch('https://raw.githubusercontent.com/cihadturhan/tr-geojson/master/geo/tr-cities-utf8.json');
    if(!geoRes.ok) throw new Error('GeoJSON fetch failed');
    const geoData = await geoRes.json();

    const valMap = {};
    let maxVal = 0;
    cityData.forEach(d => {
      valMap[d.sehir_ad] = Number(d.kac_defa || 0);
      if(valMap[d.sehir_ad] > maxVal) maxVal = valMap[d.sehir_ad];
    });

    function getColor(d) {
       const r = d / (maxVal || 1);
       return r > 0.8 ? '#4a0000' : 
              r > 0.6 ? '#8b0000' : 
              r > 0.4 ? '#b30000' : 
              r > 0.2 ? '#e63946' : 
              r > 0   ? '#ffb3b3' : 
                        '#121212';
    }
    function style(feature) {
      const cityName = feature.properties.name;
      const val = valMap[cityName] || 0;
      return {
        fillColor: getColor(val),
        weight: 1,
        opacity: 1,
        color: '#0a1627',
        dashArray: '',
        fillOpacity: val > 0 ? 0.9 : 0.4
      };
    }

    function onEachFeature(feature, layer) {
      const cityName = feature.properties.name;
      const val = valMap[cityName] || 0;
      
      layer.bindTooltip(`
        <div style="text-align:center">
          <div style="font-weight:700;margin-bottom:4px;color:#fff">${cityName}</div>
          <div style="font-size:12px;color:#cbd5e1">İş Sayısı: <b style="color:#ffa726">${val}</b></div>
        </div>
      `, {
        permanent: false,
        direction: 'top',
        className: 'heatmap-tooltip',
        opacity: 1
      });
      
      layer.on({
        mouseover: function(e) {
          const layer = e.target;
          layer.setStyle({
            weight: 2,
            color: '#fff',
            fillOpacity: 1,
            filter: 'drop-shadow(0 0 4px #ffa726)'
          });
          layer.bringToFront();
        },
        mouseout: function(e) {
          geojson.resetStyle(e.target);
        }
      });
    }

    const geojson = L.geoJson(geoData, {
      style: style,
      onEachFeature: onEachFeature
    }).addTo(map2);

    map2.fitBounds(geojson.getBounds(), { padding: [20, 20] });
    
    setTimeout(() => {
        map2.invalidateSize();
    }, 100);

  } catch(e) {
    console.error('Heatmap error:', e);
    document.getElementById('mapHeatmapDepo').innerHTML = '<div style="padding:20px;text-align:center;color:#a6b5c8;">Harita yüklenemedi.</div>';
  }
  
}

loadDepolar();
loadUygunKonumlar();
loadRotalar();
loadBolgeMaliyet();
loadSehirDagilimi();
async function loadSehirGelir(){
  const {ok,data}=await fetchJSON('/api/dashboard/aktif-sehirler');
  if(!ok) return;
  const sorted=[...data].sort((a,b)=>Number(b.sehir_gelir||0)-Number(a.sehir_gelir||0));
  const labels=sorted.map(x=>x.sehir_ad);
  const values=sorted.map(x=>Number(x.sehir_gelir||0));
  const el=document.getElementById('chartSehirGelir');
  if(!el) return;
  const ctx=el.getContext('2d');
  new Chart(ctx,{
    type:'bar',
    data:{
      labels,
      datasets:[{
        label:'Şehir Geliri (TL)',
        data:values,
        backgroundColor:'#3ddc97'
      }]
    },
    options:{
      maintainAspectRatio:false,
      plugins:{legend:{labels:{color:'#e6eef7'}}},
      scales:{
        x:{ticks:{color:'#a6b5c8'}},
        y:{ticks:{color:'#a6b5c8'}, grid:{color:'#17314d'}}
      }
    }
  });
}
loadSehirGelir();
