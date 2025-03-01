// SafeRoute - Client-side JavaScript
let map, directionsService, directionsRenderer;
let safetyHeatmap;
let safeZoneMarkers = [];
let currentPosition = null;

// Initialize the map and services when the page loads
function initMap() {
    // Create a new Google Map instance
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
        zoom: 13,
        mapTypeControl: true,
        fullscreenControl: true,
        styles: mapStyles
    });
    
    // Create directions service and renderer
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: "#4285F4",
            strokeWeight: 5,
            strokeOpacity: 0.7
        }
    });
    
    // Try to get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                map.setCenter(currentPosition);
                
                // Place a marker at user's current location
                new google.maps.Marker({
                    position: currentPosition,
                    map: map,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: "#4285F4",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "#FFFFFF"
                    },
                    title: "Your Location"
                });
                
                // Set the origin input to current location
                document.getElementById("origin-input").value = "Current Location";
            },
            () => {
                console.log("Error: The Geolocation service failed.");
            }
        );
    }
    
    // Initialize autocomplete for location inputs
    const originAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById("origin-input")
    );
    
    const destinationAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById("destination-input")
    );
    
    // Set up event listeners
    document.getElementById("route-form").addEventListener("submit", findSafeRoute);
    document.getElementById("find-safe-zones-btn").addEventListener("click", findNearbySafeZones);
    
    // Set current time as default for time picker
    const now = new Date();
    const timeString = now.getFullYear() + "-" + 
                      String(now.getMonth() + 1).padStart(2, "0") + "-" + 
                      String(now.getDate()).padStart(2, "0") + "T" + 
                      String(now.getHours()).padStart(2, "0") + ":" + 
                      String(now.getMinutes()).padStart(2, "0");
    document.getElementById("time-of-travel").value = timeString;
}

// Custom map styles to highlight streets and important features
const mapStyles = [
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [
            { "visibility": "simplified" },
            { "color": "#ffffff" }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [
            { "color": "#666666" }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry.fill",
        "stylers": [
            { "color": "#c8e6c9" }
        ]
    },
    {
        "featureType": "poi.business",
        "stylers": [
            { "visibility": "on" }
        ]
    },
    {
        "featureType": "transit.station",
        "stylers": [
            { "visibility": "on" }
        ]
    }
];

// Find and display a safe route based on user inputs
async function findSafeRoute(e) {
    e.preventDefault();
    
    const originInput = document.getElementById("origin-input").value;
    const destinationInput = document.getElementById("destination-input").value;
    const travelMode = document.getElementById("travel-mode").value;
    const timeOfTravel = document.getElementById("time-of-travel").value;
    const safetyPriority = document.getElementById("safety-priority").value;
    
    // Validate inputs
    if (!originInput || !destinationInput) {
        alert("Please enter both origin and destination.");
        return;
    }
    
    let origin = originInput;
    if (originInput === "Current Location" && currentPosition) {
        origin = currentPosition;
    }
    
    // Show loading state
    document.getElementById("find-route-btn").textContent = "Finding route...";
    document.getElementById("find-route-btn").disabled = true;
    
    try {
        // First, get regular routes from Google Directions API
        const routeRequest = {
            origin: origin,
            destination: destinationInput,
            travelMode: google.maps.TravelMode[travelMode],
            provideRouteAlternatives: true
        };
        
        const directionsResult = await new Promise((resolve, reject) => {
            directionsService.route(routeRequest, (result, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    resolve(result);
                } else {
                    reject(status);
                }
            });
        });
        
        // Get safety data for the routes from our backend
        const routeData = {
            routes: directionsResult.routes.map(route => ({
                overview_path: google.maps.geometry.encoding.encodePath(route.overview_path),
                legs: route.legs.map(leg => ({
                    start_location: {
                        lat: leg.start_location.lat(),
                        lng: leg.start_location.lng()
                    },
                    end_location: {
                        lat: leg.end_location.lat(),
                        lng: leg.end_location.lng()
                    },
                    steps: leg.steps.map(step => ({
                        start_location: {
                            lat: step.start_location.lat(),
                            lng: step.start_location.lng()
                        },
                        end_location: {
                            lat: step.end_location.lat(),
                            lng: step.end_location.lng()
                        },
                        path: google.maps.geometry.encoding.encodePath(step.path)
                    }))
                }))
            })),
            time_of_travel: timeOfTravel,
            safety_priority: safetyPriority
        };
        
        // Send the routes to our backend for safety analysis
        const response = await fetch('/api/analyze-routes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(routeData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to analyze routes');
        }
        
        const safetyData = await response.json();
        
        // Update the routes with safety information
        for (let i = 0; i < directionsResult.routes.length; i++) {
            directionsResult.routes[i].safety_score = safetyData.routes[i].safety_score;
            directionsResult.routes[i].safety_details = safetyData.routes[i].safety_details;
            
            // Create a color based on the safety score (0-100)
            const score = safetyData.routes[i].safety_score;
            let color;
            
            if (score >= 80) {
                color = "#34a853"; // Green for high safety
            } else if (score >= 50) {
                color = "#fbbc04"; // Yellow for medium safety
            } else {
                color = "#ea4335"; // Red for low safety
            }
            
            directionsResult.routes[i].safety_color = color;
        }
        
        // Sort routes by safety score or a combination of safety and time
        directionsResult.routes.sort((a, b) => {
            const safetyWeight = safetyPriority / 10;
            const timeWeight = 1 - safetyWeight;
            
            const aCombinedScore = (a.safety_score * safetyWeight) - 
                                  (a.legs[0].duration.value * timeWeight / 60);
            const bCombinedScore = (b.safety_score * safetyWeight) - 
                                  (b.legs[0].duration.value * timeWeight / 60);
            
            return bCombinedScore - aCombinedScore;
        });
        
        // Display the safest route
        const safestRoute = directionsResult.routes[0];
        directionsRenderer.setDirections(directionsResult);
        directionsRenderer.setRouteIndex(0);
        
        // Update route polyline color based on safety
        directionsRenderer.setOptions({
            polylineOptions: {
                strokeColor: safestRoute.safety_color,
                strokeWeight: 5,
                strokeOpacity: 0.8
            }
        });
        
        // Display safety information
        displayRouteInfo(safestRoute);
        
        // Add markers for start and end locations
        addRouteMarkers(safestRoute);
        
        // Display safety heatmap if available
        if (safetyData.heatmap_data) {
            displaySafetyHeatmap(safetyData.heatmap_data);
        }
        
    } catch (error) {
        console.error("Error finding safe route:", error);
        alert("Error finding a safe route. Please try again.");
    } finally {
        // Reset button state
        document.getElementById("find-route-btn").textContent = "Find Safe Route";
        document.getElementById("find-route-btn").disabled = false;
    }
}

