// Import ThoughtSpot SDK from CDN
import {
  init,
  AppEmbed,
  Page,
  RuntimeFilterOp,
  EmbedEvent,
  AuthType,
  HostEvent,
  logout,
  SearchEmbed,
  SearchBarEmbed,
  LiveboardEmbed,
  SageEmbed,
  ConversationEmbed,
  Action,
  CustomActionsPosition,
  CustomActionTarget
} from 'https://unpkg.com/@thoughtspot/visual-embed-sdk@1.42.0/dist/tsembed.es.js';

// Import actions
import {
  actions,
  lbvisibaction,
  drillactions,
  MobileActions,
} from './actions.js';

// Embedding the Embed1 cluster
const tsClusterUrl = 'https://champagne-master-aws.thoughtspotstaging.cloud';
// const tsClusterUrl = 'https://172.32.6.51:8443'; 
const liveboardguid = '906e3896-0beb-426c-b56c-945cd102e013';
const vizguid = '48ab1b94-1b13-408e-ba9b-76256114c5fa';
const searchdatasourceguid = ['cd252e5c-b552-49a8-821d-3eadaa049cca'];
const searchtokens = '[sales][item type][state].California';

function getWidth() {
  return Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.offsetWidth,
    document.documentElement.clientWidth
  );
}

console.log('Width:  ' + getWidth());
if (getWidth() < 500) {
  var hideactions = MobileActions;
} else {
  hideactions = [];
}

// lbvisibaction = [Action.Monitor];
/*-------------------- INIT ----------------- */


try {
  init({
    // Embed1 embed
    thoughtSpotHost: tsClusterUrl,
    authType: AuthType.None,
    customizations: {
      style: {
        // customCSSUrl: 'https://cdn.jsdelivr.net/gh/nrentz-ts/css/dark-theme.css', // location of your style sheet

        // To apply overrides for your style sheet in this init, provide variable values below, eg
        customCSS: {
          variables: {
            //   '--ts-var-button--secondary-background': '#F0EBFF',
            //   '--ts-var-button--secondary--hover-background': '#E3D9FC',
            //   '--ts-var-root-background': '#F7F5FF',
          },
        },
      },
    },
  });
} catch (error) {
  console.error('❌ Error initializing ThoughtSpot SDK:', error);
}

/*-------------------- POPUP FUNCTIONS ----------------- */

// Global variables to track Spotter embed and last visualization
let spotterEmbedInstance = null;
let lastVisualizationData = null;
let mainLiveboardEmbed = null;
let spotterContext = {
  liveboardId: null,
  tabId: null
};

