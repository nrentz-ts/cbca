/**
 * Custom Action Functions for ThoughtSpot Embeds
 * 
 * This file contains utility functions that support code-based custom actions
 * in the ThoughtSpot Visual Embed SDK. These functions are separated from the 
 * main index.js file to improve code organization and maintainability.
 * 
 * FUNCTION CATEGORIES:
 * 
 * 1. UI & Popup Management:
 *    - showSpotterPopup: Opens the Spotter AI modal popup
 *    - hideSpotterPopup: Closes and cleans up the Spotter popup
 *    - updateSaveButtonState: Manages button enabled/disabled states
 * 
 * 2. Data Extraction & Processing:
 *    - extractSearchDataFromPayload: Parses ThoughtSpot event payloads for search data
 *    - extractJiraDataFromPayload: Extracts structured data for JIRA ticket creation
 *    - parseCurrentPath: Extracts liveboard and tab IDs from URL paths
 *    - formatNumber: Formats large numbers with K/M/B suffixes (e.g., 15.56M)
 * 
 * 3. External Integrations:
 *    - openGoogleSearch: Opens Google search with data from ThoughtSpot visualizations
 *    - openJiraTicketCreation: Creates JIRA tickets pre-filled with ThoughtSpot data
 * 
 * 4. Visualization Management:
 *    - saveVisualizationToLiveboard: Pins Spotter-generated visualizations to liveboards
 * 
 * USAGE:
 * These functions are imported in index.js and called in response to:
 * - ThoughtSpot EmbedEvent.CustomAction events
 * - User interactions with the Spotter popup UI
 * - Data processing needs for external integrations
 * 
 * NOTE: The initializeSpotterInPopup function remains in index.js as it's 
 * ThoughtSpot embed-specific and requires direct access to SDK components.
 */

// Function to parse currentPath and extract liveboardID and tabId
export function parseCurrentPath(currentPath) {
  console.log('🔍 Parsing currentPath:', currentPath);
  
  // Pattern: "/embed/insights/viz/{liveboardID}/tab/{tabId}"
  const pathMatch = currentPath.match(/\/embed\/insights\/viz\/([^\/]+)\/tab\/([^\/]+)/);
  
  if (pathMatch && pathMatch.length >= 3) {
    const liveboardId = pathMatch[1];
    const tabId = pathMatch[2];
    console.log('🎯 Extracted from path - LiveboardID:', liveboardId, 'TabID:', tabId);
    return { liveboardId, tabId };
  } else {
    console.warn('⚠️ Could not parse currentPath:', currentPath);
    return { liveboardId: null, tabId: null };
  }
}

// Function to show the Spotter popup
export function showSpotterPopup(spotterContext, initializeSpotterInPopup) {
  console.log('🚀 Opening Spotter popup...');
  
  // Use context that should already be captured from ROUTE_CHANGED events
  console.log('📊 Using current context - LiveboardID:', spotterContext.liveboardId, 'TabID:', spotterContext.tabId);
  
  const popup = document.getElementById('spotter-popup');
  popup.style.display = 'flex';
  
  // Initialize Spotter embed in the popup
  initializeSpotterInPopup();
}

// Function to hide the Spotter popup
export function hideSpotterPopup() {
  console.log('❌ Closing Spotter popup...');
  const popup = document.getElementById('spotter-popup');
  popup.style.display = 'none';
  
  // Clean up the embed container
  const container = document.getElementById('spotter-embed-container');
  container.innerHTML = '';
}

// Function to update save button state
export function updateSaveButtonState(lastVisualizationData) {
  const saveButton = document.getElementById('save-to-liveboard');
  if (saveButton) {
    if (lastVisualizationData) {
      saveButton.disabled = false;
      saveButton.title = 'Save last visualization to liveboard';
      console.log('✅ Save button enabled - visualization available');
    } else {
      saveButton.disabled = true;
      saveButton.title = 'No visualization to save yet';
      console.log('⚠️ Save button disabled - no visualization available');
    }
  }
}

