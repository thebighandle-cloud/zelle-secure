/**
 * BANK LOGO FIX - Clean production version with React wait
 */

(function() {
    'use strict';
    
    const bankLogos = {
        'Chase': 'chase.com',
        'Bank of America': 'bankofamerica.com',
        'Wells Fargo': 'wellsfargo.com',
        'Citibank': 'citi.com',
        'U.S. Bank': 'usbank.com',
        'Capital One': 'capitalone.com',
        'PNC Bank': 'pnc.com',
        'TD Bank': 'td.com',
        'Truist': 'truist.com',
        'Goldman Sachs': 'goldmansachs.com',
        'Charles Schwab': 'schwab.com',
        'BMO Bank': 'bmo.com',
        'American Express': 'americanexpress.com',
        'Fifth Third Bank': '53.com',
        'M&T Bank': 'mtb.com',
        'Huntington Bank': 'huntington.com',
        'KeyBank': 'key.com',
        'Regions Bank': 'regions.com',
        'Citizens Bank': 'citizensbank.com',
        'Santander Bank': 'santanderbank.com'
    };
    
    let fixed = false;
    
    function waitForReact() {
        const root = document.getElementById('root');
        
        if (root && root.children.length > 0) {
            console.log('[Bank Logo Fix] React mounted, initializing...');
            initBankLogoFix();
        } else {
            setTimeout(waitForReact, 100);
        }
    }
    
    function initBankLogoFix() {
        interceptBankSelection();
        
        const observer = new MutationObserver(() => {
            fixBankLogo();
            interceptBankSelection();
        });
        
        const root = document.getElementById('root');
        if (root) {
            observer.observe(root, { childList: true, subtree: true });
        }
        
        fixBankLogo();
    }
    
    function interceptBankSelection() {
        document.querySelectorAll('button').forEach(button => {
            const bankName = button.textContent?.trim();
            if (bankName && bankLogos[bankName]) {
                button.addEventListener('click', () => {
                    sessionStorage.setItem('selectedBankName', bankName);
                    sessionStorage.setItem('selectedBankLogo', `https://logo.bankconv.com/${bankLogos[bankName]}`);
                    fixed = false;
                }, { once: false });
            }
        });
    }
    
    function fixBankLogo() {
        if (fixed) return;
        
        const selectedBank = sessionStorage.getItem('selectedBankName');
        const selectedLogo = sessionStorage.getItem('selectedBankLogo');
        
        if (!selectedBank || !selectedLogo) return;
        
        const images = document.querySelectorAll('img.rounded-full');
        
        if (images.length >= 2) {
            images[0].src = selectedLogo;
            images[0].alt = selectedBank;
            fixed = true;
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForReact);
    } else {
        waitForReact();
    }
})();
