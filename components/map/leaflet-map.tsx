import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useEffect, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { forjaColors } from "@/components/forja-ui";
import type { RoutePoint } from "@/lib/forja/types";

type LeafletMapProps = {
  route: RoutePoint[];
  currentLocation?: RoutePoint | null;
  followUser?: boolean;
};

const leafletHtml = `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>html,body,#map{height:100%;width:100%;margin:0;background:#111713}.leaflet-control-attribution{background:rgba(10,13,12,.72)!important;color:#9AA59C!important;font-size:9px!important}.leaflet-control-attribution a{color:#B9F227!important}.leaflet-control-zoom a{background:#151A17!important;color:#F4F7F2!important;border-color:#2D352F!important}.forja-user-marker{transition:transform .55s linear!important}.forja-user-marker__dot{width:18px;height:18px;border-radius:50%;background:#B9F227;border:3px solid #F4F7F2;box-shadow:0 0 0 7px rgba(185,242,39,.22),0 0 22px rgba(185,242,39,.65)}</style>
</head><body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
const map=L.map('map',{zoomControl:true,attributionControl:true}).setView([-23.55052,-46.633308],13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
let routeLine=L.polyline([],{color:'#B9F227',weight:5,opacity:.92,lineCap:'round',lineJoin:'round'}).addTo(map);
let currentDot=null; let hasPosition=false; let lastCameraMove=0; const userIcon=L.divIcon({className:'forja-user-marker',html:'<div class="forja-user-marker__dot"></div>',iconSize:[24,24],iconAnchor:[12,12]});
function setData(payload){const route=(payload.route||[]).map(p=>[p.latitude,p.longitude]);if(payload.reset){routeLine.setLatLngs(route);hasPosition=false}else{route.forEach(point=>routeLine.addLatLng(point))}const point=payload.currentLocation || payload.route?.[payload.route.length-1];if(point){const latlng=[point.latitude,point.longitude];if(!currentDot){currentDot=L.marker(latlng,{icon:userIcon,interactive:false,zIndexOffset:1000}).addTo(map)}else{currentDot.setLatLng(latlng)}const now=Date.now();if(!hasPosition){map.setView(latlng,16,{animate:false});lastCameraMove=now}else if(payload.followUser&&now-lastCameraMove>1200){map.panTo(latlng,{animate:true,duration:.35});if(map.getZoom()<16)map.setZoom(16);lastCameraMove=now}else if(!hasPosition&&routeLine.getLatLngs().length>1){map.fitBounds(routeLine.getBounds(),{padding:[32,32],maxZoom:16})}hasPosition=true}else if(routeLine.getLatLngs().length>1){map.fitBounds(routeLine.getBounds(),{padding:[32,32],maxZoom:16})}}
window.forjaSetMapData=setData; window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'ready'}));
</script></body></html>`;

export function LeafletMap({ route, currentLocation, followUser = false }: LeafletMapProps) {
  const mapRef = useRef<WebView>(null);
  const sentRouteLength = useRef(0);
  const syncMap = useCallback(() => {
    const reset = sentRouteLength.current === 0 || route.length < sentRouteLength.current;
    const routeDelta = reset ? route : route.slice(sentRouteLength.current);
    sentRouteLength.current = route.length;
    const payload = JSON.stringify({ route: routeDelta, currentLocation, followUser, reset });
    mapRef.current?.injectJavaScript(`window.forjaSetMapData && window.forjaSetMapData(${payload}); true;`);
  }, [currentLocation, followUser, route]);

  useEffect(() => {
    syncMap();
  }, [syncMap]);

  if (Platform.OS === "web") {
    return (
      <View style={styles.webFallback}>
        <MaterialIcons color={forjaColors.lime} name="map" size={30} />
        <Text style={styles.webFallbackTitle}>Mapa disponível no aplicativo Android</Text>
        <Text style={styles.webFallbackBody}>O mapa real usa OpenStreetMap e será carregado no dispositivo para acompanhar sua rota.</Text>
      </View>
    );
  }

  return (
    <WebView
      ref={mapRef}
      originWhitelist={["*"]}
      source={{ html: leafletHtml }}
      javaScriptEnabled
      domStorageEnabled
      onLoadEnd={() => { sentRouteLength.current = 0; syncMap(); }}
      onMessage={() => { sentRouteLength.current = 0; syncMap(); }}
      style={styles.webView}
    />
  );
}

const styles = StyleSheet.create({
  webView: { backgroundColor: forjaColors.map, flex: 1 },
  webFallback: { alignItems: "center", backgroundColor: forjaColors.map, flex: 1, gap: 9, justifyContent: "center", padding: 28 },
  webFallbackTitle: { color: forjaColors.text, fontSize: 15, fontWeight: "800", textAlign: "center" },
  webFallbackBody: { color: forjaColors.muted, fontSize: 12, lineHeight: 18, textAlign: "center" },
});
