// Auto-inject Bearer token from cookie to Swagger UI
(function() {
    // Function to get cookie value
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    // Add logout button
    function addLogoutButton() {
        const topbar = document.querySelector('.topbar');
        if (topbar && !document.getElementById('logout-btn')) {
            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'logout-btn';
            logoutBtn.innerHTML = 'Logout';
            logoutBtn.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #ff4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; z-index: 9999; transition: all 0.3s;';
            logoutBtn.onmouseover = () => logoutBtn.style.background = '#cc0000';
            logoutBtn.onmouseout = () => logoutBtn.style.background = '#ff4444';
            logoutBtn.onclick = function() {
                if (confirm('Are you sure you want to logout?')) {
                    document.cookie = 'auth_token=; path=/; max-age=0';
                    window.location.href = '/logout';
                }
            };
            document.body.appendChild(logoutBtn);
        }
    }

    // Wait for Swagger UI to load
    const intervalId = setInterval(function() {
        if (window.ui) {
            clearInterval(intervalId);
            
            // Get token from cookie
            const token = getCookie('auth_token');
            
            if (token) {
                console.log('Auto-injecting Bearer token to Swagger UI');
                
                // Inject Bearer token
                window.ui.preauthorizeApiKey('BearerAuth', `Bearer ${token}`);
                
                // Also try to set it via authActions
                setTimeout(() => {
                    try {
                        window.ui.authActions.authorize({
                            BearerAuth: {
                                name: 'BearerAuth',
                                schema: {
                                    type: 'http',
                                    scheme: 'bearer'
                                },
                                value: token
                            }
                        });
                        console.log('Bearer token successfully injected');
                    } catch (e) {
                        console.log('Using preauthorize method instead');
                    }
                }, 100);
                
                // Add logout button
                setTimeout(addLogoutButton, 500);
            } else {
                console.warn('No auth token found in cookie');
            }
        }
    }, 100);
    
    // Cleanup after 10 seconds
    setTimeout(() => clearInterval(intervalId), 10000);
})();