// Function to parse currentPath and extract liveboardID and tabId
function parseCurrentPath(currentPath) {
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
function showSpotterPopup() {
  console.log('🚀 Opening Spotter popup...');
  
  // Use context that should already be captured from ROUTE_CHANGED events
  console.log('📊 Using current context - LiveboardID:', spotterContext.liveboardId, 'TabID:', spotterContext.tabId);
  
  const popup = document.getElementById('spotter-popup');
  popup.style.display = 'flex';
  
  // Initialize Spotter embed in the popup
  initializeSpotterInPopup();
}

// Function to hide the Spotter popup
function hideSpotterPopup() {
  console.log('❌ Closing Spotter popup...');
  const popup = document.getElementById('spotter-popup');
  popup.style.display = 'none';
  
  // Clean up the embed container
  const container = document.getElementById('spotter-embed-container');
  container.innerHTML = '';
}

// Function to initialize Spotter embed in the popup
function initializeSpotterInPopup() {
  try {
    console.log('🤖 Initializing Spotter embed in popup...');
    
    const container = document.getElementById('spotter-embed-container');
    
    // Create a new Spotter embed
    spotterEmbedInstance = new ConversationEmbed('#spotter-embed-container', {
      frameParams: {
        width: '100%',
        height: '100%',
      },
      worksheetId: 'cd252e5c-b552-49a8-821d-3eadaa049cca', // Using the same worksheet as your existing spotter
    });
    
    // Add event listeners for the Spotter embed
    spotterEmbedInstance
      .on(EmbedEvent.Data, (payload) => {
        console.log('📊 Spotter Data event - THIS IS THE KEY EVENT:', payload);
        console.log('📊 Data payload structure:', payload);
        
        // This is the main event we need - extract vizId from here
        if (payload && payload.data) {
          console.log('📊 Data object:', payload.data);
          
          // Look for vizId in the payload
          if (payload.data.vizId) {
            console.log('🎯 Found vizId in EmbedEvent.Data:', payload.data.vizId);
            // Store the vizId for later use - this is the LAST Data event
            lastVisualizationData = {
              ...payload,
              vizId: payload.data.vizId
            };
            console.log('📊 Stored LAST visualization data with vizId:', payload.data.vizId);
          } else {
            console.log('📊 No vizId found, storing full payload');
            lastVisualizationData = payload;
          }
          
          updateSaveButtonState();
        }
      })
      .on(EmbedEvent.Answer, (payload) => {
        console.log('📊 Spotter Answer event - tracking last visualization:', payload);
        // Track the last answer/visualization
        lastVisualizationData = payload;
        updateSaveButtonState();
      })
      .on(EmbedEvent.EmbedInit, (payload) => {
        console.log('🎉 Spotter embed initialized:', payload);
      })
      .on(EmbedEvent.Error, (payload) => {
        console.error('❌ Spotter embed error:', payload);
      })
      .render();
      
    console.log('✅ Spotter embed initialized successfully in popup');
    
    // Initialize save button state
    updateSaveButtonState();
    
  } catch (error) {
    console.error('❌ Error initializing Spotter embed in popup:', error);
    alert('Error initializing Spotter. Please check the console for details.');
  }
}

// Function to update save button state
function updateSaveButtonState() {
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
function saveVisualizationToLiveboard() {
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


// Test function for debugging - can be called from console
window.testSaveFunction = function() {
  console.log('🧪 Testing save function manually...');
  console.log('📊 lastVisualizationData:', lastVisualizationData);
  console.log('📊 mainLiveboardEmbed:', mainLiveboardEmbed);
  console.log('📊 spotterEmbedInstance:', spotterEmbedInstance);
  
  // Create fake visualization data for testing
  const testData = {
    data: {
      test: true,
      message: 'This is test visualization data',
      timestamp: new Date().toISOString()
    }
  };
  
  console.log('🧪 Setting test visualization data...');
  lastVisualizationData = testData;
  updateSaveButtonState();
  
  console.log('🧪 Now try clicking the save button or call saveVisualizationToLiveboard()');
};

// Add event listeners for popup controls
document.addEventListener('DOMContentLoaded', function() {
  // Close button event listener
  const closeButton = document.getElementById('close-spotter-popup');
  if (closeButton) {
    closeButton.addEventListener('click', hideSpotterPopup);
  }
  
  // Save to liveboard button event listener
  const saveButton = document.getElementById('save-to-liveboard');
  if (saveButton) {
    saveButton.addEventListener('click', saveVisualizationToLiveboard);
    
    // Add a test click handler for debugging
    saveButton.addEventListener('click', function() {
      console.log('🔍 Save button clicked - testing state...');
      console.log('📊 Button disabled state:', saveButton.disabled);
      console.log('📊 Button title:', saveButton.title);
    });
  }
  
  // Close popup when clicking outside the content
  const popup = document.getElementById('spotter-popup');
  if (popup) {
    popup.addEventListener('click', function(e) {
      if (e.target === popup) {
        hideSpotterPopup();
      }
    });
  }
  
  // Close popup with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const popup = document.getElementById('spotter-popup');
      if (popup && popup.style.display === 'flex') {
        hideSpotterPopup();
      }
    }
  });
});

/*-------------------- HELPER FUNCTIONS ----------------- */