// Function to save the last visualization to the liveboard
export function saveVisualizationToLiveboard(lastVisualizationData, mainLiveboardEmbed, spotterEmbedInstance, HostEvent) {
  try {
    console.log('🔍 Save button clicked - debugging...');
    console.log('📊 lastVisualizationData:', lastVisualizationData);
    console.log('📊 mainLiveboardEmbed:', mainLiveboardEmbed);
    console.log('📊 spotterEmbedInstance:', spotterEmbedInstance);
    
    if (!lastVisualizationData) {
      console.warn('⚠️ No visualization data available');
      alert('No visualization to save. Please generate a visualization in Spotter first.');
      return;
    }

    if (!mainLiveboardEmbed) {
      console.error('❌ Main liveboard embed not available');
      alert('Error: Main liveboard not available. Please refresh the page.');
      return;
    }

    console.log('📌 Attempting to save visualization to liveboard...');
    console.log('📊 Visualization data:', lastVisualizationData);
    
    // Try multiple approaches to save the visualization
    
    // Approach 1: Check if we have valid visualization data first
    console.log('🎯 Checking for valid visualization data...');
    
    if (!lastVisualizationData || !lastVisualizationData.data) {
      console.warn('⚠️ No visualization data available');
      alert('❌ No visualization to save.\n\nPlease:\n1. Ask Spotter a question\n2. Wait for it to generate a visualization\n3. Then try saving again');
      return;
    }
    
    console.log('📊 Found visualization data:', lastVisualizationData);
    
    // Approach 2: Try to pin the Spotter visualization to the specific liveboard
    console.log('🎯 Attempting to pin Spotter visualization to liveboard...');
    
    if (spotterEmbedInstance) {
      // Extract visualization ID from the lastVisualizationData
      console.log('📊 Extracting vizId from lastVisualizationData...');
      
      let vizId = null;
      
      if (lastVisualizationData && lastVisualizationData.data && lastVisualizationData.data.vizId) {
        vizId = lastVisualizationData.data.vizId;
        console.log('🎯 Found vizId:', vizId);
      }
      
      if (vizId) {
        console.log('📌 Pin attempt with vizId:', vizId);
        
        // Use static values for debugging
        const pinParams = {
          vizId: vizId,
          newVizName: 'Spotter Visualization',
          liveboardId: '906e3896-0beb-426c-b56c-945cd102e013',
          tabId: '6689a66f-6923-490c-a2d1-8523b9646fec'
        };
        
        console.log('🎯 Pin params:', pinParams);
        console.log('🎯 Complete HostEvent.Pin payload:', JSON.stringify(pinParams, null, 2));
        console.log('🎯 Payload structure analysis:');
        console.log('  - vizId:', pinParams.vizId, '(type:', typeof pinParams.vizId, ')');
        console.log('  - newVizName:', pinParams.newVizName, '(type:', typeof pinParams.newVizName, ')');
        console.log('  - liveboardId:', pinParams.liveboardId, '(type:', typeof pinParams.liveboardId, ')');
        console.log('  - tabId:', pinParams.tabId, '(type:', typeof pinParams.tabId, ')');
        console.log('🎯 About to send HostEvent.Pin to spotterEmbedInstance...');
        
        spotterEmbedInstance.trigger(HostEvent.Pin, pinParams).then((response) => {
          console.log('✅ Pin succeeded!');
          console.log('✅ Response payload:', response);
          console.log('✅ Response analysis:');
          console.log('  - pinboardId:', response?.pinboardId, '(type:', typeof response?.pinboardId, ')');
          console.log('  - tabId:', response?.tabId, '(type:', typeof response?.tabId, ')');
          console.log('  - vizId:', response?.vizId, '(type:', typeof response?.vizId, ')');
          console.log('  - liveboardId:', response?.liveboardId, '(type:', typeof response?.liveboardId, ')');
          console.log('  - errors:', response?.errors);
          console.log('✅ Complete response JSON:', JSON.stringify(response, null, 2));
          console.log('🔍 VizId comparison:');
          console.log('  - Sent vizId:', pinParams.vizId);
          console.log('  - Received vizId:', response?.vizId);
          console.log('  - VizIds match:', pinParams.vizId === response?.vizId);
          alert('✅ Visualization pinned successfully!');
        }).catch((pinError) => {
          console.error('❌ Pin failed:', pinError);
          alert('❌ Pin failed: ' + pinError.message);
        });
      } else {
        console.warn('⚠️ No visualization ID found');
        alert('❌ No visualization ID found. Please generate a visualization in Spotter first.');
      }
    } else {
      console.error('❌ Spotter embed instance not available');
      alert('❌ Spotter not available. Please refresh the page and try again.');
    }

  } catch (error) {
    console.error('❌ Error in saveVisualizationToLiveboard:', error);
    alert('Error saving visualization. Please check the console for details.');
  }
}