// Display detailed information about the selected route
function displayRouteInfo(route) {
    const safetyScore = route.safety_score;
    const distance = route.legs[0].distance.text;
    const duration = route.legs[0].duration.text;
    
    // Update safety score display
    document.getElementById("safety-score").innerHTML = `
        <span class="label">Safety Score:</span>
        <span class="value" style="color: ${route.safety_color}">${safetyScore}</span>
    `;
    
    // Create safety details HTML
    let safetyDetailsHtml = `
        <div class="route-summary">
            <p><strong>Distance:</strong> ${distance}</p>
            <p><strong>Duration:</strong> ${duration}</p>
        </div>
        <div class="safety-details">
            <h4>Safety Information</h4>
    `;
    
    // Add safety details if available
    if (route.safety_details) {
        safetyDetailsHtml += `<ul class="safety-list">`;
        
        route.safety_details.forEach(detail => {
            let iconClass = "";
            
            if (detail.type === "crime") {
                iconClass = "⚠️";
            } else if (detail.type === "lighting") {
                iconClass = "💡";
            } else if (detail.type === "safe_zone") {
                iconClass = "🛡️";
            }
            
            safetyDetailsHtml += `
                <li>
                    <span class="detail-icon">${iconClass}</span>
                    <span class="detail-text">${detail.description}</span>
                </li>
            `;
        });
        
        safetyDetailsHtml += `</ul>`;
    } else {
        safetyDetailsHtml += `<p>No specific safety concerns found for this route.</p>`;
    }
    
    safetyDetailsHtml += `</div>`;
    
    // Update the route details container
    document.getElementById("route-details").innerHTML = safetyDetailsHtml;
}

// Add markers for the start and end points of the route
function addRouteMarkers(route) {
    // Clear existing markers
    if (window.startMarker) window.startMarker.setMap(null);
    if (window.endMarker) window.endMarker.setMap(null);
    
    const leg = route.legs[0];
    
    // Start marker
    window.startMarker = new google.maps.Marker({
        position: leg.start_location,
        map: map,
        icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
            scaledSize: new google.maps.Size(40, 40)
        },
        title: "Start: " + leg.start_address
    });
    
    // End marker
    window.endMarker = new google.maps.Marker({
        position: leg.end_location,
        map: map,
        icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
            scaledSize: new google.maps.Size(40, 40)
        },
        title: "End: " + leg.end_address
    });
}

