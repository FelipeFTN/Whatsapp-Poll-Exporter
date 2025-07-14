// User preferences storage
let userSettings = {
  exportFormat: 'csv',  // Default format
  language: 'he'         // Default language (Hebrew)
};

// Translations for the download button text
const buttonTranslations = {
  'he': '📥הורדה',
  'en': 'Download📥',
  'es': 'Descargar📥',
  'fr': 'Télécharger📥'
};

// Get download button text based on language - always default to Hebrew if any issues
function getDownloadButtonText(language) {
  // Ensure we have a valid language, defaulting to Hebrew in any error case
  if (!language || typeof language !== 'string' || !buttonTranslations[language]) {
    return buttonTranslations['he']; // Hebrew is the safe default
  }
  return buttonTranslations[language];
}

// Load user settings
function loadUserSettings() {
  if (chrome.storage && chrome.storage.sync) {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        exportFormat: 'csv',
        language: 'he'  // Always default to Hebrew
      }, function(items) {
        if (chrome.runtime.lastError) {
          console.warn("Error loading settings:", chrome.runtime.lastError);
          // Keep the existing settings in case of error
          resolve(userSettings);
        } else {
          userSettings = items;
          resolve(items);
        }
      });
    });
  } else {
    return Promise.resolve(userSettings);
  }
}

// ADDED: Function to save user settings
function saveUserSettings(settings) {
  return new Promise((resolve, reject) => {
    if (chrome.storage && chrome.storage.sync) {
      // Merge with existing settings to avoid overwriting unspecified values
      const updatedSettings = { ...userSettings, ...settings };
      
      chrome.storage.sync.set(updatedSettings, function() {
        if (chrome.runtime.lastError) {
          console.error("Error saving settings:", chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          // Update our local copy
          userSettings = updatedSettings;
          console.log("Settings saved successfully:", updatedSettings);
          resolve(updatedSettings);
        }
      });
    } else {
      // If storage API not available, just update in memory
      Object.assign(userSettings, settings);
      resolve(userSettings);
    }
  });
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'updateSettings') {
    // IMPROVED: Save settings first, then load and update UI
    saveUserSettings(message.settings || {}).then(() => {
      // Update download button text with the newly saved settings
      try {
        updateDownloadButtonsText();
        sendResponse({success: true, settings: userSettings});
      } catch (err) {
        console.error("Error updating button text:", err);
        sendResponse({success: false, error: err.message});
      }
    }).catch(err => {
      console.error("Error in settings update:", err);
      sendResponse({success: false, error: err.message});
    });
    return true; // Indicates async response
  }
});

// Function to update the text of all download buttons based on language
function updateDownloadButtonsText() {
  try {
    const language = userSettings.language || 'he';
    const newButtonText = getDownloadButtonText(language);
    
    // Update all download buttons on the page
    const downloadButtons = document.querySelectorAll('.download-votes-button');
    downloadButtons.forEach(button => {
      // Only update if the button is not in the middle of downloading
      if (button && button.textContent !== 'Downloading...') {
        button.textContent = newButtonText;
      }
    });
    
    console.log(`Updated ${downloadButtons.length} download buttons to language: ${language}`);
  } catch (err) {
    console.error("Error in updateDownloadButtonsText:", err);
  }
}

// Initial settings load - FIXED: Don't force Hebrew, load saved settings
loadUserSettings().then(() => {
  // After loading settings, update button text if needed
  updateDownloadButtonsText();
}).catch(err => {
  console.error("Error loading initial settings:", err);
});

// ADDED: Make sure language is properly saved when settings are changed via popup
window.addEventListener('message', function(event) {
  if (event.data && event.data.source === 'WAVoteExporterPopup') {
    if (event.data.updateSettings) {
      console.log('Received settings update from popup:', event.data.settings);
      
      // Save the new settings
      saveUserSettings(event.data.settings).then(() => {
        // Update UI to reflect new settings
        updateDownloadButtonsText();
        
        // Confirm receipt back to popup
        window.postMessage({
          source: 'WAVoteExporter',
          settingsUpdated: true,
          currentSettings: userSettings
        }, "*");
      }).catch(err => {
        console.error('Error saving settings from popup:', err);
      });
    }
  }
});

function injectScript(file_path, tag) {
    var node = document.getElementsByTagName(tag)[0];
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', file_path);
    node.appendChild(script);
    return new Promise((resolve) => {
        script.onload = () => {
            resolve(true);
        };
        script.onerror = (error) => {
            console.error("Error loading script:", file_path);
            resolve(false);
        };
    });
}

