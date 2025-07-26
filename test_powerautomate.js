const axios = require('axios');

async function testPowerAutomate() {
    try {
        console.log('🔍 Testing Power Automate endpoint for ticket status inquiry...\n');
        
        const powerAutomateUrl = 'https://prod-76.westus.logic.azure.com:443/workflows/c3aff0f092ae4d7ba7dcb3b2b6b8a6f8/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-xtL9wYiVsStTJdMnBmptAzXAuVvLEAtWauvTqqP3_g';
        
        const testEmail = 'vkumar9174@plummer.com';
        
        console.log(`📧 Testing with email: ${testEmail}`);
        console.log(`🌐 Endpoint: ${powerAutomateUrl.substring(0, 80)}...`);
        
        const response = await axios.post(powerAutomateUrl, {
            creatorEmail: testEmail
        }, {
            headers: { 
                'Content-Type': 'application/json' 
            },
            timeout: 30000 // 30 second timeout
        });
        
        console.log('\n✅ Response Status:', response.status);
        console.log('📊 Response Headers:');
        console.log('   Content-Type:', response.headers['content-type']);
        console.log('   Content-Length:', response.headers['content-length']);
        
        console.log('\n📄 Response Data:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // Check if response contains ticket data
        if (response.data) {
            if (Array.isArray(response.data)) {
                console.log(`\n🎯 Found ${response.data.length} tickets`);
                response.data.forEach((ticket, index) => {
                    console.log(`   Ticket ${index + 1}:`);
                    console.log(`     ID: ${ticket.ID || ticket.id || 'N/A'}`);
                    console.log(`     Title: ${ticket.Title || ticket.title || 'N/A'}`);
                    console.log(`     Status: ${ticket.Status || ticket.status || 'N/A'}`);
                });
            } else if (response.data.value && Array.isArray(response.data.value)) {
                console.log(`\n🎯 Found ${response.data.value.length} tickets in 'value' property`);
                response.data.value.forEach((ticket, index) => {
                    console.log(`   Ticket ${index + 1}:`);
                    console.log(`     ID: ${ticket.ID || ticket.id || 'N/A'}`);
                    console.log(`     Title: ${ticket.Title || ticket.title || 'N/A'}`);
                    console.log(`     Status: ${ticket.Status || ticket.status || 'N/A'}`);
                });
            } else {
                console.log('\n⚠️ Response data is not in expected array format');
                console.log('Data type:', typeof response.data);
                console.log('Data keys:', Object.keys(response.data));
            }
        }
        
    } catch (error) {
        console.error('\n❌ Error testing Power Automate:');
        console.error('Message:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Status Text:', error.response.statusText);
            console.error('Response Data:', error.response.data);
        }
    }
}

// Wait a moment for any async operations in Power Automate to complete
setTimeout(() => {
    testPowerAutomate();
}, 2000); 