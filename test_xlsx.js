// Test the XLSX library functionality
console.log('Testing if XLSX library works...');

// Load the XLSX library first
const script = document.createElement('script');
script.src = 'xlsx.full.min.js';
document.head.appendChild(script);

script.onload = function() {
  console.log('XLSX library loaded successfully');
  
  try {
    // Check if XLSX is available
    if (typeof XLSX === 'undefined') {
      console.error('XLSX is not defined!');
      return;
    }
    
    console.log('XLSX object available:', typeof XLSX);
    console.log('XLSX utils available:', typeof XLSX.utils);
    console.log('XLSX book_new function available:', typeof XLSX.utils?.book_new);
    console.log('XLSX write function available:', typeof XLSX.write);
    
    // Try to create a simple workbook
    const wb = XLSX.utils.book_new();
    console.log('Created workbook:', wb);
    
    // Create a worksheet with test data
    const wsData = [
      ['Name', 'Age'],
      ['John', 30],
      ['Jane', 25]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    console.log('Created worksheet:', ws);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Test');
    console.log('Added worksheet to workbook');
    
    // Generate XLSX content
    const opts = { bookType: 'xlsx', type: 'array' };
    const wbout = XLSX.write(wb, opts);
    console.log('Generated XLSX content, size:', wbout.byteLength, 'bytes');
    
    // Create blob
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    console.log('Created blob, size:', blob.size, 'bytes');
    
    // Test successful
    console.log('XLSX library test PASSED!');
  } catch (err) {
    console.error('XLSX library test FAILED!', err);
  }
};

script.onerror = function(err) {
  console.error('Failed to load XLSX library:', err);
}; 