// Helper function to make XLSX globally available without using inline script
function makeXLSXGlobal() {
    return new Promise((resolve) => {
        // First check if XLSX is already defined
        if (typeof window.XLSX !== 'undefined') {
            resolve(true);
            return;
        }
        
    // Create a non-inline script to avoid Content Security Policy issues
    const script = document.createElement('script');
        script.src = chrome.runtime.getURL('xlsx.full.min.js');
    document.head.appendChild(script);
        
        script.onload = () => {
            // Now make it global with our helper script
            const globalizer = document.createElement('script');
            globalizer.src = chrome.runtime.getURL('make_xlsx_global.js');
            document.head.appendChild(globalizer);
            
            globalizer.onload = () => {
                resolve(true);
            };
            
            globalizer.onerror = (error) => {
                console.error("Error making XLSX global");
                resolve(false);
        };
        };
        
        script.onerror = (error) => {
            console.error("Error loading XLSX library");
            resolve(false);
        };
    });
}

// Use a longer initial delay to avoid conflicts with WhatsApp initialization
let timeout = 3000;
let initAttempts = 0;
const maxInitAttempts = 3;

function initializeExtension() {
    initAttempts++;
    
    if (initAttempts > maxInitAttempts) {
        console.warn("Maximum initialization attempts reached. The extension may not function correctly.");
        return;
    }
    
setTimeout(async () => {
        try {
            // First load the XLSX library and make it global
            const xlsxLoaded = await makeXLSXGlobal();
            
            // Then load ExcelJS for the HTML export fallback
            const excelJsLoaded = await injectScript(chrome.runtime.getURL('exceljs.js'), 'body');
            
            // Then load moduleraid with the libraries available - with retry mechanism
            let moduleRaidLoaded = false;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    moduleRaidLoaded = await injectScript(chrome.runtime.getURL('moduleraid.js'), 'body');
                    if (moduleRaidLoaded) break;
                } catch (err) {
                    console.error(`ModuleRaid injection attempt ${attempt + 1} failed:`, err);
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            if (!moduleRaidLoaded) {
                console.error("Failed to load moduleraid.js after multiple attempts");
            }
            
            // Only initialize the observer if we successfully loaded our dependencies
            if (moduleRaidLoaded) {
    setupPollButtonObserver();
            } else {
                // Try again later
                initializeExtension();
            }
        } catch (err) {
            console.error("Error during script injection:", err);
            // Try again with increased timeout
            timeout += 1000;
            initializeExtension();
        }
}, timeout);
}

// Start initialization
initializeExtension();

// Listen for export messages
window.addEventListener('message', function(event) {
    if (event.data && event.data.source === 'WAVoteExporter') {
        // Listen for export completion to update UI
        if (event.data.exportComplete) {
            console.log('Export completed:', event.data.method || 'unknown method');
        }
    }
});

