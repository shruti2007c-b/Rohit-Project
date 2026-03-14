const API_BASE = "https://rohit-project-gvn9.onrender.com";

// ----------------------------
// INITIALIZE MAP
// ----------------------------
const map = L.map("map").setView([16.705, 74.243], 11);

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  { attribution: "&copy; CARTO" }
).addTo(map);

let villageLayer;


// ----------------------------
// NUMBERED MARKER FUNCTION
// ----------------------------
function createNumberedMarker(number, color) {
    return L.divIcon({
        className: "",
        html: `
            <div style="
                background:${color};
                width:28px;
                height:28px;
                border-radius:50%;
                display:flex;
                align-items:center;
                justify-content:center;
                color:white;
                font-size:13px;
                font-weight:bold;
                border:2px solid white;">
                ${number}
            </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
}


// ----------------------------
// LOAD VILLAGES (POLYGONS + HOVER EFFECT)
// ----------------------------
async function loadVillages() {

    const res = await fetch(`${API_BASE}/api/map/villages`);
    const data = await res.json();

    let counter = 1;

    villageLayer = L.geoJSON(data, {

        style: function(feature) {
            return {
                color: "#1e293b",
                weight: 1,
                fillColor: "green",
                fillOpacity: 0.6
            };
        },

        pointToLayer: (feature, latlng) => {
            return L.marker(latlng, {
                icon: createNumberedMarker(counter++, "green")
            });
        },

        onEachFeature: (feature, layer) => {

            // Correct property name
            const villageName = feature.properties.village_na;

            layer.bindPopup(
                `<strong>${villageName}</strong>`
            );

            // Hover glow effect
            layer.on({
                mouseover: function (e) {
                    e.target.setStyle({
                        weight: 2,
                        color: "#ffffff",
                        fillOpacity: 0.8
                    });
                },
                mouseout: function (e) {
                    villageLayer.resetStyle(e.target);
                }
            });
        }

    }).addTo(map);
}


// ----------------------------
// ALERT COLOR CLASS
// ----------------------------
function getAlertClass(level) {
    if (level === "Warning") return "warning";
    if (level === "High Alert") return "high-alert";
    if (level === "Severe Flood") return "severe";
    return "normal";
}


// ----------------------------
// GET RISK COLOR
// ----------------------------
function getRiskColor(level) {
    if (level === "Warning") return "#ffc107";
    if (level === "High Alert") return "orange";
    if (level === "Severe Flood") return "red";
    return "green";
}


// ----------------------------
// UPDATE SYSTEM
// ----------------------------
async function updateSystem(hour) {

    const res = await fetch(`${API_BASE}/api/alert?hour=${hour}`);
    const data = await res.json();

    document.getElementById("date").innerText = data.date;
    document.getElementById("alertLevel").innerText = data.alert_level;

    const alertCard = document.getElementById("alertCard");
    alertCard.className = "card alert-card " + getAlertClass(data.alert_level);

    const villageList = document.getElementById("villageList");
    villageList.innerHTML = "";

    if (data.affected_villages.length === 0) {
        villageList.innerHTML = "<li>No villages affected</li>";
    } else {
        data.affected_villages.forEach(v => {
            const li = document.createElement("li");
            li.textContent = v;
            villageList.appendChild(li);
        });
    }

    // ----------------------------
    // UPDATE MAP COLORS
    // ----------------------------
    let markerIndex = 1;

    villageLayer.eachLayer(layer => {

        const name = layer.feature.properties.village_na.toLowerCase();
        const isAffected = data.affected_villages.includes(name);

        const color = isAffected
            ? getRiskColor(data.alert_level)
            : "green";

        // Polygon styling
        if (layer.setStyle) {
            layer.setStyle({
                fillColor: color,
                fillOpacity: 0.6
            });
        }

        // Marker styling (if any points exist)
        if (layer.setIcon) {
            layer.setIcon(
                createNumberedMarker(markerIndex++, color)
            );
        }

    });

    const banner = document.getElementById("emergencyBanner");

    if (data.alert_level === "Severe Flood") {
        banner.style.display = "block";
    } else {
        banner.style.display = "none";
    }
}


// ----------------------------
// SLIDER CONTROL
// ----------------------------
const slider = document.getElementById("timeSlider");
const timeValue = document.getElementById("timeValue");

slider.addEventListener("input", () => {
    timeValue.innerText = slider.value;
    updateSystem(slider.value);
});


// ----------------------------
// INITIAL LOAD
// ----------------------------
loadVillages().then(() => {
    updateSystem(0);
});

setTimeout(() => {
    map.invalidateSize();
}, 300);
