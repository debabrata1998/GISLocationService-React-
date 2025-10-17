import React, { useEffect, useRef, useCallback } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { fromLonLat, toLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";

const API_BASE_URL = "http://localhost:8080/api/places";

const App = () => {
  const mapRef = useRef();
  const mapInstance = useRef();
  const featureSource = useRef(new VectorSource());
  const interactionSource = useRef(new VectorSource());
  const activeTool = useRef(null);
  const distancePoints = useRef([]);

  // --- Functions ---
  const createFeatureFromPlace = useCallback((place) => {
    const coords = fromLonLat([place.lon, place.lat]);
    return new Feature({
      geometry: new Point(coords),
      name: place.name,
      type: place.type,
      id: place.id,
    });
  }, []);

  const addLocation = useCallback(async (lonLat, name, type) => {
    const [lon, lat] = lonLat;
    const data = { name, type, latitude: lat, longitude: lon };
    try {
      const res = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const place = await res.json();
        const feature = createFeatureFromPlace(place);
        featureSource.current.addFeature(feature);
        alert(`Location Added: ${name}`);
      } else alert("Failed to add location.");
    } catch (err) {
      console.error("Error adding location:", err);
    }
  }, [createFeatureFromPlace]);

  const findNearby = useCallback(async (lonLat, radiusMeters) => {
    const [lon, lat] = lonLat;
    featureSource.current.clear();
    interactionSource.current.clear();
    try {
      const url = `${API_BASE_URL}/nearby?lat=${lat}&lon=${lon}&radiusMeters=${radiusMeters}`;
      const res = await fetch(url);
      if (res.ok) {
        const places = await res.json();
        const refPoint = new Feature({ geometry: new Point(fromLonLat(lonLat)) });
        interactionSource.current.addFeature(refPoint);
        places.forEach((p) => featureSource.current.addFeature(createFeatureFromPlace(p)));
        alert(`Found ${places.length} nearby places.`);
      } else alert("Failed to find nearby places.");
    } catch (err) {
      console.error("Error finding nearby:", err);
    }
  }, [createFeatureFromPlace]);

  const findNearest = useCallback(async (lonLat) => {
    const [lon, lat] = lonLat;
    interactionSource.current.clear();
    const refPoint = new Feature({ geometry: new Point(fromLonLat(lonLat)) });
    interactionSource.current.addFeature(refPoint);
    try {
      const url = `${API_BASE_URL}/nearest?lat=${lat}&lon=${lon}`;
      const res = await fetch(url);
      if (res.ok) {
        const nearest = await res.json();
        const feature = createFeatureFromPlace(nearest);
        interactionSource.current.addFeature(feature);
        alert(`Nearest place: ${nearest.name}`);
      } else alert("No nearby places found.");
    } catch (err) {
      console.error("Error finding nearest:", err);
    }
  }, [createFeatureFromPlace]);

  const calculateDistance = useCallback(async (p1, p2) => {
    const [lon1, lat1] = p1;
    const [lon2, lat2] = p2;
    try {
      const url = `${API_BASE_URL}/distance?lat1=${lat1}&lon1=${lon1}&lat2=${lat2}&lon2=${lon2}`;
      const res = await fetch(url);
      if (res.ok) {
        const result = await res.json();
        const output = document.getElementById("distance-output");
        if (output)
          output.innerText = `Distance: ${result.distance_km.toFixed(2)} km (${result.distance_m.toFixed(0)} m)`;

        interactionSource.current.clear();
        const feat1 = new Feature({ geometry: new Point(fromLonLat(p1)) });
        const feat2 = new Feature({ geometry: new Point(fromLonLat(p2)) });
        const line = new Feature({ geometry: new LineString([fromLonLat(p1), fromLonLat(p2)]) });
        interactionSource.current.addFeatures([feat1, feat2, line]);
      } else alert("Failed to calculate distance.");
    } catch (err) {
      console.error("Error calculating distance:", err);
    }
  }, []);

  const setActiveTool = useCallback((tool) => {
    if (activeTool.current === tool) activeTool.current = null;
    else activeTool.current = tool;
    interactionSource.current.clear();
    distancePoints.current = [];
    const output = document.getElementById("distance-output");
    if (output) output.innerText = "Distance: -";
  }, []);

  // --- Initialize Map ---
  useEffect(() => {
    const basemap = new TileLayer({ source: new OSM() });
    const featureLayer = new VectorLayer({ source: featureSource.current });
    const interactionLayer = new VectorLayer({ source: interactionSource.current });

    const map = new Map({
      target: mapRef.current,
      layers: [basemap, featureLayer, interactionLayer],
      view: new View({ center: fromLonLat([78.9629, 20.5937]), zoom: 5 }),
    });

    mapInstance.current = map;

    map.on("click", (evt) => {
      const lonLat = toLonLat(evt.coordinate);
      const tool = activeTool.current;

      if (tool === "add-location") {
        const name = prompt("Enter Name:");
        const type = prompt("Enter Type:");
        if (name && type) addLocation(lonLat, name, type);
      } else if (tool === "find-nearest") {
        findNearest(lonLat);
      } else if (tool === "distance-calc") {
        distancePoints.current.push(lonLat);
        interactionSource.current.addFeature(new Feature({ geometry: new Point(evt.coordinate) }));
        if (distancePoints.current.length === 2) {
          calculateDistance(distancePoints.current[0], distancePoints.current[1]);
          distancePoints.current = [];
        }
      }
    });

    return () => map.setTarget(null);
  }, [addLocation, findNearest, calculateDistance]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div ref={mapRef} style={{ flex: 3, height: "100%" }}></div>
      <div style={{ flex: 1, padding: "10px", backgroundColor: "#f2f2f2", overflowY: "auto" }}>
        <h2>GIS Services</h2>

        <div style={{ marginBottom: "15px" }}>
          <h3>Add Location (Click Map)</h3>
          <button onClick={() => setActiveTool("add-location")}>Activate Tool</button>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <h3>Find Nearby Places</h3>
          <input type="number" id="nearby-radius" placeholder="Radius in Meters" defaultValue="5000" />
          <button
            onClick={() => {
              const radius = parseFloat(document.getElementById("nearby-radius").value);
              if (isNaN(radius) || radius <= 0) return alert("Enter a valid radius.");
              const center = [78.9629, 20.5937]; // Default India
              findNearby(center, radius);
            }}
          >
            Find Nearby
          </button>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <h3>Find Nearest (Click Map)</h3>
          <button onClick={() => setActiveTool("find-nearest")}>Activate Tool</button>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <h3>Distance Calculator (Click Map Twice)</h3>
          <button onClick={() => setActiveTool("distance-calc")}>Activate Tool</button>
          <p id="distance-output">Distance: -</p>
        </div>
      </div>
    </div>
  );
};

export default App;