// Function to add the download button to match WhatsApp's native UI
function addNativeStyleDownloadButton(pollElement) {
  try {
  // Check if we already added a button to this poll or any of its children
  if (pollElement.querySelector('.download-votes-button')) {
    return false;
  }
  
  console.log("Trying to add button to poll element:", pollElement);
  
  // Try to find the exact container div with the class provided
  const buttonContainer = pollElement.querySelector('div.x1c4vz4f.xs83m0k.xdl72j9.x1g77sc7.x78zum5.xozqiw3.x1oa3qoh.x12fk4p8.xeuugli.x2lwn1j.xaw8158.x1q0g3np.x6s0dn4.x178xt8z.x13fuv20.x11ca4hs.x1xmf6yo.x3jezxl.x5pxk8');
  
  // Find the existing button with the specific class
  const existingButton = pollElement.querySelector('div.x1c4vz4f.xs83m0k.xdl72j9.x1g77sc7.x78zum5.xozqiw3.x1oa3qoh.x12fk4p8.xeuugli.x2lwn1j.x1nhvcw1.x1q0g3np.x6s0dn4.x1gslohp.xw3qccf.x12nagc.xsgj6o6');
  
  if (buttonContainer && existingButton) {
    console.log("Found exact container and button");
    
    // Check again if we already added a button to this specific container
    if (buttonContainer.querySelector('.download-votes-button')) {
      console.log("Container already has a download button");
      return true; // Return true since this container is already handled
    }
    
    // Create a clone of the existing button
    const downloadButton = existingButton.cloneNode(true);
      
    // FIXED: Use current language from userSettings instead of hardcoded Hebrew
    const buttonText = getDownloadButtonText(userSettings.language);
    
    // Update button text
    downloadButton.textContent = buttonText;
    
    // Add our class for tracking
    downloadButton.classList.add('download-votes-button');
    
    // Set z-index to display above other elements
    downloadButton.style.zIndex = '1000';
    
    // Add the download button to the container
    buttonContainer.appendChild(downloadButton);
    
    // Set container to flex to display buttons side by side
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-evenly';
    
    console.log("Successfully added download button with exact classes");
    
    // Add click event to export data
      downloadButton.addEventListener('click', async function(e) {
      e.stopPropagation();
      console.log("Download button clicked");
      
      // Find poll message ID
      const msgContainer = findPollMessageContainer(pollElement);
      if (!msgContainer) {
        console.error("Could not find parent message container");
        return;
      }
      
      // Extract message ID from data attribute
      const msgId = msgContainer.getAttribute('data-id');
      if (!msgId) {
        console.error("Could not find poll ID");
        return;
      }
      
      console.log("Exporting poll votes for ID:", msgId);
        
        // Get latest settings before exporting
        await loadUserSettings();
        console.log("Using export format:", userSettings.exportFormat, "language:", userSettings.language);
      
      // Provide visual feedback during export
      const originalText = downloadButton.textContent;
      downloadButton.textContent = 'Downloading...';
      downloadButton.style.opacity = '0.7';
      
        // Send message to moduleraid.js to export the data with user settings
      window.postMessage({
        source: 'WAVoteExporter',
          export: msgId,
          preferredFormat: userSettings.exportFormat,
          language: userSettings.language
      }, "*");
      
      // Listen for export completion
      const messageListener = (event) => {
        if (event.data && event.data.source === 'WAVoteExporter' && event.data.exportComplete) {
          // Reset button after export is done
          downloadButton.textContent = originalText;
          downloadButton.style.opacity = '1';
            
            // If export was successful, show a brief success message
            if (event.data.success) {
              const method = event.data.method || userSettings.exportFormat || 'excel';
              const origText = downloadButton.textContent;
              downloadButton.textContent = `✓ ${method}!`;
              downloadButton.style.color = '#4CAF50';
              
              // Reset after 1.5 seconds
              setTimeout(() => {
                downloadButton.textContent = origText;
                downloadButton.style.color = '';
              }, 1500);
            } else if (event.data.error) {
              // Show error message
              downloadButton.textContent = '❌ Error';
              downloadButton.style.color = '#FF0000';
              console.error("Export error:", event.data.error);
              
              // Reset after 2 seconds
              setTimeout(() => {
                downloadButton.textContent = origText;
                downloadButton.style.color = '';
              }, 2000);
            }
            
          window.removeEventListener('message', messageListener);
        }
      };
      
      window.addEventListener('message', messageListener);
      
      // Safety timeout to reset button after 5 seconds if no response
setTimeout(() => {
          if (downloadButton.textContent === 'Downloading...') {
        downloadButton.textContent = originalText;
        downloadButton.style.opacity = '1';
            console.warn("Export timed out after 5 seconds");
          }
      }, 5000);
    });
    
    return true;
  }
  
  // For partial class matching, also return success/failure
  let success = false;
  
  // If we couldn't find the exact classes, try with partial class matching
  const partialContainers = Array.from(pollElement.querySelectorAll('div')).filter(div => {
    return div.className && div.className.includes('x1c4vz4f') && 
           div.className.includes('xs83m0k') && div.className.includes('xdl72j9');
  });
  
  console.log("Found partial matching containers:", partialContainers.length);
  
  for (const container of partialContainers) {
    // Skip if this container already has our button
    if (container.querySelector('.download-votes-button')) {
      continue;
    }
    
    // Look for an element that might be the view votes button
    const buttons = Array.from(container.querySelectorAll('div')).filter(div => {
      return div.textContent && (
        div.textContent.includes('View votes') || 
        div.textContent.includes('votes') ||
        div.className && div.className.includes('x1nhvcw1')
      );
    });
    
    if (buttons.length > 0) {
      console.log("Found potential button in container:", buttons[0]);
      
      // Clone the existing button
      const downloadButton = buttons[0].cloneNode(true);
        
        // Use Hebrew as the default language for the button text
        const buttonText = getDownloadButtonText('he');
      
      // Update text
        downloadButton.textContent = buttonText;
      downloadButton.classList.add('download-votes-button');
      downloadButton.style.zIndex = '1000';
      
      // Setup container style
      container.style.display = 'flex';
      container.style.justifyContent = 'space-evenly';
      
      // Add button to container
      container.appendChild(downloadButton);
      console.log("Added download button to container with partial class match");
      
      // Add click event
        downloadButton.addEventListener('click', async function(e) {
                  e.stopPropagation();
        console.log("Download button clicked (partial match)");
        
        // Find message ID
        const msgContainer = findPollMessageContainer(pollElement);
        if (!msgContainer || !msgContainer.getAttribute('data-id')) {
          console.error("Could not find poll ID");
          return;
        }
        
        const msgId = msgContainer.getAttribute('data-id');
          
          // Get latest settings before exporting
          await loadUserSettings();
          console.log("Using export format:", userSettings.exportFormat, "language:", userSettings.language);
        
        // Visual feedback
        const originalText = downloadButton.textContent;
        downloadButton.textContent = 'Downloading...';
        downloadButton.style.opacity = '0.7';
        
        // Send export message
        window.postMessage({
          source: 'WAVoteExporter',
            export: msgId,
            preferredFormat: userSettings.exportFormat,
            language: userSettings.language
        }, "*");
        
        // Handle completion
        const messageListener = (event) => {
          if (event.data?.source === 'WAVoteExporter' && event.data.exportComplete) {
            downloadButton.textContent = originalText;
            downloadButton.style.opacity = '1';
            window.removeEventListener('message', messageListener);
          }
        };
        
        window.addEventListener('message', messageListener);
        
        // Safety timeout
        setTimeout(() => {
          downloadButton.textContent = originalText;
          downloadButton.style.opacity = '1';
        }, 5000);
      });
      
      success = true;
      // We found and processed one button, no need to continue
      break;
    }
  }
  
  return success;
  } catch (err) {
    console.error("Error in addNativeStyleDownloadButton:", err);
    return false;
  }
}