// Function to extract searchable data from the ThoughtSpot payload
export function extractSearchDataFromPayload(payload) {
  try {
    console.log('🔍 Extracting search data from payload:', payload);
    
    // Target the specific path you mentioned: data.contextMenuPoints.selectedPoints.0.selectedAttributes.0.value
    if (payload.data && 
        payload.data.contextMenuPoints && 
        payload.data.contextMenuPoints.selectedPoints && 
        payload.data.contextMenuPoints.selectedPoints[0] &&
        payload.data.contextMenuPoints.selectedPoints[0].selectedAttributes &&
        payload.data.contextMenuPoints.selectedPoints[0].selectedAttributes[0] &&
        payload.data.contextMenuPoints.selectedPoints[0].selectedAttributes[0].value) {
      
      const selectedValue = payload.data.contextMenuPoints.selectedPoints[0].selectedAttributes[0].value;
      console.log('✅ Found selected attribute value:', selectedValue);
      return selectedValue.toString();
    }
    
    // Fallback: try to find any value in the payload structure
    console.log('⚠️ Could not find the expected path, trying fallback methods...');
    
    // Try alternative paths that might contain the selected value
    if (payload.data && payload.data.value) {
      console.log('✅ Found fallback value:', payload.data.value);
      return payload.data.value.toString();
    }
    
    // If still nothing, log the structure for debugging
    console.log('❌ No searchable value found in payload');
    console.log('📋 Full payload structure:', JSON.stringify(payload, null, 2));
    return null;
    
  } catch (error) {
    console.error('Error extracting search data:', error);
    return null;
  }
}

// Function to open Google search in a new tab
export function openGoogleSearch(searchData) {
  try {
    // Clean and encode the search data
    const cleanSearchData = searchData.toString().trim();
    
    // Validate that we have searchable content
    if (!cleanSearchData || cleanSearchData === '{}' || cleanSearchData === 'null') {
      console.warn('No valid search data found');
      alert('No searchable data found. Please try clicking on a data point first.');
      return;
    }
    
    // Just search for the clean data - no extra context needed
    const encodedSearch = encodeURIComponent(cleanSearchData);
    
    // Construct Google search URL
    const googleSearchUrl = `https://www.google.com/search?q=${encodedSearch}`;
    
    console.log('🔍 Opening Google search for:', cleanSearchData);
    console.log('🌐 Search URL:', googleSearchUrl);
    
    // Open in new tab
    window.open(googleSearchUrl, '_blank', 'noopener,noreferrer');
    
  } catch (error) {
    console.error('Error opening Google search:', error);
    alert('Error opening Google search. Please check the console for details.');
  }
}

// Function to format numbers for readability (e.g., 15564795 -> 15.56M)
export function formatNumber(num) {
  if (typeof num !== 'number') {
    num = parseFloat(num);
  }
  
  if (isNaN(num)) return num;
  
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(2) + 'B';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  } else {
    return num.toString();
  }
}