// Display a heatmap of safety data
function displaySafetyHeatmap(heatmapData) {
    // Remove existing heatmap if present
    if (safetyHeatmap) {
        safetyHeatmap.setMap(null);
    }
    
    // Convert heatmap data to LatLng objects
    const heatmapPoints = heatmapData.map(point => ({
        location: new google.maps.LatLng(point.lat, point.lng),
        weight: point.weight
    }));
    
    // Create and display the heatmap
    safetyHeatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapPoints,
        map: map,
        radius: 30,
        opacity: 0.7,
        gradient: [
            'rgba(0, 255, 0, 0)',
            'rgba(0, 255, 0, 1)',
            'rgba(255, 255, 0, 1)',
            'rgba(255, 165, 0, 1)',
            'rgba(255, 0, 0, 1)'
        ]
    });
}

// Find and display nearby safe zones (police stations, hospitals, etc.)
async function findNearbySafeZones() {
    // Determine center point for search
    let center;
    
    if (map.getBounds() && !map.getBounds().isEmpty()) {
        center = map.getCenter();
    } else if (currentPosition) {
        center = currentPosition;
    } else {
        alert("Please set a location first.");
        return;
    }
    
    // Clear existing safe zone markers
    safeZoneMarkers.forEach(marker => marker.setMap(null));
    safeZoneMarkers = [];
    
    // Show loading state
    document.getElementById("find-safe-zones-btn").textContent = "Finding...";
    document.getElementById("find-safe-zones-btn").disabled = true;
    
    try {
        // Fetch safe zones from backend
        const response = await fetch(`/api/safe-zones?lat=${center.lat()}&lng=${center.lng()}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch safe zones');
        }
        
        const safeZones = await response.json();
        
        // Add markers for each safe zone
        safeZones.forEach(zone => {
            const marker = new google.maps.Marker({
                position: { lat: zone.lat, lng: zone.lng },
                map: map,
                icon: {
                    url: getSafeZoneIcon(zone.type),
                    scaledSize: new google.maps.Size(30, 30)
                },
                title: zone.name
            });
            
            // Add info window with details
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div class="safe-zone-info">
                        <h3>${zone.name}</h3>
                        <p>${zone.address}</p>
                        <p>Type: ${zone.type}</p>
                        ${zone.phone ? `<p>Phone: ${zone.phone}</p>` : ''}
                        ${zone.hours ? `<p>Hours: ${zone.hours}</p>` : ''}
                    </div>
                `
            });
            
            marker.addListener('click', () => {
                infoWindow.open(map, marker);
            });
            
            safeZoneMarkers.push(marker);
        });
        
    } catch (error) {
        console.error("Error finding safe zones:", error);
        alert("Error finding safe zones. Please try again.");
    } finally {
        // Reset button state
        document.getElementById("find-safe-zones-btn").textContent = "Show Nearby Safe Zones";
        document.getElementById("find-safe-zones-btn").disabled = false;
    }
}

// Get appropriate icon based on safe zone type
function getSafeZoneIcon(type) {
    switch (type.toLowerCase()) {
        case 'police':
            return 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
        case 'hospital':
            return 'https://maps.google.com/mapfiles/ms/icons/pink-dot.png';
        case 'fire station':
            return 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png';
        default:
            return 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png';
    }
}

// Initialize the map when the page loads
window.onload = function() {
    // Wait for the Google Maps API to load
    if (typeof google === 'object' && typeof google.maps === 'object') {
        initMap();
    } else {
        console.error("Google Maps API not loaded");
    }
};
// Safe Route Navigation App
// Integrates Google Maps, crime data, lighting conditions, and safe zones

// Initialize Google Maps API
function initMap() {
    const map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
      zoom: 13,
      mapTypeControl: true,
      fullscreenControl: true,
    });
    
    // Initialize the route service
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map: map,
      polylineOptions: {
        strokeColor: "#4285F4",
        strokeWeight: 5,
      }
    });
    
    // Create route calculator that factors in safety
    const safeRouteCalculator = new SafeRouteCalculator(map, directionsService, directionsRenderer);
    
    // Set up the search input controls
    const originInput = document.getElementById("origin-input");
    const destinationInput = document.getElementById("destination-input");
    const safetyPrioritySlider = document.getElementById("safety-priority");
    
    // Create autocomplete for inputs
    const originAutocomplete = new google.maps.places.Autocomplete(originInput);
    const destinationAutocomplete = new google.maps.places.Autocomplete(destinationInput);
    
    // Set up route calculation on form submission
    document.getElementById("route-form").addEventListener("submit", function(e) {
      e.preventDefault();
      const safetyPriority = parseInt(safetyPrioritySlider.value);
      safeRouteCalculator.calculateRoute(
        originInput.value, 
        destinationInput.value, 
        safetyPriority
      );
    });
    
    // Set up "find nearby safe zones" button 
    }