async function fetchJSON(url){const r=await fetch(url);return r.json();}

async function loadSummary(){
  const {ok,data}=await fetchJSON('/api/dashboard/summary');
  if(!ok) return;
  document.getElementById('kpiDepo').textContent = data.toplam_depo;
  document.getElementById('kpiEnRota').textContent = data.en_maliyetli_rota ? `${data.en_maliyetli_rota.sehir_ad} → ${data.en_maliyetli_rota.depo_ad}` : '-';
  document.getElementById('kpiEnBolge').textContent = data.en_maliyetli_bolge ? data.en_maliyetli_bolge.bolge_ad : '-';
}

async function loadMap(){
  
  const map = L.map('map').setView([39.0, 35.0], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18}).addTo(map);
  const {ok,data}=await fetchJSON('/api/depolar');
  if(!ok) return;
  // Eğer /api/depolar içinde doluluk_orani eksikse, dashboard/map-data'dan alıp birleştir
  try{
    const mapRes = await fetchJSON('/api/dashboard/map-data');
    if(mapRes.ok && Array.isArray(mapRes.data)){
      const dolulukMap = new Map();
      mapRes.data.forEach(d => { if(d.depo_id!=null) dolulukMap.set(Number(d.depo_id), d.doluluk_orani); });
      data.forEach(item => {
        if((item.doluluk_orani === undefined || item.doluluk_orani === null) && item.depo_id != null){
          const v = dolulukMap.get(Number(item.depo_id));
          if(v !== undefined) item.doluluk_orani = v;
        }
      });
    }
  }catch(e){  }

data.forEach(item => {
    if (item.enlem && item.boylam) {
        const marker = L.circleMarker([Number(item.enlem), Number(item.boylam)], {
            radius: 6,
            color: '#4aa0ff',
            fillColor: '#4aa0ff',
            fillOpacity: 0.9
        }).addTo(map);

        const kapasiteDegeri = (item.kapasite !== undefined && item.kapasite !== null && item.kapasite !== "") 
            ? Number(item.kapasite).toLocaleString('tr-TR') + " m²"
            : "Veri Yok";

        
        const dolulukVal = Number(item.doluluk_orani ?? 0);
        const dolulukRengi = dolulukVal >= 85 ? '#ff4d4d' : '#2ecc71';

        const html = `
            <div class="popup-depo">
                <div class="title"><b>${item.depo_ad}</b></div>
                <div class="meta">${item.sehir_ad}${item.bolge_ad ? ` (${item.bolge_ad})` : ''}</div>
                <div class="loc">${item.konum || ''}</div>
                <div class="capacity"><b>Kapasite:</b> ${kapasiteDegeri}</div>
                <div class="occupancy" style="margin-top:5px; color:${dolulukRengi}">
                    <b>Doluluk Oranı: %${dolulukVal}</b>
                </div>
            </div>`;
        
        marker.bindPopup(html);
    }
});
  const topRes = await fetchJSON('/api/dashboard/aktif-sehirler');
  if(!topRes.ok) return;
  const topLabels = topRes.data.map(x=>x.sehir_ad);
  const kpiTop=document.getElementById('kpiTopSehirler');
  if(kpiTop){kpiTop.textContent = topLabels.slice(0,3).join(', ');}  

  initHeatmap(topRes.data);
}

async function initHeatmap(cityData) {
  const map2 = L.map('mapHeatmap', {
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
      
      return r > 0.8 ? '#4a0000' : // En Yüksek - Çok Koyu Bordo
             r > 0.6 ? '#8b0000' : // Yüksek - Koyu Kırmızı
             r > 0.4 ? '#b30000' : // Orta - Canlı Kırmızı
             r > 0.2 ? '#e63946' : // Düşük - Açık Kırmızı/Mercan
             r > 0   ? '#ffb3b3' : // Çok Düşük - Çok Açık Gül Rengi
                       '#121212';  // Veri Yok - Koyu Gri
    }
    function style(feature) {
      const cityName = feature.properties.name;
      const val = valMap[cityName] || 0;
      return {
        fillColor: getColor(val),
        weight: 1,
        opacity: 1,
        color: '#0c213dff', 
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
          <div style="font-size:12px;color:#cbd5e1">İş Sayısı: <b style="color:#e63946">${val}</b></div>
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
            filter: 'drop-shadow(0 0 4px #e63946)'
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

    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function (map) {
      const div = L.DomUtil.create('div', 'info legend');
      div.style.background = '#0f2a49';
      div.style.padding = '10px';
      div.style.border = '1px solid #1a3858';
      div.style.borderRadius = '8px';
      div.style.color = '#e6eef7';
      div.style.fontSize = '12px';
      div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';

      const grades = [0, 0.2, 0.4, 0.6, 0.8];
      const labels = ['Çok Düşük', 'Düşük', 'Orta', 'Yüksek', 'En Yüksek'];
      const colors = ['#ffb3b3', '#e63946', '#b30000', '#8b0000', '#4a0000'];

      div.innerHTML = '<div style="margin-bottom:5px;font-weight:bold">Yoğunluk</div>';

      for (let i = 0; i < grades.length; i++) {
        div.innerHTML +=
          '<div style="display:flex;align-items:center;margin-bottom:4px;">' +
          '<i style="background:' + colors[i] + ';width:16px;height:16px;display:inline-block;margin-right:8px;border-radius:3px;"></i> ' +
          labels[i] +
          '</div>';
      }
      return div;
    };
    legend.addTo(map2);

  } catch(e) {
    console.error('Heatmap error:', e);
    document.getElementById('mapHeatmap').innerHTML = '<div style="padding:20px;text-align:center;color:#a6b5c8;">Harita yüklenemedi.</div>';
  }
}

loadSummary();
loadMap();