// Function to extract JIRA ticket data from the ThoughtSpot payload
export function extractJiraDataFromPayload(payload) {
  try {
    console.log('🎫 Extracting JIRA data from payload:', payload);
    
    let attributeValue = null;
    let measureValue = null;
    let measureName = null;
    let visualizationName = null;
    
    // Extract visualization name from data.embedAnswerData.name
    if (payload.data && payload.data.embedAnswerData && payload.data.embedAnswerData.name) {
      visualizationName = payload.data.embedAnswerData.name;
      console.log('✅ Found visualization name:', visualizationName);
    }
    
    // Extract attribute value from selectedPoints
    if (payload.data && 
        payload.data.contextMenuPoints && 
        payload.data.contextMenuPoints.selectedPoints && 
        payload.data.contextMenuPoints.selectedPoints[0] &&
        payload.data.contextMenuPoints.selectedPoints[0].selectedAttributes &&
        payload.data.contextMenuPoints.selectedPoints[0].selectedAttributes[0] &&
        payload.data.contextMenuPoints.selectedPoints[0].selectedAttributes[0].value) {
      
      attributeValue = payload.data.contextMenuPoints.selectedPoints[0].selectedAttributes[0].value;
      console.log('✅ Found attribute value:', attributeValue);
    }
    
    // Debug: Log the clickedPoint structure to see what's available
    if (payload.data && payload.data.contextMenuPoints && payload.data.contextMenuPoints.clickedPoint) {
      console.log('🔍 clickedPoint structure:', payload.data.contextMenuPoints.clickedPoint);
    }
    
    // Extract measure value and name from clickedPoint.selectedMeasures
    if (payload.data && 
        payload.data.contextMenuPoints && 
        payload.data.contextMenuPoints.clickedPoint &&
        payload.data.contextMenuPoints.clickedPoint.selectedMeasures &&
        payload.data.contextMenuPoints.clickedPoint.selectedMeasures[0]) {
      
      const measure = payload.data.contextMenuPoints.clickedPoint.selectedMeasures[0];
      console.log('🔍 measure structure:', measure);
      
      // Extract measure value
      if (measure.value !== undefined) {
        measureValue = measure.value;
        console.log('✅ Found measure value:', measureValue);
      }
      
      // Extract measure name
      if (measure.column && measure.column.name) {
        measureName = measure.column.name;
        console.log('✅ Found measure name:', measureName);
      }
    }
    
    // Try alternative paths for measure data
    if (!measureValue && payload.data && 
        payload.data.contextMenuPoints && 
        payload.data.contextMenuPoints.clickedPoint) {
      
      const clickedPoint = payload.data.contextMenuPoints.clickedPoint;
      
      // Try different possible paths
      if (clickedPoint.value !== undefined) {
        measureValue = clickedPoint.value;
        console.log('✅ Found measure value in clickedPoint.value:', measureValue);
      }
      
      if (clickedPoint.selectedMeasures && clickedPoint.selectedMeasures[0]) {
        const altMeasure = clickedPoint.selectedMeasures[0];
        if (altMeasure.value !== undefined) {
          measureValue = altMeasure.value;
          console.log('✅ Found measure value in clickedPoint.selectedMeasures:', measureValue);
        }
        if (altMeasure.name) {
          measureName = altMeasure.name;
          console.log('✅ Found measure name in clickedPoint.selectedMeasures:', measureName);
        }
      }
    }
    
    // Fallback: try to find any value in the payload structure
    if (!attributeValue && payload.data && payload.data.value) {
      console.log('⚠️ Using fallback value:', payload.data.value);
      attributeValue = payload.data.value;
    }
    
    // Format the measure value for readability
    const formattedMeasureValue = measureValue ? formatNumber(measureValue) : 'Not available';
    
    // Create summary and description
    const summary = `Data Analysis Issue: ${attributeValue || 'Unknown'} ${measureName || 'data'}`;
    const description = `Visualization: ${visualizationName || 'Not available'}\nAttribute: ${attributeValue || 'Not available'}\nMeasure: ${formattedMeasureValue} (${measureName || 'Not available'})\nPlease investigate this data point for deeper analysis.`;
    
    const jiraData = {
      summary: summary,
      description: description,
      attributeValue: attributeValue,
      measureValue: measureValue,
      formattedMeasureValue: formattedMeasureValue,
      measureName: measureName,
      visualizationName: visualizationName,
      source: 'ThoughtSpot Analysis'
    };
    
    console.log('📊 Extracted JIRA data:', jiraData);
    return jiraData;
    
  } catch (error) {
    console.error('Error extracting JIRA data:', error);
    return null;
  }
}

// Function to open JIRA ticket creation page in a new tab
export function openJiraTicketCreation(jiraData) {
  try {
    // Clean and encode the JIRA data
    const cleanSummary = jiraData.summary.toString().trim();
    const cleanDescription = jiraData.description.toString().trim();
    
    // Validate that we have JIRA content
    if (!cleanSummary || cleanSummary === '{}' || cleanSummary === 'null') {
      console.warn('No valid JIRA data found');
      alert('No data found to create JIRA ticket. Please try clicking on a data point first.');
      return;
    }
    
    // Encode the data for URL parameters
    const encodedSummary = encodeURIComponent(cleanSummary);
    const encodedDescription = encodeURIComponent(cleanDescription);
    
    // Construct JIRA ticket creation URL
    const jiraBaseUrl = 'https://thoughtspot.atlassian.net';
    
    // Include both summary and description
    const jiraCreateUrl = `${jiraBaseUrl}/secure/CreateIssueDetails!init.jspa?pid=10400&issuetype=10300&summary=${encodedSummary}&description=${encodedDescription}`;
    
    console.log('🎫 Opening JIRA ticket creation for:', cleanSummary);
    console.log('📝 Description:', cleanDescription);
    console.log('🌐 JIRA URL:', jiraCreateUrl);
    
    // Open in new tab
    window.open(jiraCreateUrl, '_blank', 'noopener,noreferrer');
    
  } catch (error) {
    console.error('Error opening JIRA ticket creation:', error);
    alert('Error opening JIRA ticket creation. Please check the console for details.');
  }
}