// Function to extract searchable data from the ThoughtSpot payload
function extractSearchDataFromPayload(payload) {
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
function openGoogleSearch(searchData) {
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
function formatNumber(num) {
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
function extractJiraDataFromPayload(payload) {
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
function openJiraTicketCreation(jiraData) {
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

/*-------------------- LIVEBOARD EMBED ----------------- */

const liveboardembed = () => {
  console.log('🎯 Creating LiveboardEmbed...');
  console.log('📊 Liveboard ID:', liveboardguid);
  console.log('🎯 Embed container selector: #embed');
  
  // Check if embed container exists
  const embedContainer = document.getElementById('embed');
  if (!embedContainer) {
    console.error('❌ Embed container #embed not found!');
    return;
  }
  console.log('✅ Embed container found:', embedContainer);
  
  // Store reference to the main liveboard embed for pin functionality
  mainLiveboardEmbed = new LiveboardEmbed('#embed', {
    frameParams: {
      width: '100%',
      height: '100%',
    },
    // fullHeight: true,
    //Embed 1 liveboard:
    liveboardId: liveboardguid,
    customActions: [
      {
          id: 'my-liveboard-custom-action',
          name: 'CA: Create new visualization',
          position: CustomActionsPosition.PRIMARY,
          target: CustomActionTarget.LIVEBOARD,
          
          // Optional: Restrict where this action appears based on metadata
          // metadataIds: {
          //     // Restrict to specific liveboards
          //     liveboardIds: ['906e3896-0beb-426c-b56c-945cd102e013'],
          // },
      },
      {
          // Unique identifier for the custom action
          id: 'cbca-google-search',
          // Display name shown to users in the UI
          name: 'CA: Google Search',
          
          // Where the action appears in the UI
          // PRIMARY: Shows as a primary button (e.g., in the toolbar)
          // MENU: Shows in the "More" menu (three dots menu)
          // CONTEXTMENU: Shows in the right-click context menu
          position: CustomActionsPosition.CONTEXTMENU,
          
          // What type of content this action applies to
          // VIZ: Available on individual visualizations
          target: CustomActionTarget.VIZ,
          
          // Optional: Restrict where this action appears based on metadata
          // metadataIds: {
          //     // Restrict to specific answers
          //     answerIds: ['answer-id-1', 'answer-id-2'],
          //     // Restrict to specific liveboard. If liveboardId is
          //    // passed, custom actions will appear on all vizzes of liveboard
          //     lieboardIds: ['liveboard-id-1'],
          //    // Restrict to specific vizIds
          //     vizIds: ['viz-id-1']
          // },
          dataModelIds: {
              // Restrict to specific worksheets/data models
             // modelIds: ['worksheet-id-1', 'worksheet-id-2'],
              // Restrict to specific columns within worksheets
              modelColumnNames: ['cd252e5c-b552-49a8-821d-3eadaa049cca::state']
          },
          //     // Restrict to specific groups (for group-based access control)
          //     groupIds: ['group-id-1', 'group-id-2'],
          //     // Restrict to specific organizations (for multi-org deployments)
          //     orgIds: ['org-id-1', 'org-id-2'],
      },
      {
        // Unique identifier for the custom action
        id: 'jira-custom-action',
        name: 'CA: Log Jira Issue',
        position: CustomActionsPosition.CONTEXTMENU,
        target: CustomActionTarget.VIZ,
    },
    {
      // Unique identifier for the custom action
      id: 'test-scope',
      // Display name shown to users in the UI
      name: 'CA: Explain scope',
      
      // Where the action appears in the UI
      // PRIMARY: Shows as a primary button (e.g., in the toolbar)
      // MENU: Shows in the "More" menu (three dots menu)
      // CONTEXTMENU: Shows in the right-click context menu
      position: CustomActionsPosition.PRIMARY,
      
      // What type of content this action applies to
      // VIZ: Available on individual visualizations
      target: CustomActionTarget.VIZ,
      
      // Optional: Restrict where this action appears based on metadata
      // metadataIds: {
      //     // Restrict to specific answers
      //     // answerIds: ['answer-id-1', 'answer-id-2'],
      //     // Restrict to specific liveboard. If liveboardId is
      //    // passed, custom actions will appear on all vizzes of liveboard
      //     // liveboardIds: ['906e3896-0beb-426c-b56c-945cd102e013'],
      //    // Restrict to specific vizIds
      //     vizIds: ['eeca4759-0d3a-4e28-bc2c-59849ad2484e']
      // },
      dataModelIds: {
          // Restrict to specific worksheets/data models
         modelIds: ['36e8f5de-b5f0-4167-99e7-9cb239a98975'],
          // Restrict to specific columns within worksheets
          // modelColumnNames: ['cd252e5c-b552-49a8-821d-3eadaa049cca::state']
      },
          // Restrict to specific groups (for group-based access control)
          // groupIds: ['group-id-1', 'group-id-2'],
          // Restrict to specific organizations (for multi-org deployments)
          // orgIds: ['0', 'org-id-2'],
  },
  ],

    // visibleVizs:["48ab1b94-1b13-408e-ba9b-76256114c5fa", "d799376a-6850-4eba-b101-4128b4dba7a4"],
    // hiddenActions: [Action.Explore, Action.Pin, Action.Share],
    // disabledActions: [Action.DrillDown, Action.Pin, Action.SpotIQAnalyze],
    // disabledActionReason: 'Please upgrade to Pro',

    
  });
  mainLiveboardEmbed
    .on(EmbedEvent.FilterChanged, (payload) => {
      console.log('Filter Changed', payload);
    })
    .on(EmbedEvent.RouteChanged, (payload) => {
      console.log('🛣️ Route changed:', payload);
      
      if (payload && payload.data && payload.data.currentPath) {
        const { liveboardId, tabId } = parseCurrentPath(payload.data.currentPath);
        
        // Update the context with the parsed values
        spotterContext.liveboardId = liveboardId || spotterContext.liveboardId;
        spotterContext.tabId = tabId || spotterContext.tabId;
        
        console.log('📊 Updated context from ROUTE_CHANGED - LiveboardID:', spotterContext.liveboardId, 'TabID:', spotterContext.tabId);
      }
    })
    // Event listener for code-based custom actions
    // This fires when a user clicks on a code-based custom action
    .on(EmbedEvent.CustomAction, payload => {
     console.log('🎯 Custom Action event triggered:', payload);
     
     // Handle the liveboard custom action
     const liveboardActionId = 'my-liveboard-custom-action';
     if (payload.id === liveboardActionId || payload.data.id === liveboardActionId) {
       console.log('📊 Liveboard Custom Action event:', payload);
       console.log('🚀 Opening Spotter popup for liveboard action...');
       
       // Show the Spotter popup
       showSpotterPopup();
     }
     
     // Handle the Google search custom action
     const googleSearchActionId = 'cbca-google-search';
     if (payload.id === googleSearchActionId || payload.data.id === googleSearchActionId) {
       console.log('🔍 Google Search Custom Action triggered!');
       console.log('📋 Full payload:', payload);
       
       // Extract data from the payload for Google search
       const searchData = extractSearchDataFromPayload(payload);
       
       if (searchData) {
         console.log('📊 Extracted search data:', searchData);
         // Open Google search in a new tab
         openGoogleSearch(searchData);
       } else {
         console.warn('⚠️ No searchable data found in payload');
         alert('No data found to search. Please try clicking on a data point first.');
       }
     }
     
     // Handle the JIRA custom action
     const jiraActionId = 'jira-custom-action';
     if (payload.id === jiraActionId || payload.data.id === jiraActionId) {
       console.log('🎫 JIRA Custom Action triggered!');
       console.log('📋 Full payload:', payload);
       
       // Extract data from the payload for JIRA ticket creation
       const jiraData = extractJiraDataFromPayload(payload);
       
       if (jiraData) {
         console.log('📊 Extracted JIRA data:', jiraData);
         // Open JIRA ticket creation page in a new tab
         openJiraTicketCreation(jiraData);
       } else {
         console.warn('⚠️ No data found for JIRA ticket creation');
         alert('No data found to create JIRA ticket. Please try clicking on a data point first.');
       }
     }
})
    .on(EmbedEvent.EmbedInit, (payload) => {
      console.log('🎉 Embed initialized successfully!', payload);
    })
    .on(EmbedEvent.Error, (payload) => {
      console.error('❌ Embed error:', payload);
    })
    .render()
    .then(() => {
      console.log('✅ LiveboardEmbed render() completed successfully');
    })
    .catch((error) => {
      console.error('❌ LiveboardEmbed render() failed:', error);
    });
    
  // The embed reference is already stored as mainLiveboardEmbed

  document.getElementById('getFilters').addEventListener('click', (e) => {
    mainLiveboardEmbed.trigger(HostEvent.GetFilters).then(logFilters);
  });

  document.getElementById('updateFilters2').addEventListener('click', (e) => {
    mainLiveboardEmbed.trigger(HostEvent.UpdateFilters, {
      filters: [
        {
          column: 'city',
          operator: RuntimeFilterOp.EQ,
          values: ['Alpharetta'],
        },
        /*,{
          column: 'item type',
          operator: RuntimeFilterOp.IN,
          values: ['jackets', 'jeans'],
        },*/
      ],
    });
  });
};

/*-------------------- VIZ EMBED ----------------- */
const vizembed = () => {
  const embed = new LiveboardEmbed('#embed', {
    //Embed 1 liveboard:
    liveboardId: liveboardguid,
    vizId: '48ab1b94-1b13-408e-ba9b-76256114c5fa',
  });
  embed.render();
};

/*-------------------- FULL APP EMBED ----------------- */

const fullappembed = () => {
  const embed = new AppEmbed('#embed', {
    pageId: Page.Liveboards,
    liveboardV2: true,
    showPrimaryNavbar: true,
    customActions: [
      {
          // Unique identifier for the custom action
          id: 'cbca-google-search',
          // Display name shown to users in the UI
          name: 'CA: Google Search',
          position: CustomActionsPosition.CONTEXTMENU,
          target: CustomActionTarget.VIZ,
      },
      {
        // Unique identifier for the custom action
        id: 'jira-custom-action',
        name: 'CA: Log Jira Issue',
        position: CustomActionsPosition.CONTEXTMENU,
        target: CustomActionTarget.VIZ,
    },
    {
      // Unique identifier for the custom action
      id: 'test-scope',
      // Display name shown to users in the UI
      name: 'CA: Spotter',
      position: CustomActionsPosition.MENU,
      target: CustomActionTarget.VIZ,
  },
  ],
    // pageId: Page.Liveboards,
    // disabledActions: TMLactions,
    // disabledActionReason: 'Please upgrade',
    // visibleActions: [],
  });
  embed.render();
};

/*-------------------- SEARCH EMBED ----------------- */
const searchembed = () => {
  const embed = new SearchEmbed('#embed', {
    // Embed 1 SearchEmbed
    dataSources: ['42a6c051-aabd-4b5c-a2a9-3bf64a1a4190'],
    searchOptions: {
      searchTokenString: '[item price][product type][state].California', //write a TML query
      executeSearch: true,
    },
  });
  embed
    .on(EmbedEvent.Data, (payload) => {
      console.log('Data', payload);
    })
    .on(EmbedEvent.ExportTML, (payload) => {
      console.log('Export TML', payload);
    })
    .render();
};

/*-------------------- SEARCHBAR EMBED ----------------- */

const searchbarembed = () => {
  const embed = new SearchBarEmbed('#embed', {
    // Embed 1 SearchEmbed
    dataSources: ['42a6c051-aabd-4b5c-a2a9-3bf64a1a4190'],
    searchOptions: {
      searchTokenString: '[item price][product type][state].California', //write a TML query
      executeSearch: true,
    },
  });
  embed
    .on(EmbedEvent.Data, (payload) => {
      console.log('Data', payload);
    })
    .on(EmbedEvent.ExportTML, (payload) => {
      console.log('Export TML', payload);
    })
    .render();
};

/*-------------------- SPOTTER EMBED ----------------- */
const spotterembed = () => {
  const embed = new ConversationEmbed('#embed', {
    frameParams: {},
    customActions: [
      {
          // Unique identifier for the custom action
          id: 'cbca-google-search',
          // Display name shown to users in the UI
          name: 'CA: Google Search',
          position: CustomActionsPosition.CONTEXTMENU,
          target: CustomActionTarget.SPOTTER,
      },
      {
        // Unique identifier for the custom action
        id: 'jira-custom-action',
        name: 'CA: Log Jira Issue',
        position: CustomActionsPosition.CONTEXTMENU,
        target: CustomActionTarget.SPOTTER,
    },
    {
      // Unique identifier for the custom action
      id: 'test-scope',
      // Display name shown to users in the UI
      name: 'CA: Spotter',
      position: CustomActionsPosition.MENU,
      target: CustomActionTarget.SPOTTER,
  },
  ],
    /*param-start-spotterDataSource*/
    worksheetId:
      'cd252e5c-b552-49a8-821d-3eadaa049cca' 
  });
  embed
    .on(EmbedEvent.ALL, (payload) => {
      console.log('Data', payload);
    })
    .on(EmbedEvent.ExportTML, (payload) => {
      console.log('Export TML', payload);
    })
    .render();
};

function logFilters(filters) {
  console.log('Filters:', filters);
}

/*-------------------- Default state ----------------- */
liveboardembed();
//spotterembed();
// vizembed();
//  fullappembed();
// searchembed();
// searchbarembed();

/*--------------------  WIRE BUTTONS ----------------- */

document.getElementById('search-link').addEventListener('click', searchembed);
document
  .getElementById('searchbar-link')
  .addEventListener('click', searchbarembed);
document
  .getElementById('liveboard-link')
  .addEventListener('click', liveboardembed);
document.getElementById('spotter-link').addEventListener('click', spotterembed);
document
  .getElementById('full-app-link')
  .addEventListener('click', fullappembed);

// Debug function to show what's happening with the save process
window.debugSaveProcess = function() {
  console.log('🔍 Debugging save process...');
  console.log('📊 Current liveboard ID:', liveboardguid);
  console.log('📊 Main liveboard embed:', mainLiveboardEmbed);
  console.log('📊 Spotter embed:', spotterEmbedInstance);
  console.log('📊 Last visualization data:', lastVisualizationData);
  
  if (mainLiveboardEmbed) {
    console.log('📊 Main liveboard embed methods:', Object.getOwnPropertyNames(mainLiveboardEmbed));
  }
  
  if (spotterEmbedInstance) {
    console.log('📊 Spotter embed methods:', Object.getOwnPropertyNames(spotterEmbedInstance));
  }
  
  console.log('📊 Available HostEvents:', Object.keys(HostEvent));
  
  // Try to get current answer from Spotter
  if (spotterEmbedInstance) {
    spotterEmbedInstance.trigger(HostEvent.GetCurrentAnswer).then((answer) => {
      console.log('📊 Current Spotter answer:', answer);
    }).catch((error) => {
      console.error('❌ Error getting current answer:', error);
    });
  }
};

// Debug function to inspect the last visualization data
window.inspectData = function() {
  console.log('🔍 Inspecting lastVisualizationData...');
  console.log('📊 Full object:', lastVisualizationData);
  
  if (lastVisualizationData && lastVisualizationData.data) {
    console.log('📊 Data object:', lastVisualizationData.data);
    console.log('📊 Data keys:', Object.keys(lastVisualizationData.data));
    
    // Deep inspection
    Object.keys(lastVisualizationData.data).forEach(key => {
      console.log(`📊 ${key}:`, lastVisualizationData.data[key]);
    });
  }
};

// Debug function to inspect the captured Spotter context
window.inspectContext = function() {
  console.log('🔍 Inspecting Spotter context:');
  console.log('📊 Captured context:', spotterContext);
  console.log('📊 LiveboardID:', spotterContext.liveboardId);
  console.log('📊 TabID:', spotterContext.tabId);
  console.log('📊 Global liveboard ID:', liveboardguid);
};

// Debug function to manually test path parsing
window.testPathParsing = function(testPath) {
  console.log('🧪 Testing path parsing with:', testPath);
  const result = parseCurrentPath(testPath);
  console.log('📊 Parsing result:', result);
  return result;
};

// Debug function to manually set context
window.setContext = function(liveboardId, tabId) {
  console.log('🔧 Manually setting context - LiveboardID:', liveboardId, 'TabID:', tabId);
  spotterContext.liveboardId = liveboardId;
  spotterContext.tabId = tabId;
  console.log('📊 Updated context:', spotterContext);
};

// Quick test function to set the known context
window.setKnownContext = function() {
  console.log('🔧 Setting known context from your example...');
  spotterContext.liveboardId = 'b5508f17-0f1d-4def-9379-7c249c1c1395';
  spotterContext.tabId = '7e223cae-8f82-4f50-a9eb-428ad908ef13';
  console.log('📊 Set context:', spotterContext);
  console.log('✅ Now try the save button!');
};

// Quick check function
window.checkContext = function() {
  console.log('🔍 Current context:', spotterContext);
  console.log('🔍 LiveboardID:', spotterContext.liveboardId);
  console.log('🔍 TabID:', spotterContext.tabId);
};