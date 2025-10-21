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

// Import helper functions
import {
  parseCurrentPath,
  showSpotterPopup,
  hideSpotterPopup,
  updateSaveButtonState,
  saveVisualizationToLiveboard,
  extractSearchDataFromPayload,
  openGoogleSearch,
  formatNumber,
  extractJiraDataFromPayload,
  openJiraTicketCreation
} from './custom-action-functions.js';

// Embedding the Embed1 cluster
const tsClusterUrl = 'https://champagne-master-aws.thoughtspotstaging.cloud';
// const tsClusterUrl = 'https://172.32.6.51:8443'; 
const liveboardguid = '906e3896-0beb-426c-b56c-945cd102e013';
const vizguid = '48ab1b94-1b13-408e-ba9b-76256114c5fa';
const searchdatasourceguid = ['cd252e5c-b552-49a8-821d-3eadaa049cca'];
const searchtokens = '[sales][item type][state].California';

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
          
          updateSaveButtonState(lastVisualizationData);
        }
      })
      .on(EmbedEvent.Answer, (payload) => {
        console.log('📊 Spotter Answer event - tracking last visualization:', payload);
        // Track the last answer/visualization
        lastVisualizationData = payload;
        updateSaveButtonState(lastVisualizationData);
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
    updateSaveButtonState(lastVisualizationData);
    
  } catch (error) {
    console.error('❌ Error initializing Spotter embed in popup:', error);
    alert('Error initializing Spotter. Please check the console for details.');
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
  updateSaveButtonState(lastVisualizationData);
  
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
    saveButton.addEventListener('click', () => saveVisualizationToLiveboard(lastVisualizationData, mainLiveboardEmbed, spotterEmbedInstance, HostEvent));
    
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
       showSpotterPopup(spotterContext, initializeSpotterInPopup);
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
// spotterembed();
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