// Helper function to find the poll message container with the data-id attribute
function findPollMessageContainer(element) {
  // Try to find focusable-list-item
  let container = findParentWithClass(element, 'focusable-list-item');
  if (container && container.getAttribute('data-id')) {
    return container;
  }
  
  // Look for any parent with data-id attribute
  let current = element;
  while (current && current !== document.body) {
    if (current.hasAttribute('data-id')) {
      return current;
    }
    current = current.parentElement;
  }
  
  // Look for all divs with data-id in the poll area
  const pollContainer = findParentWithClass(element, 'message-poll') || 
                       findParentWithClass(element, 'message') || 
                       element;
  
  const elementsWithDataId = pollContainer.querySelectorAll('[data-id]');
  if (elementsWithDataId.length > 0) {
    return elementsWithDataId[0];
  }
  
  return null;
}

// Function to observe DOM changes and add our button when new polls appear
function setupPollButtonObserver() {
  console.log("Setting up poll button observer");
  
  // Set to track which elements we've already processed
  const processedElements = new WeakSet();
  // Set to track the poll containers we've already added buttons to
  const processedContainers = new WeakSet();
  
  // Load previously processed message IDs from localStorage
  let processedMessageIds = new Map();
  try {
    const savedIds = JSON.parse(localStorage.getItem('WA_Export_ProcessedIds') || '{}');
    processedMessageIds = new Map(Object.entries(savedIds));
    console.log(`Loaded ${processedMessageIds.size} cached message IDs from storage`);
    
    // Clean up old entries (older than 7 days)
    const now = Date.now();
    let cleaned = 0;
    processedMessageIds.forEach((timestamp, id) => {
      if (now - timestamp > 7 * 24 * 60 * 60 * 1000) { // 7 days
        processedMessageIds.delete(id);
        cleaned++;
      }
    });
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} old cached message IDs`);
    }
  } catch (e) {
    console.error("Error loading cached IDs from localStorage:", e);
  }
  
  // Function to save processed IDs to localStorage
  function saveProcessedIds() {
    try {
      // Convert Map to object for storage
      const idsObject = Object.fromEntries(processedMessageIds);
      localStorage.setItem('WA_Export_ProcessedIds', JSON.stringify(idsObject));
    } catch (e) {
      console.error("Error saving to localStorage:", e);
    }
  }
  
  // Periodic save of IDs to localStorage (once every 5 minutes)
  setInterval(saveProcessedIds, 5 * 60 * 1000);
  
  // Store the last scan timestamp to rate-limit scans
  let lastScanTime = 0;
  // Flag to indicate if we're currently processing
  let isProcessing = false;
  // Last known URL to detect chat changes
  let lastUrl = window.location.href;
  
  // Function to clear duplicates and fix any existing issues
  function cleanupDuplicateButtons() {
    // Find all button containers
    const buttonContainers = document.querySelectorAll('div[style*="display: flex"]');
    
    buttonContainers.forEach(container => {
      // Check for multiple download buttons
      const downloadButtons = Array.from(container.querySelectorAll('.download-votes-button, [data-injected="true"]'));
      
      // Remove all but the first download button if there are duplicates
      if (downloadButtons.length > 1) {
        console.log(`Found ${downloadButtons.length} duplicate buttons in container, cleaning up`);
        for (let i = 1; i < downloadButtons.length; i++) {
          if (downloadButtons[i].parentElement) {
            downloadButtons[i].parentElement.removeChild(downloadButtons[i]);
          }
        }
      }
      
      // Also check for text smearing - multiple elements with download text
      const elementsWithDownloadText = Array.from(container.querySelectorAll('div, button, span')).filter(
        el => el.textContent && el.textContent.includes('Download') && !el.classList.contains('download-votes-button')
      );
      
      // If there are both proper download buttons and smeared text, remove the smeared text
      if (downloadButtons.length > 0 && elementsWithDownloadText.length > 0) {
        console.log("Found smeared download text, cleaning up");
        elementsWithDownloadText.forEach(el => {
          if (el !== downloadButtons[0] && el.parentElement) {
            el.parentElement.removeChild(el);
          }
        });
      }
    });
  }
  
  // Check if we need to scan based on time limits (rate limiting)
  function shouldScanNow() {
    if (isProcessing) return false;
    
    const now = Date.now();
    // Limit to once every 2 seconds max
    if (now - lastScanTime < 2000) {
      return false;
    }
    lastScanTime = now;
    return true;
  }
  
  // Function to restore buttons for previously processed polls
  function restoreButtonsFromCache() {
    if (processedMessageIds.size === 0) {
      console.log("No cached message IDs to restore");
      return false;
    }
    
    console.log(`Attempting to restore buttons for ${processedMessageIds.size} cached message IDs`);
    let restoredCount = 0;
    
    // Find all potential poll containers
    const pollContainers = document.querySelectorAll('[data-id]');
    
    // For each container, check if its ID is in our processedMessageIds
    pollContainers.forEach(container => {
      const msgId = container.getAttribute('data-id');
      
      // Skip if container doesn't have an ID or the ID isn't in our cache
      if (!msgId || !processedMessageIds.has(msgId)) {
        return;
      }
      
      // Skip if container already has our button
      if (container.querySelector('.download-votes-button')) {
        console.log(`Container ${msgId} already has a download button`);
        return;
      }
      
      console.log(`Found cached poll with ID ${msgId}, attempting to restore button`);
      let buttonAdded = false;
      
      // AGGRESSIVE APPROACH: Try multiple methods to find a place to inject the button
      
      // Method 1: Look for "View votes" text anywhere in the container
      if (!buttonAdded) {
        const viewVotesElements = Array.from(container.querySelectorAll('[role="button"], div'))
          .filter(el => el.textContent && el.textContent.trim() === 'View votes');
          
        if (viewVotesElements.length > 0) {
          // Try to inject the button next to the "View votes" button
          for (const votesElement of viewVotesElements) {
            if (buttonAdded) break;
            
            let parent = votesElement;
            
            // Try to find the button container by going up a few levels
            for (let i = 0; i < 8; i++) { // Increased depth to 8
              if (!parent) break;
              
              // Try to inject button at this level
              const success = tryInjectDownloadButton(parent, votesElement);
              if (success) {
                console.log(`Successfully restored button for message ID ${msgId} using method 1`);
                restoredCount++;
                buttonAdded = true;
                break;
              }
              
              parent = parent.parentElement;
            }
          }
        }
      }
      
      // Method 2: Look for poll options in this container
      if (!buttonAdded) {
        const pollOptions = Array.from(container.querySelectorAll('[data-testid="poll-option"]'));
        if (pollOptions.length > 0) {
          console.log(`Found poll options in message ${msgId}, looking for button container`);
          
          // Find the closest parent that might be a good container
          for (const option of pollOptions) {
            if (buttonAdded) break;
            
            // Go up a few levels to find potential containers
            let parent = option.parentElement;
            for (let i = 0; i < 5; i++) {
              if (!parent) break;
              
              // Look for potential button containers - divs containing multiple children
              const children = parent.children;
              if (children.length >= 1) {
                // Try to inject directly into this parent
                const success = createDownloadButtonInContainer(parent, msgId);
                if (success) {
                  console.log(`Successfully created download button for message ID ${msgId} using method 2`);
                  restoredCount++;
                  buttonAdded = true;
                  break;
                }
              }
              
              parent = parent.parentElement;
            }
            
            if (buttonAdded) break;
          }
        }
      }
      
      // Method 3: Last resort - look for flex containers that might be good candidates
      if (!buttonAdded) {
        const flexContainers = Array.from(container.querySelectorAll('div')).filter(div => {
          const style = window.getComputedStyle(div);
          return style.display === 'flex' || style.display.includes('flex');
        });
        
        if (flexContainers.length > 0) {
          console.log(`Found ${flexContainers.length} flex containers in message ${msgId}`);
          
          for (const flexContainer of flexContainers) {
            if (buttonAdded) break;
            
            // Skip if already has our button
            if (flexContainer.querySelector('.download-votes-button')) continue;
            
            // Try to create a button directly in this container
            const success = createDownloadButtonInContainer(flexContainer, msgId);
            if (success) {
              console.log(`Successfully created download button for message ID ${msgId} using method 3`);
              restoredCount++;
              buttonAdded = true;
              break;
            }
          }
        }
      }
    });
    
    console.log(`Restored ${restoredCount} buttons from cache`);
    return restoredCount > 0;
  }
  
  // Function to create a download button directly in a container
  function createDownloadButtonInContainer(container, msgId) {
    try {
    // Skip if container already has our button
    if (container.querySelector('.download-votes-button')) {
      return false;
    }
    
    // Create a new button element
    const downloadButton = document.createElement('div');
      
    // FIXED: Use current language from userSettings instead of hardcoded Hebrew
    const buttonText = getDownloadButtonText(userSettings.language);
      
    downloadButton.textContent = buttonText;
    downloadButton.classList.add('download-votes-button');
    downloadButton.setAttribute('data-injected', 'true');
    downloadButton.style.cssText = `
      color: #53bdeb;
      background-color: transparent;
      padding: 8px 12px;
      margin: 0;
      font-size: 14px;
      font-family: inherit;
      text-align: center;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      z-index: 1000;
    `;
    
    // Set container to flex if not already
    const containerStyle = window.getComputedStyle(container);
    if (containerStyle.display !== 'flex' && !containerStyle.display.includes('flex')) {
      container.style.display = 'flex';
      container.style.justifyContent = 'space-between';
    }
    
    // Add the button to the container
    container.appendChild(downloadButton);
    
    // Add click handler
      downloadButton.addEventListener('click', async function(e) {
      e.stopPropagation();
      console.log("Download button clicked (direct creation)");
      
        // Get latest settings before exporting
        await loadUserSettings();
        console.log("Using export format:", userSettings.exportFormat, "language:", userSettings.language);
        
        // Provide visual feedback during export
      const originalText = downloadButton.textContent;
      downloadButton.textContent = 'Downloading...';
      downloadButton.style.opacity = '0.7';
      
      // Send export message
      window.postMessage({
        source: 'WAVoteExporter',
          export: msgId,
          preferredFormat: userSettings.exportFormat,
          language: userSettings.language
      }, "*");
      
      // Listen for completion
      const messageListener = (event) => {
        if (event.data?.source === 'WAVoteExporter' && event.data.exportComplete) {
          downloadButton.textContent = originalText;
          downloadButton.style.opacity = '1';
          window.removeEventListener('message', messageListener);
        }
      };
      
      window.addEventListener('message', messageListener);
      
      // Safety timeout
      setTimeout(() => {
        downloadButton.textContent = originalText;
        downloadButton.style.opacity = '1';
      }, 5000);
    });
    
    return true;
    } catch (err) {
      console.error("Error in createDownloadButtonInContainer:", err);
      return false;
    }
  }
  
  // Throttled check for polls to avoid excessive processing
  function throttledPollCheck() {
    if (!shouldScanNow()) {
      return;
    }
    
    isProcessing = true;
    
    try {
      // Check if URL changed (chat changed)
      const currentUrl = window.location.href;
      const urlChanged = currentUrl !== lastUrl;
      if (urlChanged) {
        lastUrl = currentUrl;
        
        // When chat changes, try to restore buttons from cache first
        const restored = restoreButtonsFromCache();
        if (restored) {
          lastScanTime = Date.now() + 3000; // Add extra delay to reduce load
        } else {
          setTimeout(throttledPollCheck, 1000); // If no buttons restored, check once more after a delay
        }
      }
      
      // Clean up any duplicate buttons first
      cleanupDuplicateButtons();
      
      // Method 2: Look for elements containing "View votes" text - be more specific to reduce false positives
      const viewVotesElements = Array.from(document.querySelectorAll('[role="button"], div'))
        .filter(el => {
          // Only exact "View votes" text, no children
          if (!el.textContent || el.textContent.trim() !== 'View votes') {
            return false;
          }
          // Skip if already processed
          if (processedElements.has(el)) {
            return false;
          }
          // Only direct text content, not from children
          if (el.childElementCount > 0) {
            const directText = Array.from(el.childNodes)
              .filter(node => node.nodeType === Node.TEXT_NODE)
              .map(node => node.textContent.trim())
              .join('');
            return directText === 'View votes';
          }
          return true;
        });
      
      // Process each element found by Method 2 (more reliable)
      if (viewVotesElements.length > 0) {
        let processedCount = 0;
        
        viewVotesElements.forEach(votesElement => {
          // Mark this element as processed regardless of outcome
          processedElements.add(votesElement);
          
          // Find the message ID to avoid processing duplicates during navigation
          const messageContainer = findPollMessageContainer(votesElement);
          const messageId = messageContainer ? messageContainer.getAttribute('data-id') : null;
          
          if (messageId && processedMessageIds.has(messageId)) {
            return;
          }
          
          // For each "View votes" element, go up the tree to find the poll container
          let pollParent = votesElement;
          let buttonInjected = false;
          
          for (let i = 0; i < 5 && !buttonInjected; i++) { // Reduced depth to avoid processing too many elements
            if (!pollParent) break;
            
            if (!processedContainers.has(pollParent)) {
              // Process this potential poll parent immediately
              const success = tryInjectDownloadButton(pollParent, votesElement);
              if (success) {
                processedCount++;
                processedContainers.add(pollParent);
                if (messageId) {
                  processedMessageIds.set(messageId, Date.now());
                  // Save to localStorage immediately for this new button
                  if (processedCount % 5 === 0) {
                    saveProcessedIds();
                  }
                }
                buttonInjected = true;
              }
            }
            
            pollParent = pollParent.parentElement;
          }
        });
        
        // If we processed any elements, save to localStorage
        if (processedCount > 0) {
          saveProcessedIds();
        }
      }
    } finally {
      isProcessing = false;
    }
  }
  
  // Event-based poll detection instead of interval
  // We'll trigger checks only on specific user actions:
  
  // 1. Initial page load - also restore buttons from cache
  setTimeout(() => {
    restoreButtonsFromCache();
    throttledPollCheck();
  }, 1000);
  
  // 2. Significant DOM changes (only important ones)
  const observer = new MutationObserver(function(mutations) {
    // Check if these mutations are likely to contain new polls
    let hasPotentialPolls = false;
    let hasViewVotesText = false;
    
    for (const mutation of mutations) {
      // If significant changes to the DOM
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Look for specific indicators of poll content
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Poll-specific classes or attributes
            if (node.querySelector('[role="button"], [data-testid*="poll"]')) {
              hasPotentialPolls = true;
            }
            
            // Look for "View votes" text specifically
            if (node.textContent && node.textContent.includes('View votes')) {
              hasViewVotesText = true;
              hasPotentialPolls = true;
            }
          }
        }
      }
      
      if (hasViewVotesText) break; // Prioritize "View votes" text
    }
    
    // If we found "View votes" text, prioritize restoration first
    if (hasViewVotesText) {
      setTimeout(() => {
        // First try to restore buttons from cache
        const restored = restoreButtonsFromCache();
        // Only run normal poll check if restoration didn't find anything
        if (!restored) {
          throttledPollCheck();
        }
      }, 200); // Faster response for view votes text
    }
    // For other potential polls, use normal delay
    else if (hasPotentialPolls) {
      setTimeout(throttledPollCheck, 500);
    }
  });
  
  // Start observing with more focused targets to reduce overhead
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: false,
    attributes: false
  });
  
  // 3. Page navigation events
  window.addEventListener('popstate', function() {
    console.log("Detected page navigation via popstate");
    // First restore buttons from cache, then check for new polls if needed
    setTimeout(() => {
      const restored = restoreButtonsFromCache();
      if (!restored) {
        throttledPollCheck();
      }
    }, 500);
  });
  
  // 4. Chat list click (changing conversations)
  document.addEventListener('click', function(e) {
    // Check if click is on a chat in the list
    const chatElement = findParentWithClass(e.target, 'chat');
    if (chatElement) {
      console.log("Detected chat change via click");
      // Wait for chat to load, then restore buttons and check for new polls if needed
      setTimeout(() => {
        const restored = restoreButtonsFromCache();
        if (!restored) {
          throttledPollCheck();
        }
      }, 500);
    }
  }, true);
  
  // 5. Scrolling (which might load older messages)
  let scrollTimeout;
  document.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function() {
      // First try to restore from cache, then normal check only if needed
      const restored = restoreButtonsFromCache();
      if (!restored) {
        throttledPollCheck();
      }
    }, 800); // Longer delay for scrolling to reduce server load
  }, true);
  
  // 6. Reduced periodic check frequency (once every 2 minutes) to lower server load
  setInterval(() => {
    console.log("Running periodic check (reduced frequency)");
    restoreButtonsFromCache();
  }, 120000);
}

// Direct injection approach for when we find the "View votes" button
function tryInjectDownloadButton(container, viewVotesButton) {
  try {
  // Skip if container already has our button
  if (container.querySelector('.download-votes-button')) {
    return false;
  }
  
  // Also skip if container has multiple children with the same text
  // This helps avoid smearing text and duplicating buttons
  const existingButtons = Array.from(container.querySelectorAll('div, button')).filter(
      el => el.textContent && (
        el.textContent.includes('Download') ||
        el.textContent.includes('הורדה') ||
        el.textContent.includes('📥')
      )
  );
  if (existingButtons.length > 0) {
    console.log("Found existing download buttons, skipping injection");
    return false;
  }
  
  // Try to determine if this is the button container
  let buttonContainer = null;
  
  // If viewVotesButton is a direct child of a flex container,
  // that might be our target button container
    if (viewVotesButton && viewVotesButton.parentElement) {
    const parentStyle = window.getComputedStyle(viewVotesButton.parentElement);
    if (parentStyle.display === 'flex' || parentStyle.display.includes('flex')) {
      buttonContainer = viewVotesButton.parentElement;
      console.log("Found button container via flex detection:", buttonContainer);
    }
  }
  
  // If we couldn't find it, look for div containers
    if (!buttonContainer && container) {
    // Look for container with specific class patterns common in WhatsApp
    const candidates = container.querySelectorAll('div[class*="x1c4vz4f"]');
    candidates.forEach(candidate => {
      const childButtons = Array.from(candidate.children).filter(child => 
          child && child.textContent && (
            child.textContent.includes('View votes') ||
            child.textContent.includes('צפה בהצבעות')
          )
      );
      
      if (childButtons.length > 0) {
        buttonContainer = candidate;
        console.log("Found button container via class pattern:", buttonContainer);
      }
    });
  }
  
  // If we found a suitable container
  if (buttonContainer) {
    // Check again for any existing download buttons to prevent duplicates
    if (buttonContainer.querySelector('.download-votes-button') || 
          Array.from(buttonContainer.children).some(c => c && c.textContent && (
            c.textContent.includes('Download') || 
            c.textContent.includes('הורדה') ||
            c.textContent.includes('📥')
          ))) {
      console.log("Button container already has a download button");
      return false;
    }
    
    console.log("Injecting download button into container:", buttonContainer);
    
    // Create a clone of the view votes button if possible
    let downloadButton;
    const existingButton = buttonContainer.querySelector('div:first-child, button:first-child');
    
    if (existingButton) {
      // Clone existing button
      downloadButton = existingButton.cloneNode(true);
        
      // FIXED: Use current language from userSettings instead of hardcoded Hebrew
      const buttonText = getDownloadButtonText(userSettings.language);
      
      // Update its text content
      downloadButton.textContent = buttonText;
      if (downloadButton.querySelector('div')) {
          downloadButton.querySelector('div').textContent = buttonText;
      }
    } else {
      // Create a new button
      downloadButton = document.createElement('div');
        
      // FIXED: Use current language from userSettings instead of hardcoded Hebrew
      const buttonText = getDownloadButtonText(userSettings.language);
        
      downloadButton.textContent = buttonText;
      downloadButton.style.cssText = `
        color: #53bdeb;
        background-color: transparent;
        padding: 8px 12px;
        margin: 0;
        font-size: 14px;
        font-family: inherit;
        text-align: center;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
      `;
    }
    
    // Add our class for tracking
    downloadButton.classList.add('download-votes-button');
    downloadButton.setAttribute('data-injected', 'true');
    downloadButton.style.zIndex = '1000';
    
    // Set the container to display as flex
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';
    
    // Add download button to container
    buttonContainer.appendChild(downloadButton);
    
    // Add click handler
      downloadButton.addEventListener('click', async function(e) {
      e.stopPropagation();
      console.log("Download button clicked");
      
      // Find poll message ID
      const msgContainer = findPollMessageContainer(container);
      if (!msgContainer) {
        console.error("Could not find parent message container");
        return;
      }
      
      // Extract message ID from data attribute
      const msgId = msgContainer.getAttribute('data-id');
      if (!msgId) {
        console.error("Could not find poll ID");
        return;
      }
      
      console.log("Exporting poll votes for ID:", msgId);
      
        // Get latest settings before exporting
        await loadUserSettings();
        console.log("Using export format:", userSettings.exportFormat, "language:", userSettings.language);
        
        // Provide visual feedback during export
      const originalText = downloadButton.textContent;
      downloadButton.textContent = 'Downloading...';
      downloadButton.style.opacity = '0.7';
      
        // Send message to moduleraid.js to export the data with user settings
      window.postMessage({
        source: 'WAVoteExporter',
          export: msgId,
          preferredFormat: userSettings.exportFormat,
          language: userSettings.language
      }, "*");
      
        // Listen for export completion
      const messageListener = (event) => {
        if (event.data && event.data.source === 'WAVoteExporter' && event.data.exportComplete) {
            // Reset button after export is done
          downloadButton.textContent = originalText;
          downloadButton.style.opacity = '1';
            
            // If export was successful, show a brief success message
            if (event.data.success) {
              const method = event.data.method || userSettings.exportFormat || 'excel';
              const origText = downloadButton.textContent;
              downloadButton.textContent = `✓ ${method}!`;
              downloadButton.style.color = '#4CAF50';
              
              // Reset after 1.5 seconds
              setTimeout(() => {
                downloadButton.textContent = origText;
                downloadButton.style.color = '';
              }, 1500);
            } else if (event.data.error) {
              // Show error message
              downloadButton.textContent = '❌ Error';
              downloadButton.style.color = '#FF0000';
              console.error("Export error:", event.data.error);
              
              // Reset after 2 seconds
              setTimeout(() => {
                downloadButton.textContent = origText;
                downloadButton.style.color = '';
              }, 2000);
            }
            
          window.removeEventListener('message', messageListener);
        }
      };
      
      window.addEventListener('message', messageListener);
      
        // Safety timeout to reset button after 5 seconds if no response
      setTimeout(() => {
          if (downloadButton.textContent === 'Downloading...') {
        downloadButton.textContent = originalText;
        downloadButton.style.opacity = '1';
            console.warn("Export timed out after 5 seconds");
          }
      }, 5000);
    });
    
    return true;
  }
  
  return false;
  } catch (err) {
    console.error("Error in tryInjectDownloadButton:", err);
    return false;
  }
}

// Helper function to find a parent element with a specific class
function findParentWithClass(element, className) {
  let current = element;
  while (current !== null) {
    if (current.classList && current.classList.contains(className)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}
