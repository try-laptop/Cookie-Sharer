document.addEventListener('DOMContentLoaded', () => {
    // Tab navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Buttons
    const exportBtn = document.getElementById('exportCookies');
    const importBtn = document.getElementById('importCookies');
    const clearBtn = document.getElementById('clearAndRefresh');
    const getCookiesBtn = document.getElementById('getCookies');
    const fileInput = document.getElementById('fileInput');
    const statusMessage = document.getElementById('statusMessage');
    
    // Status elements
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const lastUpdated = document.getElementById('lastUpdated');
    
    // Server URL - change this to your deployed server URL when needed
    const SERVER_URL = 'http://localhost:3000';

    // Tab switching functionality
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
            
            // If switching to receiver tab, check status
            if (tabId === 'receiver') {
                checkStatus();
            }
        });
    });
    
    // Format date for display
    function formatDate(dateString) {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleString();
    }
    
    function showStatus(message, type = 'success') {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        setTimeout(() => {
            statusMessage.className = 'status-message';
        }, 3000);
    }
    
    // Function to send cookies to MongoDB server
    async function sendCookiesToServer(cookies) {
        try {
            const response = await fetch(`${SERVER_URL}/api/cookies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cookies: JSON.stringify(cookies, null, 2) })
            });
            
            if (!response.ok) {
                throw new Error('Failed to send cookies to server');
            }
            
            return true;
        } catch (error) {
            console.error('Server error:', error);
            return false;
        }
    }
    
    // Function to get cookies from MongoDB server
    async function getCookiesFromServer() {
        try {
            const response = await fetch(`${SERVER_URL}/api/cookies`);
            if (!response.ok) {
                throw new Error('Failed to fetch cookies');
            }
            
            const data = await response.json();
            if (!data || !data.cookies) {
                throw new Error('No cookies available');
            }
            
            return data.cookies;
        } catch (error) {
            console.error('Error fetching cookies:', error);
            throw error;
        }
    }
    
    // Function to check login status
    async function checkStatus() {
        try {
            const response = await fetch(`${SERVER_URL}/api/status`);
            if (!response.ok) {
                throw new Error('Failed to fetch status');
            }
            
            const data = await response.json();
            
            if (data.isExpired) {
                statusDot.className = 'status-dot offline';
                statusText.textContent = 'Cookies have expired (56 hours passed)';
            } else if (data.isLoggedIn) {
                statusDot.className = 'status-dot online';
                statusText.textContent = 'Your friend is currently logged in';
            } else {
                statusDot.className = 'status-dot offline';
                statusText.textContent = 'Your friend is currently logged out';
            }
            
            lastUpdated.textContent = `Last updated: ${formatDate(data.lastUpdated)}`;
        } catch (error) {
            console.error('Error checking status:', error);
            statusDot.className = 'status-dot offline';
            statusText.textContent = 'Unable to check status';
            showStatus('Failed to check login status', 'error');
        }
    }
    
    // Function to notify server of logout
    async function notifyServerOfLogout() {
        try {
            const response = await fetch(`${SERVER_URL}/api/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to notify server of logout');
            }
            
            return true;
        } catch (error) {
            console.error('Server logout error:', error);
            return false;
        }
    }
    
    exportBtn.addEventListener('click', async () => {
        try {
            exportBtn.disabled = true;
            exportBtn.innerHTML = '<span class="btn-icon">⏳</span> Processing...';
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Get cookies from both domains
            const learnCookies = await chrome.cookies.getAll({ domain: 'learn.apnacollege.in' });
            const mainCookies = await chrome.cookies.getAll({ domain: 'www.apnacollege.in' });
            const apnaCookies = await chrome.cookies.getAll({ domain: 'apnacollege.in' });
            
            // Combine all cookies
            const cookies = [...learnCookies, ...mainCookies, ...apnaCookies];
            
            if (!cookies.length) {
                showStatus('No cookies found to export!', 'error');
                return;
            }

            // Create file for download (as backup)
            const blob = new Blob([JSON.stringify(cookies, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `apna-college-cookies-${timestamp}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            // Send cookies to MongoDB server
            const serverSuccess = await sendCookiesToServer(cookies);
            if (serverSuccess) {
                showStatus('Cookies exported and shared with your friend!');
            } else {
                showStatus('Cookies exported but failed to share with your friend', 'error');
            }
        } catch (error) {
            console.error('Export error:', error);
            showStatus('Failed to export cookies!', 'error');
        } finally {
            exportBtn.disabled = false;
            exportBtn.innerHTML = '<span class="btn-icon">📤</span> Export & Share Cookies';
        }
    });

    // Get latest cookies button
    getCookiesBtn.addEventListener('click', async () => {
        try {
            getCookiesBtn.disabled = true;
            getCookiesBtn.innerHTML = '<span class="btn-icon">⏳</span> Loading...';
            
            // Get cookies from server
            const cookiesData = await getCookiesFromServer();
            
            // Parse cookies
            const cookies = JSON.parse(cookiesData);
            
            if (!Array.isArray(cookies) || cookies.length === 0) {
                showStatus('No valid cookies found on server', 'error');
                return;
            }
            
            // Import cookies
            let successCount = 0;
            for (const cookie of cookies) {
                try {
                    await chrome.cookies.set({
                        url: `https://${cookie.domain}${cookie.path}`,
                        name: cookie.name,
                        value: cookie.value,
                        domain: cookie.domain,
                        path: cookie.path,
                        secure: cookie.secure,
                        httpOnly: cookie.httpOnly,
                        sameSite: cookie.sameSite,
                        expirationDate: cookie.expirationDate,
                    });
                    successCount++;
                } catch (error) {
                    console.error('Error setting cookie:', error);
                }
            }

            if (successCount > 0) {
                showStatus(`Successfully imported ${successCount} cookies!`);
                setTimeout(() => {
                    chrome.tabs.reload();
                }, 1000);
            } else {
                showStatus('Failed to import any cookies!', 'error');
            }
        } catch (error) {
            console.error('Error getting cookies:', error);
            showStatus('Failed to get cookies. Please try again later.', 'error');
        } finally {
            getCookiesBtn.disabled = false;
            getCookiesBtn.innerHTML = '<span class="btn-icon">🔄</span> Get Latest Cookies';
        }
    });
    
    importBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (event) => {
        try {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const cookies = JSON.parse(e.target.result);
                    if (!Array.isArray(cookies)) {
                        throw new Error('Invalid cookie format');
                    }

                    let successCount = 0;
                    for (const cookie of cookies) {
                        try {
                            await chrome.cookies.set({
                                url: `https://${cookie.domain}${cookie.path}`,
                                name: cookie.name,
                                value: cookie.value,
                                domain: cookie.domain,
                                path: cookie.path,
                                secure: cookie.secure,
                                httpOnly: cookie.httpOnly,
                                sameSite: cookie.sameSite,
                                expirationDate: cookie.expirationDate,
                            });
                            successCount++;
                        } catch (error) {
                            console.error('Error setting cookie:', error);
                        }
                    }

                    if (successCount > 0) {
                        showStatus(`Successfully imported ${successCount} cookies!`);
                        setTimeout(() => {
                            chrome.tabs.reload();
                        }, 1000);
                    } else {
                        showStatus('No cookies were imported!', 'error');
                    }
                } catch (error) {
                    console.error('Import error:', error);
                    showStatus('Invalid cookie file format!', 'error');
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('File read error:', error);
            showStatus('Failed to read cookie file!', 'error');
        }
    });

    clearBtn.addEventListener('click', async () => {
        try {
            // Get cookies from all domains
            const learnCookies = await chrome.cookies.getAll({ domain: 'learn.apnacollege.in' });
            const mainCookies = await chrome.cookies.getAll({ domain: 'www.apnacollege.in' });
            const apnaCookies = await chrome.cookies.getAll({ domain: 'apnacollege.in' });
            
            // Combine all cookies
            const allCookies = [...learnCookies, ...mainCookies, ...apnaCookies];
            
            for (const cookie of allCookies) {
                await chrome.cookies.remove({
                    url: `https://${cookie.domain}${cookie.path}`,
                    name: cookie.name,
                });
            }
            
            // Notify server of logout
            const serverSuccess = await notifyServerOfLogout();
            if (serverSuccess) {
                showStatus('Cookies cleared and friend notified!');
            } else {
                showStatus('Cookies cleared but failed to notify friend', 'error');
            }
            
            setTimeout(() => {
                chrome.tabs.reload();
            }, 1000);
        } catch (error) {
            console.error('Clear error:', error);
            showStatus('Failed to clear cookies!', 'error');
        }
    });
});
