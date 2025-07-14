// Make sure XLSX is globally available for other scripts
(function() {
    try {
        // Function to safely verify XLSX functionality
        function verifyXLSX(xlsxObj) {
            if (!xlsxObj) return false;
            
            // Check basic structure
            if (typeof xlsxObj !== 'object') return false;
            if (!xlsxObj.utils || typeof xlsxObj.utils !== 'object') return false;
            if (!xlsxObj.write || typeof xlsxObj.write !== 'function') return false;
            
            // Check for essential functions
            const requiredFunctions = [
                'book_new', 'aoa_to_sheet', 'book_append_sheet'
            ];
            
            for (const func of requiredFunctions) {
                if (typeof xlsxObj.utils[func] !== 'function') {
                    console.warn(`XLSX.utils.${func} is not a function`);
                    return false;
                }
            }
            
            // Test basic functionality
            try {
                // Try to create a minimal workbook
                const testWb = xlsxObj.utils.book_new();
                const testWs = xlsxObj.utils.aoa_to_sheet([["Test"]]);
                xlsxObj.utils.book_append_sheet(testWb, testWs, "Sheet1");
                
                // Try to write (but don't actually write)
                const testOutput = xlsxObj.write(testWb, {type: 'array', bookType: 'xlsx'});
                
                // Check if output is valid
                if (!testOutput || testOutput.length < 100) {
                    console.warn("XLSX write test failed - invalid output");
                    return false;
                }
                
                return true;
            } catch (testErr) {
                console.warn("XLSX functionality test failed:", testErr.message);
                return false;
            }
        }
        
        // First check if XLSX is already defined globally
        if (typeof window.XLSX !== 'undefined') {
            // Verify it's working correctly
            if (verifyXLSX(window.XLSX)) {
                console.log("XLSX already globally available and working");
                window.XLSX_READY = true;
                return;
            } else {
                console.warn("Global XLSX object exists but is not functioning correctly");
            }
        }
        
        // Check if XLSX might be available under a different name
        const possibleXLSX = Object.keys(window).find(k => 
            typeof window[k] === 'object' && 
            window[k] && 
            typeof window[k].utils === 'object' && 
            typeof window[k].utils.book_new === 'function'
        );
        
        if (possibleXLSX) {
            console.log(`Found XLSX-like object under window.${possibleXLSX}`);
            
            // Verify it works
            if (verifyXLSX(window[possibleXLSX])) {
                window.XLSX = window[possibleXLSX];
                window.XLSX_READY = true;
                console.log("Using alternative XLSX implementation");
                return;
            }
        }
        
        // If we couldn't find a working XLSX, set the not-ready flag
        console.warn("No working XLSX implementation found - Excel export will use HTML fallback");
        window.XLSX_READY = false;
        
    } catch(e) {
        console.error("Error in XLSX global setup:", e);
        window.XLSX_READY = false;
    }
})(); 